import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { AdminGuard } from '../common/guards/admin.guard';
import { User, UserSchema } from '../common/schemas/user/user.schema';
import { Transaction, TransactionSchema } from '../transaction/schemas/transaction.schema';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { TransactionModule } from 'src/transaction/transaction.module';
import { StockPurchase, StockPurchaseSchema } from '../stock/schemas/stock-purchase.schema';
import { CopyTradePurchase, CopyTradePurchaseSchema } from '../copy-trading/schemas/copy-trade-purchase.schema';
import { StockProposal, StockProposalSchema } from '../stock-proposal/schemas/stock-proposal.schema';
import { CopyTradingPortfolio, CopyTradingPortfolioSchema } from '../copy-trading/schemas/copy-trading-portfolio.schema';

@Module({ imports: [AuthModule, TransactionModule, MongooseModule.forFeature([
  { name: User.name, schema: UserSchema },
  { name: Transaction.name, schema: TransactionSchema },
  { name: StockPurchase.name, schema: StockPurchaseSchema },
  { name: CopyTradePurchase.name, schema: CopyTradePurchaseSchema },
  { name: StockProposal.name, schema: StockProposalSchema },
  { name: CopyTradingPortfolio.name, schema: CopyTradingPortfolioSchema },
])], controllers: [AdminController], providers: [AdminService, AdminGuard] })
export class AdminModule {}
