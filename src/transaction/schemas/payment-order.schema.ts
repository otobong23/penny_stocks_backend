import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { nanoid } from 'nanoid';
import { TransactionType } from '../enum/transaction-type.enum';
import { PaymentMethod } from '../enum/payment-method.enum';
import { PaymentOrderStatus } from '../enum/payment-order-status.enum';

@Schema({ timestamps: true })
export class PaymentOrder {
  @Prop({ type: String, required: true, unique: true, default: () => nanoid(12) })
  orderID!: string;

  @Prop({ type: Types.ObjectId, required: true, ref: 'User', index: true })
  userId!: Types.ObjectId;

  @Prop({ type: String, required: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ type: String, enum: [TransactionType.DEPOSIT, TransactionType.WITHDRAW], required: true })
  type!: TransactionType.DEPOSIT | TransactionType.WITHDRAW;

  @Prop({ type: Number, required: true, min: 0.01 })
  amount!: number;

  @Prop({ type: String, enum: PaymentMethod, required: true })
  method!: PaymentMethod;

  @Prop({ type: String, trim: true, maxlength: 1000 })
  suggestedMethod?: string;

  /** Destination/payment instructions supplied by an administrator. */
  @Prop({ type: String, trim: true, maxlength: 5000 })
  methodDetails?: string;

  @Prop({ type: Boolean, default: false })
  isMethodIncluded!: boolean;

  @Prop({ type: String, enum: PaymentOrderStatus, default: PaymentOrderStatus.PENDING, index: true })
  status!: PaymentOrderStatus;

  @Prop({ type: String })
  proofPaymentDocument?: string;

  @Prop({ type: Types.ObjectId, ref: 'Transaction' })
  transactionId?: Types.ObjectId;

  @Prop({ type: Date, required: true, index: { expires: 0 } })
  expiresAt!: Date;
}

export const PaymentOrderSchema = SchemaFactory.createForClass(PaymentOrder);
PaymentOrderSchema.index({ userId: 1, status: 1 });
export interface PaymentOrderDocument extends PaymentOrder, Document {}
