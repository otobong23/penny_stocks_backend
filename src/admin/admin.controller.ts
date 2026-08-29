import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../common/guards/admin.guard';
import { JwtAuthGuard } from '../common/strategies/jwt-auth.guard';
import { LoginDto } from '../auth/dto/auth.dto';
import { AuthService } from '../auth/auth.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { UpdateTransactionStatusDto } from './dto/update-transaction-status.dto';
import { UpdateUserAdministrationDto } from './dto/update-user-administration.dto';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService, private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) { return this.authService.loginAdmin(dto); }

  @Get('users')
  @UseGuards(JwtAuthGuard, AdminGuard)
  users(@Query() pagination: PaginationDto) { return this.adminService.findUsers(pagination); }

  @Patch('users/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserAdministrationDto) { return this.adminService.updateUser(id, dto); }

  @Get('transactions')
  @UseGuards(JwtAuthGuard, AdminGuard)
  transactions(@Query() pagination: PaginationDto) { return this.adminService.findTransactions(pagination); }

  @Patch('transactions/:id/status')
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateTransactionStatus(@Param('id') id: string, @Body() dto: UpdateTransactionStatusDto) { return this.adminService.updateTransactionStatus(id, dto); }
}
