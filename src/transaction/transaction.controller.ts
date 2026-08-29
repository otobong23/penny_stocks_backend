import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from 'src/common/decorator/current.logged.user';
import { JwtAuthGuard } from 'src/common/strategies/jwt-auth.guard';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionService } from './transaction.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaymentOrderService } from './payment-order.service';
import { CreateDepositOrderDto } from './dto/create-deposit-order.dto';
import { CreateWithdrawOrderDto } from './dto/create-withdraw-order.dto';
import { SubmitPaymentProofDto } from './dto/submit-payment-proof.dto';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionController {
  constructor(private readonly transactionService: TransactionService, private readonly paymentOrderService: PaymentOrderService) {}

  @Post('deposit-orders')
  createDepositOrder(@CurrentUser() user: { sub: string }, @Body() dto: CreateDepositOrderDto) {
    return this.paymentOrderService.createDeposit(user.sub, dto);
  }

  @Post('withdraw-orders')
  createWithdrawOrder(@CurrentUser() user: { sub: string }, @Body() dto: CreateWithdrawOrderDto) {
    return this.paymentOrderService.createWithdraw(user.sub, dto);
  }

  @Get('orders')
  findMyOrders(@CurrentUser() user: { sub: string }) {
    return this.paymentOrderService.findMine(user.sub);
  }

  @Post('deposit-orders/:id/payment-proof')
  submitDepositProof(@CurrentUser() user: { sub: string }, @Param('id') id: string, @Body() dto: SubmitPaymentProofDto) {
    return this.paymentOrderService.submitDepositProof(user.sub, id, dto);
  }

  @Post()
  create(@CurrentUser() user: { sub: string }, @Body() dto: CreateTransactionDto) {
    return this.transactionService.create(user.sub, dto);
  }

  @Get()
  findMine(@CurrentUser() user: { sub: string }, @Query() pagination: PaginationDto) {
    return this.transactionService.findMine(user.sub, pagination);
  }

  @Get(':id')
  findOneMine(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.transactionService.findOneMine(user.sub, id);
  }
}
