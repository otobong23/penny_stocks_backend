import { IsEnum, IsNumber, IsString, MaxLength, Min } from 'class-validator';
import { PaymentMethod } from '../enum/payment-method.enum';

export class CreateWithdrawOrderDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @IsString()
  @MaxLength(5000)
  methodDetails!: string;
}
