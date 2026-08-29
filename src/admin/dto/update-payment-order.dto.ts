import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaymentOrderStatus } from '../../transaction/enum/payment-order-status.enum';

export class UpdatePaymentOrderDto {
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  methodDetails?: string;

  @IsOptional()
  @IsIn([PaymentOrderStatus.COMPLETED, PaymentOrderStatus.REJECTED])
  status?: PaymentOrderStatus.COMPLETED | PaymentOrderStatus.REJECTED;
}
