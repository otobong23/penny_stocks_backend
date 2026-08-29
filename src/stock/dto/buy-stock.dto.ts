import { Type } from 'class-transformer';
import { IsNumber, Min } from 'class-validator';

export class BuyStockDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 8 })
  @Min(0.000001)
  quantity!: number;
}
