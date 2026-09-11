import { IsOptional, IsString, Length } from 'class-validator';

export class RejectStockProposalDto {
  @IsOptional() @IsString() @Length(1, 500) rejectionReason?: string;
}
