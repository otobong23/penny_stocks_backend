import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ProposalStatus } from '../enum/proposal-status.enum';

@Schema({ timestamps: true })
export class StockProposal {
  @Prop({ type: Types.ObjectId, required: true, ref: 'User', index: true }) proposedBy!: Types.ObjectId;
  @Prop({ type: String, required: true, trim: true, maxlength: 120 }) companyName!: string;
  @Prop({ type: String, required: true, uppercase: true, trim: true, maxlength: 12, index: true }) ticker!: string;
  @Prop({ type: String, required: true, trim: true, maxlength: 80 }) category!: string;
  @Prop({ type: String, required: true, trim: true, maxlength: 80 }) exchange!: string;
  @Prop({ type: Number, required: true, min: 0 }) initialListingPrice!: number;
  @Prop({ type: Number, default: 0 }) change24h!: number;
  @Prop({ type: Number, default: 0 }) rateOfChange!: number;
  @Prop({ type: String, required: true, default: 'USD', uppercase: true, trim: true }) currency!: string;
  @Prop({ type: String, enum: ProposalStatus, default: ProposalStatus.PENDING, index: true }) status!: ProposalStatus;
  @Prop({ type: String, trim: true, maxlength: 500 }) rejectionReason?: string;
  @Prop({ type: Types.ObjectId, ref: 'User' }) reviewedBy?: Types.ObjectId;
  @Prop({ type: Date }) reviewedAt?: Date;
  @Prop({ type: Types.ObjectId, ref: 'Stock' }) createdStockId?: Types.ObjectId;
}

export const StockProposalSchema = SchemaFactory.createForClass(StockProposal);
StockProposalSchema.index({ proposedBy: 1, createdAt: -1 });
StockProposalSchema.index({ status: 1, createdAt: -1 });
export interface StockProposalDocument extends StockProposal, Document {}
