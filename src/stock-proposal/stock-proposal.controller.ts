import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorator/current.logged.user';
import { AdminGuard } from '../common/guards/admin.guard';
import { JwtAuthGuard } from '../common/strategies/jwt-auth.guard';
import { ApproveStockProposalDto } from './dto/approve-stock-proposal.dto';
import { CreateStockProposalDto } from './dto/create-stock-proposal.dto';
import { ProposalQueryDto } from './dto/proposal-query.dto';
import { RejectStockProposalDto } from './dto/reject-stock-proposal.dto';
import { StockProposalService } from './stock-proposal.service';

@Controller('stock-proposals')
@UseGuards(JwtAuthGuard)
export class StockProposalController {
  constructor(private readonly service: StockProposalService) {}
  @Post() create(@CurrentUser() user: { sub: string }, @Body() dto: CreateStockProposalDto) { return this.service.create(user.sub, dto); }
  @Get('me') mine(@CurrentUser() user: { sub: string }, @Query() query: ProposalQueryDto) { return this.service.findMine(user.sub, query); }
  @Get() @UseGuards(AdminGuard) all(@Query() query: ProposalQueryDto) { return this.service.findAll(query); }
  @Patch(':id/approve') @UseGuards(AdminGuard) approve(@CurrentUser() user: { sub: string }, @Param('id') id: string, @Body() dto: ApproveStockProposalDto) { return this.service.approve(user.sub, id, dto); }
  @Patch(':id/reject') @UseGuards(AdminGuard) reject(@CurrentUser() user: { sub: string }, @Param('id') id: string, @Body() dto: RejectStockProposalDto) { return this.service.reject(user.sub, id, dto); }
}
