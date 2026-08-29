import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateUserAdministrationDto {
  @IsOptional()
  @IsBoolean()
  isSuspended?: boolean;

  @IsOptional()
  @IsBoolean()
  isAdmin?: boolean;
}
