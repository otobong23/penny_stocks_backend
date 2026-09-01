import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorator/current.logged.user';
import { AdminGuard } from '../common/guards/admin.guard';
import { JwtAuthGuard } from '../common/strategies/jwt-auth.guard';
import { BuyStockDto } from './dto/buy-stock.dto';
import { CreateStockDto } from './dto/create-stock.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { StockService } from './stock.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Controller('stocks')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get()
  findAll(@Query() pagination: PaginationDto) { return this.stockService.findAll(pagination); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.stockService.findOne(id); }

  @Post(':id/buy')
  @UseGuards(JwtAuthGuard)
  buy(@CurrentUser() user: { sub: string }, @Param('id') id: string, @Body() dto: BuyStockDto) { return this.stockService.buy(user.sub, id, dto); }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  create(@Body() dto: CreateStockDto) { return this.stockService.create(dto); }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  update(@Param('id') id: string, @Body() dto: UpdateStockDto) { return this.stockService.update(id, dto); }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  remove(@Param('id') id: string) { return this.stockService.remove(id); }
}
