import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { Stock, StockDocument } from '../stock/schemas/stock.schema';
import { CreateStockProposalDto } from './dto/create-stock-proposal.dto';
import { ApproveStockProposalDto } from './dto/approve-stock-proposal.dto';
import { RejectStockProposalDto } from './dto/reject-stock-proposal.dto';
import { ProposalQueryDto } from './dto/proposal-query.dto';
import { ProposalStatus } from './enum/proposal-status.enum';
import { StockProposal, StockProposalDocument } from './schemas/stock-proposal.schema';

@Injectable()
export class StockProposalService {
  constructor(
    @InjectModel(StockProposal.name) private readonly proposalModel: Model<StockProposalDocument>,
    @InjectModel(Stock.name) private readonly stockModel: Model<StockDocument>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  create(userId: string, dto: CreateStockProposalDto) {
    return this.proposalModel.create({ ...dto, proposedBy: userId, ticker: dto.ticker.toUpperCase(), currency: dto.currency?.toUpperCase() ?? 'USD' });
  }

  async findMine(userId: string, query: ProposalQueryDto) { return this.find({ ...query, userId }); }
  async findAll(query: ProposalQueryDto) { return this.find(query); }

  private async find(query: ProposalQueryDto & { userId?: string }) {
    const page = query.page ?? 1; const limit = query.limit ?? 20;
    const filter = { ...(query.status && { status: query.status }), ...(query.userId && { proposedBy: query.userId }) };
    const [data, total] = await Promise.all([
      this.proposalModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('proposedBy', 'userID email firstName lastName'),
      this.proposalModel.countDocuments(filter),
    ]);
    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async approve(adminId: string, id: string, dto: ApproveStockProposalDto) {
    const session = await this.connection.startSession();
    let result: { proposal: StockProposalDocument; stock: StockDocument } | undefined;
    try {
      await session.withTransaction(async () => {
        const proposal = await this.proposalModel.findById(id).session(session);
        if (!proposal) throw new NotFoundException('Stock proposal not found');
        if (proposal.status !== ProposalStatus.PENDING) throw new ConflictException('Only pending stock proposals can be approved');
        const acronym = (dto.ticker ?? proposal.ticker).toUpperCase();
        const existing = await this.stockModel.exists({ acronym }).session(session);
        if (existing) throw new ConflictException('A stock with this ticker already exists');
        const [stock] = await this.stockModel.create([{
          name: dto.companyName ?? proposal.companyName, acronym, category: dto.category ?? proposal.category,
            exchange: dto.exchange ?? proposal.exchange, description: dto.description ?? proposal.description,
          initialListingPrice: dto.initialListingPrice ?? proposal.initialListingPrice,
          lastPrice: dto.lastPrice ?? dto.initialListingPrice ?? proposal.initialListingPrice,
          change24h: dto.change24h ?? proposal.change24h, rateOfChange: dto.rateOfChange ?? proposal.rateOfChange,
          currency: (dto.currency ?? proposal.currency).toUpperCase(),
        }], { session });
        proposal.status = ProposalStatus.COMPLETED;
        proposal.reviewedBy = adminId as any;
        proposal.reviewedAt = new Date();
        proposal.createdStockId = stock._id as any;
        await proposal.save({ session });
        result = { proposal, stock };
      });
      return result!;
    } finally { await session.endSession(); }
  }

  async reject(adminId: string, id: string, dto: RejectStockProposalDto) {
    const proposal = await this.proposalModel.findOneAndUpdate({ _id: new Types.ObjectId(id), status: ProposalStatus.PENDING }, { status: ProposalStatus.REJECTED, rejectionReason: dto.rejectionReason, reviewedBy: new Types.ObjectId(adminId), reviewedAt: new Date() }, { new: true });
    if (!proposal) throw new NotFoundException('Pending stock proposal not found');
    return proposal;
  }
}
