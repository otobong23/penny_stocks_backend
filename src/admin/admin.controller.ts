import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../common/guards/admin.guard';
import { JwtAuthGuard } from '../common/strategies/jwt-auth.guard';
import { LoginDto } from '../auth/dto/auth.dto';
import { AuthService } from '../auth/auth.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { UpdateTransactionStatusDto } from './dto/update-transaction-status.dto';
import { UpdateUserAdministrationDto } from './dto/update-user-administration.dto';
import { AdminService } from './admin.service';
import { UpdatePaymentOrderDto } from './dto/update-payment-order.dto';
import { AdminCopyTradePurchaseQueryDto, AdminStockPurchaseQueryDto, AdminUserParamsDto } from './dto/admin-purchase-query.dto';
import { ProposalQueryDto } from '../stock-proposal/dto/proposal-query.dto';
import { UpdateCopyTradingPortfolioDto } from './dto/update-copy-trading-portfolio.dto';

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

  @Get('payment-orders')
  @UseGuards(JwtAuthGuard, AdminGuard)
  paymentOrders() { return this.adminService.findPaymentOrders(); }

  @Patch('payment-orders/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  updatePaymentOrder(@Param('id') id: string, @Body() dto: UpdatePaymentOrderDto) { return this.adminService.updatePaymentOrder(id, dto); }

  @Get('stock-purchases')
  @UseGuards(JwtAuthGuard, AdminGuard)
  stockPurchases(@Query() query: AdminStockPurchaseQueryDto) { return this.adminService.findStockPurchases(query); }

  @Get('copy-trade-purchases')
  @UseGuards(JwtAuthGuard, AdminGuard)
  copyTradePurchases(@Query() query: AdminCopyTradePurchaseQueryDto) { return this.adminService.findCopyTradePurchases(query); }

  @Get('copy-trading-portfolios')
  @UseGuards(JwtAuthGuard, AdminGuard)
  copyTradingPortfolios(@Query() pagination: PaginationDto) { return this.adminService.findCopyTradingPortfolios(pagination); }

  @Get('copy-trading-portfolios/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  copyTradingPortfolio(@Param('id') id: string) { return this.adminService.findCopyTradingPortfolio(id); }

  @Patch('copy-trading-portfolios/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateCopyTradingPortfolio(@Param('id') id: string, @Body() dto: UpdateCopyTradingPortfolioDto) {
    return this.adminService.updateCopyTradingPortfolio(id, dto);
  }

  @Delete('copy-trading-portfolios/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  removeCopyTradingPortfolio(@Param('id') id: string) { return this.adminService.removeCopyTradingPortfolio(id); }

  @Get('users/:userId/stock-purchases')
  @UseGuards(JwtAuthGuard, AdminGuard)
  userStockPurchases(@Param() params: AdminUserParamsDto, @Query() query: AdminStockPurchaseQueryDto) {
    return this.adminService.findStockPurchases({ ...query, userId: params.userId });
  }

  @Get('users/:userId/copy-trade-purchases')
  @UseGuards(JwtAuthGuard, AdminGuard)
  userCopyTradePurchases(@Param() params: AdminUserParamsDto, @Query() query: AdminCopyTradePurchaseQueryDto) {
    return this.adminService.findCopyTradePurchases({ ...query, userId: params.userId });
  }

  @Get('users/:userId/stock-proposals')
  @UseGuards(JwtAuthGuard, AdminGuard)
  userStockProposals(@Param() params: AdminUserParamsDto, @Query() query: ProposalQueryDto) {
    return this.adminService.findUserStockProposals(params.userId, query);
  }
}
