import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/** Funds that are available exclusively for copy-trading activity. */
@Schema({ timestamps: true })
export class CopyTradingPortfolio {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: Number, required: true, default: 0, min: 0 })
  balance!: number;

  @Prop({ type: String, required: true, default: 'USD', uppercase: true, trim: true })
  currency!: string;

  @Prop({ type: Number, required: true, default: 0, min: 0 })
  totalDeposited!: number;

  @Prop({ type: Number, required: true, default: 0, min: 0 })
  totalWithdrawn!: number;

  @Prop({ type: Number, required: true, default: 0, min: 0 })
  totalInvested!: number;

  @Prop({ type: Number, required: true, default: 0, min: 0 })
  totalLiquidated!: number;
}

export const CopyTradingPortfolioSchema = SchemaFactory.createForClass(CopyTradingPortfolio);
export interface CopyTradingPortfolioDocument extends CopyTradingPortfolio, Document {}
