import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from 'src/common/schemas/user/user.schema';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionStatus } from './enum/transaction-status.enum';
import { TransactionType } from './enum/transaction-type.enum';
import { Transaction, TransactionDocument } from './schemas/transaction.schema';
import { TransactionMailService } from './transaction-mail.service';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class TransactionService {
  constructor(
    @InjectModel(Transaction.name) private readonly transactionModel: Model<TransactionDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly transactionMailService: TransactionMailService,
  ) {}

  async create(userId: string, dto: CreateTransactionDto) {
    if ([TransactionType.PROFIT, TransactionType.LOSS, TransactionType.DEPOSIT, TransactionType.WITHDRAW].includes(dto.type)) {
      throw new BadRequestException(`${dto.type} transactions must be created through their dedicated workflow`);
    }
    const user = await this.userModel.findById(userId).select('email');
    if (!user) throw new NotFoundException('User not found');
    const transaction = await this.transactionModel.create({
      userId: user._id,
      email: user.email,
      type: dto.type,
      amount: dto.amount,
      currency: dto.currency || 'USD',
      reference: dto.reference,
      note: dto.note,
      status: TransactionStatus.PENDING,
    });
    if ([TransactionType.DEPOSIT, TransactionType.WITHDRAW].includes(transaction.type)) {
      await this.transactionMailService.sendPendingTransactionToAdmin(transaction);
    }
    return transaction;
  }

  async findMine(userId: string, pagination: PaginationDto) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;
    const [data, total] = await Promise.all([
      this.transactionModel.find({ userId }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      this.transactionModel.countDocuments({ userId }),
    ]);
    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOneMine(userId: string, transactionId: string) {
    const transaction = await this.transactionModel.findOne({ _id: transactionId, userId });
    if (!transaction) throw new NotFoundException('Transaction not found');
    return transaction;
  }

  /** Intended for a future AdminService; it deliberately does not change transaction status. */
  async findByIdForAdmin(transactionId: string) {
    const transaction = await this.transactionModel.findById(transactionId);
    if (!transaction) throw new NotFoundException('Transaction not found');
    return transaction;
  }
}
