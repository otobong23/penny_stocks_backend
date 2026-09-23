import { Type } from 'class-transformer';
import { IsMongoId, IsNumber, IsOptional, IsString, Length, Min } from 'class-validator';

export class UpdateCopyTradingPortfolioDto {
  @IsOptional()
  @IsMongoId()
  userId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  balance?: number;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalDeposited?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalWithdrawn?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalInvested?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalLiquidated?: number;
}
