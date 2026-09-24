import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PaginationDto } from '../common/dto/pagination.dto';
import { User, UserDocument } from '../common/schemas/user/user.schema';
import { Transaction, TransactionDocument } from '../transaction/schemas/transaction.schema';
import { UpdateTransactionStatusDto } from './dto/update-transaction-status.dto';
import { UpdateUserAdministrationDto } from './dto/update-user-administration.dto';
import { TransactionMailService } from 'src/transaction/transaction-mail.service';
import { TransactionType } from 'src/transaction/enum/transaction-type.enum';
import { PaymentOrderService } from '../transaction/payment-order.service';
import { UpdatePaymentOrderDto } from './dto/update-payment-order.dto';
import { StockPurchase, StockPurchaseDocument } from '../stock/schemas/stock-purchase.schema';
import { CopyTradePurchase, CopyTradePurchaseDocument } from '../copy-trading/schemas/copy-trade-purchase.schema';
import { StockProposal, StockProposalDocument } from '../stock-proposal/schemas/stock-proposal.schema';
import { AdminCopyTradePurchaseQueryDto, AdminStockPurchaseQueryDto } from './dto/admin-purchase-query.dto';
import { ProposalQueryDto } from '../stock-proposal/dto/proposal-query.dto';
import { CopyTradingPortfolio, CopyTradingPortfolioDocument } from '../copy-trading/schemas/copy-trading-portfolio.schema';
import { UpdateCopyTradingPortfolioDto } from './dto/update-copy-trading-portfolio.dto';

@Injectable()
export class AdminService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>, @InjectModel(Transaction.name) private readonly transactionModel: Model<TransactionDocument>, @InjectModel(StockPurchase.name) private readonly stockPurchaseModel: Model<StockPurchaseDocument>, @InjectModel(CopyTradePurchase.name) private readonly copyTradePurchaseModel: Model<CopyTradePurchaseDocument>, @InjectModel(StockProposal.name) private readonly stockProposalModel: Model<StockProposalDocument>, @InjectModel(CopyTradingPortfolio.name) private readonly copyTradingPortfolioModel: Model<CopyTradingPortfolioDocument>, private readonly transactionMailService: TransactionMailService, private readonly paymentOrderService: PaymentOrderService) { }

  findPaymentOrders() { return this.paymentOrderService.findAll(); }

  updatePaymentOrder(id: string, dto: UpdatePaymentOrderDto) {
    return this.paymentOrderService.updateByAdmin(id, dto.methodDetails, dto.status);
  }

  async findUsers(pagination: PaginationDto) {
    const page = pagination.page ?? 1; const limit = pagination.limit ?? 20;
    const [data, total] = await Promise.all([this.userModel.find().select('-password -refreshToken').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit), this.userModel.countDocuments()]);
    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async updateUser(id: string, dto: UpdateUserAdministrationDto) {
    const user = await this.userModel.findByIdAndUpdate(id, dto, { returnDocument: 'after', runValidators: true }).select('-password -refreshToken');
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findTransactions(pagination: PaginationDto) {
    const page = pagination.page ?? 1; const limit = pagination.limit ?? 20;
    const [data, total] = await Promise.all([this.transactionModel.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit), this.transactionModel.countDocuments()]);
    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findStockPurchases(query: AdminStockPurchaseQueryDto) {
    const page = query.page ?? 1; const limit = query.limit ?? 20;
    const filter = { ...(query.userId && { userId: new Types.ObjectId(query.userId) }), ...(query.status && { status: query.status }) };
    const [data, total] = await Promise.all([
      this.stockPurchaseModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('userId', 'userID email firstName lastName').populate('stockId', 'name acronym').lean(),
      this.stockPurchaseModel.countDocuments(filter),
    ]);
    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findCopyTradePurchases(query: AdminCopyTradePurchaseQueryDto) {
    const page = query.page ?? 1; const limit = query.limit ?? 20;
    const filter = { ...(query.userId && { userId: new Types.ObjectId(query.userId) }), ...(query.status && { status: query.status }) };
    const [data, total] = await Promise.all([
      this.copyTradePurchaseModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('userId', 'userID email firstName lastName').populate('copyTradingId', 'traderName currency').lean(),
      this.copyTradePurchaseModel.countDocuments(filter),
    ]);
    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findCopyTradingPortfolios(pagination: PaginationDto) {
    const page = pagination.page ?? 1; const limit = pagination.limit ?? 20;
    const [data, total] = await Promise.all([
      this.copyTradingPortfolioModel.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('userId', 'userID email firstName lastName').lean(),
      this.copyTradingPortfolioModel.countDocuments(),
    ]);
    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findCopyTradingPortfolio(userId: string) {
    const portfolio = await this.copyTradingPortfolioModel.findOne({ userId: new Types.ObjectId(userId) });
    if (!portfolio) throw new NotFoundException('Copy-trading portfolio not found');
    return portfolio;
  }

  async updateCopyTradingPortfolio(id: string, dto: UpdateCopyTradingPortfolioDto) {
    // const portfolio = await this.copyTradingPortfolioModel.findByIdAndUpdate(id, dto, { returnDocument: 'after', runValidators: true }).populate('userId', 'userID email firstName lastName');
    const portfolio = await this.copyTradingPortfolioModel.findByIdAndUpdate(id, dto, { returnDocument: 'after', runValidators: true });
    if (!portfolio) throw new NotFoundException('Copy-trading portfolio not found');
    return portfolio;
  }

  async removeCopyTradingPortfolio(id: string) {
    const portfolio = await this.copyTradingPortfolioModel.findByIdAndDelete(id);
    if (!portfolio) throw new NotFoundException('Copy-trading portfolio not found');
    return { message: 'Copy-trading portfolio deleted successfully' };
  }

  async findUserStockProposals(userId: string, query: ProposalQueryDto) {
    const page = query.page ?? 1; const limit = query.limit ?? 20;
    const filter = { proposedBy: new Types.ObjectId(userId), ...(query.status && { status: query.status }) };
    const [data, total] = await Promise.all([
      this.stockProposalModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('proposedBy', 'userID email firstName lastName').lean(),
      this.stockProposalModel.countDocuments(filter),
    ]);
    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async updateTransactionStatus(id: string, dto: UpdateTransactionStatusDto) {
    const existing = await this.transactionModel.findById(id);
    if (!existing) throw new NotFoundException('Transaction not found');
    if (existing.orderId) throw new BadRequestException('Use the payment-order endpoint to update an order transaction');
    const transaction = await this.transactionModel.findByIdAndUpdate(id, dto, { new: true, runValidators: true });
    if (!transaction) throw new NotFoundException('Transaction not found');
    if (transaction.status === 'pending' && [TransactionType.DEPOSIT, TransactionType.WITHDRAW].includes(transaction.type)) {
      await this.transactionMailService.sendPendingTransactionToAdmin(transaction);
    }
    if (transaction.status === 'completed') await this.transactionMailService.sendCompletedTransactionToUser(transaction);
    return transaction;
  }
}
