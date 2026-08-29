import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsString, Matches, Min } from 'class-validator';

export enum RiskLevel { LOW = 'low', MEDIUM = 'medium', HIGH = 'high' }

export class CreateCopyTradingDto {
  @IsString() traderName!: string;
  @IsEnum(RiskLevel) riskLevel!: RiskLevel;
  @Type(() => Number) @IsNumber() rateOfChange!: number;
  @Matches(/^\d+\s+days?$/i, { message: 'duration must be in the format "30 days"' }) duration!: string;
  @Type(() => Number) @IsNumber() averageDailyProfit!: number;
  @Type(() => Number) @IsNumber() @Min(0) purchases!: number;
  @Type(() => Number) @IsNumber() @Min(0) totalAssets!: number;
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) copyTradePrice!: number;
}
