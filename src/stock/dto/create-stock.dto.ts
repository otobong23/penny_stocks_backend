import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Length, Min } from 'class-validator';

export class CreateStockDto {
  @IsString()
  @Length(1, 120)
  name!: string;

  @IsString()
  @Length(1, 12)
  acronym!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 8 })
  @Min(0)
  lastPrice!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 8 })
  @Min(0)
  initialListingPrice?: number;

  @IsOptional()
  @IsString()
  @Length(1, 80)
  category?: string;

  @IsOptional()
  @IsString()
  @Length(1, 80)
  exchange?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 8 })
  change24h!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  rateOfChange!: number;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;
}
