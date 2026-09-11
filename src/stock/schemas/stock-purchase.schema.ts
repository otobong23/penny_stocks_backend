import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class StockPurchase {
  @Prop({ type: Types.ObjectId, required: true, ref: 'User', index: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Stock', index: true })
  stockId!: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  stockName!: string;

  @Prop({ type: String, required: true, uppercase: true, trim: true })
  stockAcronym!: string;

  @Prop({ type: Number, required: true, min: 0.000001 })
  quantity!: number;

  /** Shares still owned from this purchase lot. */
  // Intentionally no default: older documents lack this field and represent a fully open lot.
  @Prop({ type: Number, min: 0 })
  remainingQuantity!: number;

  @Prop({ type: Number, required: true, min: 0, default: 0 })
  soldQuantity!: number;

  @Prop({ type: String, enum: ['open', 'closed'], default: 'open', index: true })
  status!: 'open' | 'closed';

  @Prop({ type: Number, required: true, min: 0 })
  pricePerShare!: number;

  @Prop({ type: Number, required: true, min: 0.01 })
  totalAmount!: number;

  @Prop({ type: String, required: true, uppercase: true, trim: true })
  currency!: string;
}

export const StockPurchaseSchema = SchemaFactory.createForClass(StockPurchase);
StockPurchaseSchema.index({ userId: 1, createdAt: -1 });
export interface StockPurchaseDocument extends StockPurchase, Document {}
