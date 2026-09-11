import { IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ProposalStatus } from '../enum/proposal-status.enum';

export class ProposalQueryDto extends PaginationDto {
  @IsOptional() @IsEnum(ProposalStatus) status?: ProposalStatus;
}
