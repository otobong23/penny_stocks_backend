import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { User, UserDocument } from '../common/schemas/user/user.schema';
import { Transaction, TransactionDocument } from '../transaction/schemas/transaction.schema';
import { TransactionStatus } from '../transaction/enum/transaction-status.enum';
import { TransactionType } from '../transaction/enum/transaction-type.enum';
import { BuyCopyTradingDto } from './dto/buy-copy-trading.dto';
import { CreateCopyTradingDto } from './dto/create-copy-trading.dto';
import { UpdateCopyTradingDto } from './dto/update-copy-trading.dto';
import { CopyTradePurchase, CopyTradePurchaseDocument } from './schemas/copy-trade-purchase.schema';
import { CopyTrading, CopyTradingDocument } from './schemas/copy-trading.schema';

@Injectable()
export class CopyTradingService {
  constructor(
    @InjectModel(CopyTrading.name) private readonly copyTradingModel: Model<CopyTradingDocument>,
    @InjectModel(CopyTradePurchase.name) private readonly purchaseModel: Model<CopyTradePurchaseDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Transaction.name) private readonly transactionModel: Model<TransactionDocument>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  findAll() { return this.copyTradingModel.find().sort({ createdAt: -1 }); }

  async findOne(id: string) {
    const trade = await this.copyTradingModel.findById(id);
    if (!trade) throw new NotFoundException('Copy-trading plan not found');
    return trade;
  }

  create(dto: CreateCopyTradingDto) { return this.copyTradingModel.create(dto); }

  async update(id: string, dto: UpdateCopyTradingDto) {
    const trade = await this.copyTradingModel.findByIdAndUpdate(id, dto, { new: true, runValidators: true });
    if (!trade) throw new NotFoundException('Copy-trading plan not found');
    return trade;
  }

  async remove(id: string) {
    const trade = await this.copyTradingModel.findByIdAndDelete(id);
    if (!trade) throw new NotFoundException('Copy-trading plan not found');
    return { message: 'Copy-trading plan deleted successfully' };
  }

  async buy(userId: string, tradeId: string, dto: BuyCopyTradingDto) {
    const session = await this.connection.startSession();
    let result: { purchase: CopyTradePurchaseDocument; transaction: TransactionDocument } | undefined;
    try {
      await session.withTransaction(async () => {
        const trade = await this.copyTradingModel.findById(tradeId).session(session);
        if (!trade) throw new NotFoundException('Copy-trading plan not found');
        if (dto.amountInvested < trade.copyTradePrice) throw new BadRequestException(`Amount invested must be at least the copy-trade price of ${trade.copyTradePrice}`);
        const days = Number.parseInt(trade.duration, 10);
        if (!Number.isFinite(days) || days < 1) throw new BadRequestException('Copy-trading plan has an invalid duration');
        const user = await this.userModel.findOneAndUpdate({ _id: userId, balance: { $gte: dto.amountInvested } }, { $inc: { balance: -dto.amountInvested } }, { new: true, session });
        if (!user) throw new BadRequestException('Insufficient balance to buy this copy trade');
        const expiredAt = new Date(); expiredAt.setUTCDate(expiredAt.getUTCDate() + days);
        const [purchase] = await this.purchaseModel.create([{ userId: user._id, copyTradingId: trade._id, traderName: trade.traderName, riskLevel: trade.riskLevel, duration: trade.duration, rateOfChange: trade.rateOfChange, averageDailyProfit: trade.averageDailyProfit, purchases: trade.purchases, totalAssets: trade.totalAssets, copyTradePrice: trade.copyTradePrice, amountInvested: dto.amountInvested, currency: trade.currency, expiredAt }], { session });
        const [transaction] = await this.transactionModel.create([{ userId: user._id, email: user.email, type: TransactionType.COPY_TRADE, amount: dto.amountInvested, currency: trade.currency, reference: String(purchase._id), note: `Copy trade with ${trade.traderName} for ${trade.duration}`, status: TransactionStatus.COMPLETED }], { session });
        result = { purchase, transaction };
      });
      return result!;
    } finally { await session.endSession(); }
  }
}
