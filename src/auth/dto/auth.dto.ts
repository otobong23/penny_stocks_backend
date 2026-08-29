import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class SignUpDto {
  @IsEmail()
  @Transform(({ value }) => value.trim().toLowerCase())
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;
}

export class LoginDto {
  @IsEmail()
  @Transform(({ value }) => value.trim().toLowerCase())
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class ProviderSignInDto {
  @IsString()
  @IsNotEmpty()
  idToken!: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  @Transform(({ value }) => value.trim().toLowerCase())
  email!: string;
}

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsString()
  @MinLength(8)
  newPassword!: string;
}

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}
