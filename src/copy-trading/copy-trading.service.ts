import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { User, UserDocument } from '../common/schemas/user/user.schema';
import { Transaction, TransactionDocument } from '../transaction/schemas/transaction.schema';
import { TransactionStatus } from '../transaction/enum/transaction-status.enum';
import { TransactionType } from '../transaction/enum/transaction-type.enum';
import { BuyCopyTradingDto } from './dto/buy-copy-trading.dto';
import { LiquidateCopyTradingDto } from './dto/liquidate-copy-trading.dto';
import { CreateCopyTradingDto } from './dto/create-copy-trading.dto';
import { UpdateCopyTradingDto } from './dto/update-copy-trading.dto';
import { CopyTradePurchase, CopyTradePurchaseDocument } from './schemas/copy-trade-purchase.schema';
import { CopyTrading, CopyTradingDocument } from './schemas/copy-trading.schema';
import { CopyTradingPortfolio, CopyTradingPortfolioDocument } from './schemas/copy-trading-portfolio.schema';
import { CopyTradingPortfolioTransferDto } from './dto/copy-trading-portfolio-transfer.dto';

@Injectable()
export class CopyTradingService {
  constructor(
    @InjectModel(CopyTrading.name) private readonly copyTradingModel: Model<CopyTradingDocument>,
    @InjectModel(CopyTradePurchase.name) private readonly purchaseModel: Model<CopyTradePurchaseDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Transaction.name) private readonly transactionModel: Model<TransactionDocument>,
    @InjectModel(CopyTradingPortfolio.name) private readonly portfolioModel: Model<CopyTradingPortfolioDocument>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  findAll() { return this.copyTradingModel.find().sort({ createdAt: -1 }); }

  async findOne(id: string) {
    const trade = await this.copyTradingModel.findById(id);
    if (!trade) throw new NotFoundException('Copy-trading plan not found');
    return trade;
  }

  create(dto: CreateCopyTradingDto) { return this.copyTradingModel.create(dto); }

