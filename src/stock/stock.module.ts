import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminGuard } from '../common/guards/admin.guard';
import { User, UserSchema } from '../common/schemas/user/user.schema';
import { Transaction, TransactionSchema } from '../transaction/schemas/transaction.schema';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';
import { StockPurchase, StockPurchaseSchema } from './schemas/stock-purchase.schema';
import { Stock, StockSchema } from './schemas/stock.schema';

@Module({
  imports: [MongooseModule.forFeature([
    { name: Stock.name, schema: StockSchema },
    { name: StockPurchase.name, schema: StockPurchaseSchema },
    { name: User.name, schema: UserSchema },
    { name: Transaction.name, schema: TransactionSchema },
  ])],
  controllers: [StockController],
  providers: [StockService, AdminGuard],
  exports: [StockService],
})
export class StockModule {}
