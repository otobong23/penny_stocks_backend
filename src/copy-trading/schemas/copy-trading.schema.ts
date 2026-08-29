import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { RiskLevel } from '../dto/create-copy-trading.dto';

@Schema({ timestamps: true })
export class CopyTrading {
  @Prop({ required: true, trim: true }) traderName!: string;
  @Prop({ type: String, enum: RiskLevel, required: true }) riskLevel!: RiskLevel;
  @Prop({ type: Number, required: true }) rateOfChange!: number;
  @Prop({ required: true }) duration!: string;
  @Prop({ type: Number, required: true }) averageDailyProfit!: number;
  @Prop({ type: Number, required: true, min: 0 }) purchases!: number;
  @Prop({ type: Number, required: true, min: 0 }) totalAssets!: number;
  @Prop({ type: Number, required: true, min: 0.01 }) copyTradePrice!: number;
  @Prop({ default: 'USD', uppercase: true, trim: true }) currency!: string;
}
export const CopyTradingSchema = SchemaFactory.createForClass(CopyTrading);
export interface CopyTradingDocument extends CopyTrading, Document {}