  async getPortfolio(userId: string) {
    const portfolio = await this.portfolioModel.findOne({ userId });
    if (portfolio) return portfolio;
    const user = await this.userModel.findById(userId).select('_id');
    if (!user) throw new NotFoundException('User not found');
    return this.portfolioModel.findOneAndUpdate(
      { userId: user._id },
      { $setOnInsert: { userId: user._id, balance: 0, currency: 'USD', totalDeposited: 0, totalWithdrawn: 0, totalInvested: 0, totalLiquidated: 0 } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
  }

  async depositToPortfolio(userId: string, dto: CopyTradingPortfolioTransferDto) {
    const session = await this.connection.startSession();
    let result: { portfolio: CopyTradingPortfolioDocument; transaction: TransactionDocument } | undefined;
    try {
      await session.withTransaction(async () => {
        const user = await this.userModel.findOneAndUpdate(
          { _id: userId, balance: { $gte: dto.amount } },
          { $inc: { balance: -dto.amount } },
          { new: true, session },
        );
        if (!user) throw new BadRequestException('Insufficient main balance to fund copy-trading portfolio');
        const portfolio = await this.portfolioModel.findOneAndUpdate(
          { userId: user._id },
          { $setOnInsert: { userId: user._id, currency: 'USD' }, $inc: { balance: dto.amount, totalDeposited: dto.amount } },
          { new: true, upsert: true, session, setDefaultsOnInsert: true },
        );
        const [transaction] = await this.transactionModel.create([{
          userId: user._id, email: user.email, type: TransactionType.COPY_TRADE_DEPOSIT,
          amount: dto.amount, currency: portfolio.currency, reference: String(portfolio._id),
          note: 'Transferred from main balance to copy-trading portfolio', status: TransactionStatus.COMPLETED,
        }], { session });
        result = { portfolio, transaction };
      });
      return result!;
    } finally { await session.endSession(); }
  }

  async withdrawFromPortfolio(userId: string, dto: CopyTradingPortfolioTransferDto) {
    const session = await this.connection.startSession();
    let result: { portfolio: CopyTradingPortfolioDocument; transaction: TransactionDocument } | undefined;
    try {
      await session.withTransaction(async () => {
        const portfolio = await this.portfolioModel.findOneAndUpdate(
          { userId, balance: { $gte: dto.amount } },
          { $inc: { balance: -dto.amount, totalWithdrawn: dto.amount } },
          { new: true, session },
        );
        if (!portfolio) throw new BadRequestException('Insufficient copy-trading portfolio balance');
        const user = await this.userModel.findByIdAndUpdate(userId, { $inc: { balance: dto.amount } }, { new: true, session });
        if (!user) throw new NotFoundException('User not found');
        const [transaction] = await this.transactionModel.create([{
          userId: user._id, email: user.email, type: TransactionType.COPY_TRADE_WITHDRAW,
          amount: dto.amount, currency: portfolio.currency, reference: String(portfolio._id),
          note: 'Transferred from copy-trading portfolio to main balance', status: TransactionStatus.COMPLETED,
        }], { session });
        result = { portfolio, transaction };
      });
      return result!;
    } finally { await session.endSession(); }
  }

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
        const days = Number.parseInt(trade.duration, 10);
        if (!Number.isFinite(days) || days < 1) throw new BadRequestException('Copy-trading plan has an invalid duration');
        const portfolio = await this.portfolioModel.findOneAndUpdate(
          { userId, balance: { $gte: dto.amountInvested } },
          { $inc: { balance: -dto.amountInvested, totalInvested: dto.amountInvested } },
          { new: true, session },
        );
        if (!portfolio) throw new BadRequestException('Insufficient copy-trading portfolio balance');
        if (portfolio.currency !== trade.currency) throw new BadRequestException('Copy-trading plan currency does not match portfolio currency');
        const user = await this.userModel.findById(userId).session(session);
        if (!user) throw new NotFoundException('User not found');
        const expiredAt = new Date(); expiredAt.setUTCDate(expiredAt.getUTCDate() + days);
        const [purchase] = await this.purchaseModel.create([{ userId: user._id, copyTradingId: trade._id, traderName: trade.traderName, riskLevel: trade.riskLevel, duration: trade.duration, rateOfChange: trade.rateOfChange, averageDailyProfit: trade.averageDailyProfit, purchases: trade.purchases, totalAssets: trade.totalAssets, percentage: trade.percentage, amountInvested: dto.amountInvested, currency: trade.currency, expiredAt, status: 'active' }], { session });
        const [transaction] = await this.transactionModel.create([{ userId: user._id, email: user.email, type: TransactionType.COPY_TRADE, amount: dto.amountInvested, currency: trade.currency, reference: String(purchase._id), note: `Copy trade with ${trade.traderName} for ${trade.duration}`, status: TransactionStatus.COMPLETED }], { session });
        result = { purchase, transaction };
      });
      return result!;
    } finally { await session.endSession(); }
  }

  async getMyPurchases(userId: string) {
    return this.purchaseModel.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 }).populate('copyTradingId').lean();
  }

  async liquidate(userId: string, purchaseId: string, dto: LiquidateCopyTradingDto) {
    const session = await this.connection.startSession();
    let result: { purchase: CopyTradePurchaseDocument; transaction: TransactionDocument; payout: number; fee: number } | undefined;
    try {
      await session.withTransaction(async () => {
        const purchase = await this.purchaseModel.findOne({ _id: purchaseId, userId }).session(session);
        if (!purchase) throw new NotFoundException('Copy-trade purchase not found');
        if (purchase.status === 'liquidated' || purchase.liquidatedAt) throw new BadRequestException('This copy-trade purchase has already been liquidated');
        if (purchase.expiredAt > new Date()) throw new BadRequestException('This copy trade can only be liquidated after its duration has ended');
        // Calculate the trade's gross return, then deduct its percentage fee before crediting the portfolio.
        const grossPayout = Number((purchase.amountInvested * (1 + purchase.rateOfChange / 100)).toFixed(8));
        const fee = Number((grossPayout * (purchase.percentage / 100)).toFixed(8));
        const payout = Number((grossPayout - fee).toFixed(8));
        if (payout <= 0) throw new BadRequestException('This copy trade has an invalid liquidation value');
        purchase.status = 'liquidated';
        purchase.liquidatedAt = new Date();
        purchase.liquidationAmount = payout;
        purchase.liquidationFee = fee;
        await purchase.save({ session });
        const portfolio = await this.portfolioModel.findOneAndUpdate(
          { userId }, { $inc: { balance: payout, totalLiquidated: payout } }, { new: true, session },
        );
        if (!portfolio) throw new NotFoundException('Copy-trading portfolio not found');
        const user = await this.userModel.findById(userId).session(session);
        if (!user) throw new NotFoundException('User not found');
        const [transaction] = await this.transactionModel.create([{ userId: user._id, email: user.email, type: TransactionType.COPY_TRADE_LIQUIDATION, amount: payout, currency: purchase.currency, reference: String(purchase._id), note: dto.note ?? `Liquidated copy trade with ${purchase.traderName}; ${fee} deducted (${purchase.percentage}%)`, status: TransactionStatus.COMPLETED }], { session });
        result = { purchase, transaction, payout, fee };
      });
      return result!;
    } finally { await session.endSession(); }
  }
}
