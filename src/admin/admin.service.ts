import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaginationDto } from '../common/dto/pagination.dto';
import { User, UserDocument } from '../common/schemas/user/user.schema';
import { Transaction, TransactionDocument } from '../transaction/schemas/transaction.schema';
import { UpdateTransactionStatusDto } from './dto/update-transaction-status.dto';
import { UpdateUserAdministrationDto } from './dto/update-user-administration.dto';
import { TransactionMailService } from 'src/transaction/transaction-mail.service';
import { TransactionType } from 'src/transaction/enum/transaction-type.enum';

@Injectable()
export class AdminService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>, @InjectModel(Transaction.name) private readonly transactionModel: Model<TransactionDocument>, private readonly transactionMailService: TransactionMailService) { }

  async findUsers(pagination: PaginationDto) {
    const page = pagination.page ?? 1; const limit = pagination.limit ?? 20;
    const [data, total] = await Promise.all([this.userModel.find().select('-password -refreshToken').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit), this.userModel.countDocuments()]);
    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async updateUser(id: string, dto: UpdateUserAdministrationDto) {
    const user = await this.userModel.findByIdAndUpdate(id, dto, { new: true, runValidators: true }).select('-password -refreshToken');
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findTransactions(pagination: PaginationDto) {
    const page = pagination.page ?? 1; const limit = pagination.limit ?? 20;
    const [data, total] = await Promise.all([this.transactionModel.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit), this.transactionModel.countDocuments()]);
    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async updateTransactionStatus(id: string, dto: UpdateTransactionStatusDto) {
    const transaction = await this.transactionModel.findByIdAndUpdate(id, dto, { new: true, runValidators: true });
    if (!transaction) throw new NotFoundException('Transaction not found');
    if ([TransactionType.DEPOSIT, TransactionType.WITHDRAW].includes(transaction.type)) {
      await this.transactionMailService.sendPendingTransactionToAdmin(transaction);
    }
    return transaction;
  }
}
