import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { User, UserDocument } from '../common/schemas/user/user.schema';
import { Transaction, TransactionDocument } from '../transaction/schemas/transaction.schema';
import { TransactionStatus } from '../transaction/enum/transaction-status.enum';
import { TransactionType } from '../transaction/enum/transaction-type.enum';
import { BuyStockDto } from './dto/buy-stock.dto';
import { SellStockDto } from './dto/sell-stock.dto';
import { CreateStockDto } from './dto/create-stock.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { Stock, StockDocument } from './schemas/stock.schema';
import { StockPurchase, StockPurchaseDocument } from './schemas/stock-purchase.schema';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class StockService {
  constructor(
    @InjectModel(Stock.name) private readonly stockModel: Model<StockDocument>,
    @InjectModel(StockPurchase.name) private readonly purchaseModel: Model<StockPurchaseDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Transaction.name) private readonly transactionModel: Model<TransactionDocument>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async findAll(pagination: PaginationDto) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;
    const [data, total] = await Promise.all([
      this.stockModel.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      this.stockModel.countDocuments(),
    ]);
    // return this.stockModel.find().sort({ acronym: 1 });
    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const stock = await this.stockModel.findById(id);
    if (!stock) throw new NotFoundException('Stock not found');
    return stock;
  }

  async create(dto: CreateStockDto) {
    try { return await this.stockModel.create({ ...dto, acronym: dto.acronym.toUpperCase(), currency: dto.currency?.toUpperCase() || 'USD' }); }
    catch (error: any) { if (error?.code === 11000) throw new ConflictException('A stock with this acronym already exists'); throw error; }
  }

  async update(id: string, dto: UpdateStockDto) {
    try {
      const stock = await this.stockModel.findByIdAndUpdate(id, { ...dto, ...(dto.acronym && { acronym: dto.acronym.toUpperCase() }), ...(dto.currency && { currency: dto.currency.toUpperCase() }) }, { new: true, runValidators: true });
      if (!stock) throw new NotFoundException('Stock not found');
      return stock;
    } catch (error: any) { if (error?.code === 11000) throw new ConflictException('A stock with this acronym already exists'); throw error; }
  }

  async remove(id: string) {
    const stock = await this.stockModel.findByIdAndDelete(id);
    if (!stock) throw new NotFoundException('Stock not found');
    return { message: 'Stock deleted successfully' };
  }

  async buy(userId: string, stockId: string, dto: BuyStockDto) {
    const session = await this.connection.startSession();
    let result: { purchase: StockPurchaseDocument; transaction: TransactionDocument } | undefined;
    try {
      await session.withTransaction(async () => {
        const stock = await this.stockModel.findById(stockId).session(session);
        if (!stock) throw new NotFoundException('Stock not found');
        const totalAmount = Number((stock.lastPrice * dto.quantity).toFixed(8));
        if (totalAmount <= 0) throw new BadRequestException('Stock purchase total must be greater than zero');
        const user = await this.userModel.findOneAndUpdate({ _id: userId, balance: { $gte: totalAmount } }, { $inc: { balance: -totalAmount } }, { new: true, session });
        if (!user) throw new BadRequestException('Insufficient balance to buy this stock');
        const [purchase] = await this.purchaseModel.create([{ userId: user._id, stockId: stock._id, stockName: stock.name, stockAcronym: stock.acronym, quantity: dto.quantity, remainingQuantity: dto.quantity, soldQuantity: 0, status: 'open', pricePerShare: stock.lastPrice, totalAmount, currency: stock.currency }], { session });
        const [transaction] = await this.transactionModel.create([{ userId: user._id, email: user.email, type: TransactionType.BUY, amount: totalAmount, currency: stock.currency, reference: String(purchase._id), note: `Bought ${dto.quantity} ${stock.acronym} shares at ${stock.lastPrice}` , status: TransactionStatus.COMPLETED }], { session });
        result = { purchase, transaction };
      });
      return result!;
    } finally { await session.endSession(); }
  }

  async getMyPurchases(userId: string) {
    return this.purchaseModel.find({ userId }).sort({ createdAt: -1 }).populate('stockId').lean();
  }

  async sell(userId: string, purchaseId: string, dto: SellStockDto) {
    const session = await this.connection.startSession();
    let result: { purchase: StockPurchaseDocument; transaction: TransactionDocument; proceeds: number } | undefined;
    try {
      await session.withTransaction(async () => {
        const purchase = await this.purchaseModel.findOne({ _id: purchaseId, userId }).session(session);
        if (!purchase) throw new NotFoundException('Stock purchase not found');
        // Purchases created before this field existed are treated as wholly open.
        const remaining = purchase.remainingQuantity ?? purchase.quantity;
        if (dto.quantity > remaining) throw new BadRequestException('Cannot sell more shares than are currently owned');
        const stock = await this.stockModel.findById(purchase.stockId).session(session);
        if (!stock) throw new NotFoundException('Stock no longer exists');
        const proceeds = Number((stock.lastPrice * dto.quantity).toFixed(8));
        if (proceeds <= 0) throw new BadRequestException('Stock sale proceeds must be greater than zero');
        const newRemaining = Number((remaining - dto.quantity).toFixed(8));
        purchase.remainingQuantity = newRemaining;
        purchase.soldQuantity = Number(((purchase.soldQuantity ?? 0) + dto.quantity).toFixed(8));
        purchase.status = newRemaining === 0 ? 'closed' : 'open';
        await purchase.save({ session });
        const user = await this.userModel.findByIdAndUpdate(userId, { $inc: { balance: proceeds } }, { new: true, session });
        if (!user) throw new NotFoundException('User not found');
        const [transaction] = await this.transactionModel.create([{ userId: user._id, email: user.email, type: TransactionType.SELL, amount: proceeds, currency: stock.currency, reference: String(purchase._id), note: `Sold ${dto.quantity} ${stock.acronym} shares at ${stock.lastPrice}`, status: TransactionStatus.COMPLETED }], { session });
        result = { purchase, transaction, proceeds };
      });
      return result!;
    } finally { await session.endSession(); }
  }
}
