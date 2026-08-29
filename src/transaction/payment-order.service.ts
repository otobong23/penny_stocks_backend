import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../common/schemas/user/user.schema';
import { CreateDepositOrderDto } from './dto/create-deposit-order.dto';
import { CreateWithdrawOrderDto } from './dto/create-withdraw-order.dto';
import { SubmitPaymentProofDto } from './dto/submit-payment-proof.dto';
import { PaymentOrderStatus } from './enum/payment-order-status.enum';
import { TransactionStatus } from './enum/transaction-status.enum';
import { TransactionType } from './enum/transaction-type.enum';
import { PaymentOrder, PaymentOrderDocument } from './schemas/payment-order.schema';
import { Transaction, TransactionDocument } from './schemas/transaction.schema';
import { TransactionMailService } from './transaction-mail.service';

const OPEN_ORDER_STATUSES = [
  PaymentOrderStatus.PENDING,
  PaymentOrderStatus.AWAITING_PAYMENT,
  PaymentOrderStatus.AWAITING_CONFIRMATION,
];

@Injectable()
export class PaymentOrderService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PaymentOrderService.name);
  private expiryTimer?: NodeJS.Timeout;
  constructor(
    @InjectModel(PaymentOrder.name) private readonly orderModel: Model<PaymentOrderDocument>,
    @InjectModel(Transaction.name) private readonly transactionModel: Model<TransactionDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly mailService: TransactionMailService,
  ) {}

  onModuleInit() {
    this.expiryTimer = setInterval(() => {
      void this.expireOpenOrders().catch((error) => this.logger.error('Failed to expire payment orders', error instanceof Error ? error.stack : undefined));
    }, 30_000);
  }

  onModuleDestroy() { if (this.expiryTimer) clearInterval(this.expiryTimer); }

  private expiresAt() { return new Date(Date.now() + 24 * 60 * 60 * 1000); }

  async expireOpenOrders() {
    const expired = await this.orderModel.find({ status: { $in: OPEN_ORDER_STATUSES }, expiresAt: { $lte: new Date() } });
    for (const order of expired) {
      const updated = await this.orderModel.findOneAndUpdate(
        { _id: order._id, status: { $in: OPEN_ORDER_STATUSES } },
        { status: PaymentOrderStatus.EXPIRED },
        { new: true },
      );
      if (!updated) continue;
      if (updated.transactionId) await this.transactionModel.findByIdAndUpdate(updated.transactionId, { status: TransactionStatus.FAILED });
      await this.mailService.sendOrderActivityToAdmin(updated, 'expired');
      await this.mailService.sendOrderActivityToUser(updated, 'expired');
    }
  }

  private async assertNoOpenOrder(userId: string) {
    await this.expireOpenOrders();
    const existing = await this.orderModel.exists({ userId, status: { $in: OPEN_ORDER_STATUSES }, expiresAt: { $gt: new Date() } });
    if (existing) throw new ConflictException('You already have a pending deposit or withdrawal order');
  }

  async createDeposit(userId: string, dto: CreateDepositOrderDto) {
    await this.assertNoOpenOrder(userId);
    const user = await this.userModel.findById(userId).select('email');
    if (!user) throw new NotFoundException('User not found');
    const order = await this.orderModel.create({ userId: user._id, email: user.email, type: TransactionType.DEPOSIT, ...dto, expiresAt: this.expiresAt() });
    await this.mailService.sendOrderActivityToAdmin(order, 'created');
    await this.mailService.sendOrderActivityToUser(order, 'created');
    return order;
  }

  async createWithdraw(userId: string, dto: CreateWithdrawOrderDto) {
    await this.assertNoOpenOrder(userId);
    const user = await this.userModel.findById(userId).select('email');
    if (!user) throw new NotFoundException('User not found');
    const order = await this.orderModel.create({
      userId: user._id, email: user.email, type: TransactionType.WITHDRAW, ...dto,
      expiresAt: this.expiresAt(), status: PaymentOrderStatus.AWAITING_CONFIRMATION,
    });
    const transaction = await this.transactionModel.create({
      userId: user._id, email: user.email, type: TransactionType.WITHDRAW, amount: dto.amount,
      reference: order.orderID, orderId: order._id, note: `Withdrawal via ${dto.method}`, status: TransactionStatus.PENDING,
    });
    order.transactionId = transaction._id;
    await order.save();
    await this.mailService.sendOrderActivityToAdmin(order, 'created');
    await this.mailService.sendOrderActivityToUser(order, 'created');
    return order;
  }

  async submitDepositProof(userId: string, orderId: string, dto: SubmitPaymentProofDto) {
    await this.expireOpenOrders();
    const order = await this.orderModel.findOne({ _id: orderId, userId, type: TransactionType.DEPOSIT });
    if (!order) throw new NotFoundException('Deposit order not found');
    if (order.status !== PaymentOrderStatus.AWAITING_PAYMENT || !order.isMethodIncluded) {
      throw new BadRequestException('Payment instructions have not been provided or this order is no longer payable');
    }
    const transaction = await this.transactionModel.create({
      userId: order.userId, email: order.email, type: TransactionType.DEPOSIT, amount: order.amount,
      reference: order.orderID, orderId: order._id, note: `Deposit via ${order.method}`,
      proofPaymentDocument: dto.proofPaymentDocument, status: TransactionStatus.PENDING,
    });
    order.proofPaymentDocument = dto.proofPaymentDocument;
    order.transactionId = transaction._id;
    order.status = PaymentOrderStatus.AWAITING_CONFIRMATION;
    await order.save();
    await this.mailService.sendOrderActivityToAdmin(order, 'payment proof submitted');
    await this.mailService.sendOrderActivityToUser(order, 'payment proof submitted');
    return order;
  }

  async findMine(userId: string) {
    await this.expireOpenOrders();
    return this.orderModel.find({ userId }).sort({ createdAt: -1 });
  }

  async findAll() {
    await this.expireOpenOrders();
    return this.orderModel.find().sort({ createdAt: -1 });
  }

  async updateByAdmin(orderId: string, methodDetails?: string, status?: PaymentOrderStatus.COMPLETED | PaymentOrderStatus.REJECTED) {
    await this.expireOpenOrders();
    const order = await this.orderModel.findById(orderId);
    if (!order) throw new NotFoundException('Payment order not found');
    if (order.expiresAt <= new Date() || !OPEN_ORDER_STATUSES.includes(order.status)) throw new BadRequestException('This order is no longer active');

    if (methodDetails !== undefined) {
      if (order.type !== TransactionType.DEPOSIT) throw new BadRequestException('Method instructions can only be added to deposit orders');
      if (order.status !== PaymentOrderStatus.PENDING) throw new BadRequestException('Payment instructions have already been handled for this order');
      order.methodDetails = methodDetails;
      order.isMethodIncluded = true;
      order.status = PaymentOrderStatus.AWAITING_PAYMENT;
      await order.save();
      await this.mailService.sendOrderActivityToAdmin(order, 'payment instructions provided');
      await this.mailService.sendOrderActivityToUser(order, 'payment instructions provided');
    }
    if (!status) return order;

    if (status === PaymentOrderStatus.REJECTED) {
      order.status = PaymentOrderStatus.REJECTED;
      await order.save();
      if (order.transactionId) await this.transactionModel.findByIdAndUpdate(order.transactionId, { status: TransactionStatus.FAILED });
    } else if (order.type === TransactionType.DEPOSIT) {
      if (order.status !== PaymentOrderStatus.AWAITING_CONFIRMATION || !order.transactionId) throw new BadRequestException('A deposit proof is required before approval');
      await this.transactionModel.findByIdAndUpdate(order.transactionId, { status: TransactionStatus.COMPLETED });
      const user = await this.userModel.findByIdAndUpdate(order.userId, { $inc: { balance: order.amount, totalDeposit: order.amount, transactionCount: 1 } }, { new: true });
      if (!user) throw new NotFoundException('User not found');
      order.status = PaymentOrderStatus.COMPLETED;
      await order.save();
    } else {
      const user = await this.userModel.findOneAndUpdate(
        { _id: order.userId, balance: { $gte: order.amount } },
        { $inc: { balance: -order.amount, totalWithdraw: order.amount, transactionCount: 1 } }, { new: true },
      );
      if (!user) throw new BadRequestException('User has insufficient balance to approve this withdrawal');
      await this.transactionModel.findByIdAndUpdate(order.transactionId, { status: TransactionStatus.COMPLETED });
      order.status = PaymentOrderStatus.COMPLETED;
      await order.save();
    }
    await this.mailService.sendOrderActivityToAdmin(order, order.status);
    await this.mailService.sendOrderActivityToUser(order, order.status);
    return order;
  }
}
