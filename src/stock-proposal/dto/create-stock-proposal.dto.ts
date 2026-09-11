import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Length, Min } from 'class-validator';

export class CreateStockProposalDto {
  @IsString() @Length(1, 120) companyName!: string;
  @IsString() @Length(1, 12) ticker!: string;
  @IsString() @Length(1, 80) category!: string;
  @IsString() @Length(1, 80) exchange!: string;
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 8 }) @Min(0) initialListingPrice!: number;
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 8 }) change24h?: number;
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 4 }) rateOfChange?: number;
  @IsOptional() @IsString() @Length(3, 3) currency?: string;
}
