import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminGuard } from '../common/guards/admin.guard';
import { User, UserSchema } from '../common/schemas/user/user.schema';
import { Stock, StockSchema } from '../stock/schemas/stock.schema';
import { StockProposalController } from './stock-proposal.controller';
import { StockProposalService } from './stock-proposal.service';
import { StockProposal, StockProposalSchema } from './schemas/stock-proposal.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: StockProposal.name, schema: StockProposalSchema }, { name: Stock.name, schema: StockSchema }, { name: User.name, schema: UserSchema }])],
  controllers: [StockProposalController], providers: [StockProposalService, AdminGuard], exports: [StockProposalService],
})
export class StockProposalModule {}
