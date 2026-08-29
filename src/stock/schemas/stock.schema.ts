import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Stock {
  @Prop({ type: String, required: true, trim: true })
  name!: string;

  @Prop({ type: String, required: true, unique: true, uppercase: true, trim: true, index: true })
  acronym!: string;

  @Prop({ type: Number, required: true, min: 0 })
  lastPrice!: number;

  @Prop({ type: Number, required: true })
  change24h!: number;

  /** Percentage change, e.g. 1.38 represents +1.38%. */
  @Prop({ type: Number, required: true })
  rateOfChange!: number;

  @Prop({ type: String, required: true, default: 'USD', uppercase: true, trim: true })
  currency!: string;
}

export const StockSchema = SchemaFactory.createForClass(Stock);
export interface StockDocument extends Stock, Document {}
