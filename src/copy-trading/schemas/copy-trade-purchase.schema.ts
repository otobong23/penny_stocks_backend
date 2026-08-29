import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { RiskLevel } from '../dto/create-copy-trading.dto';

@Schema({ timestamps: true })
export class CopyTradePurchase {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true }) userId!: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'CopyTrading', required: true }) copyTradingId!: Types.ObjectId;
  @Prop({ required: true }) traderName!: string;
  @Prop({ type: String, enum: RiskLevel, required: true }) riskLevel!: RiskLevel;
  @Prop({ required: true }) duration!: string;
  @Prop({ type: Number, required: true }) rateOfChange!: number;
  @Prop({ type: Number, required: true }) averageDailyProfit!: number;
  @Prop({ type: Number, required: true, min: 0 }) purchases!: number;
  @Prop({ type: Number, required: true, min: 0 }) totalAssets!: number;
  @Prop({ type: Number, required: true, min: 0.01 }) copyTradePrice!: number;
  @Prop({ type: Number, required: true, min: 0.01 }) amountInvested!: number;
  @Prop({ required: true }) currency!: string;
  @Prop({ type: Date, required: true, index: true }) expiredAt!: Date;
}
export const CopyTradePurchaseSchema = SchemaFactory.createForClass(CopyTradePurchase);
CopyTradePurchaseSchema.index({ userId: 1, createdAt: -1 });
export interface CopyTradePurchaseDocument extends CopyTradePurchase, Document {}
