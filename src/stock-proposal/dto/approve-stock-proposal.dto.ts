import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Length, Min } from 'class-validator';

/** Values supplied here replace the corresponding proposal value for the created stock. */
export class ApproveStockProposalDto {
  @IsOptional() @IsString() @Length(1, 120) companyName?: string;
  @IsOptional() @IsString() @Length(1, 12) ticker?: string;
  @IsOptional() @IsString() @Length(1, 80) category?: string;
  @IsOptional() @IsString() @Length(1, 80) exchange?: string;
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 8 }) @Min(0) initialListingPrice?: number;
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 8 }) @Min(0) lastPrice?: number;
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 8 }) change24h?: number;
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 4 }) rateOfChange?: number;
  @IsOptional() @IsString() @Length(3, 3) currency?: string;
}
