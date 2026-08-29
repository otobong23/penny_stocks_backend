import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/common/schemas/user/user.schema';
import { Transaction, TransactionSchema } from './schemas/transaction.schema';
import { TransactionController } from './transaction.controller';
import { TransactionMailService } from './transaction-mail.service';
import { TransactionService } from './transaction.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Transaction.name, schema: TransactionSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [TransactionController],
  providers: [TransactionService, TransactionMailService],
  exports: [TransactionService, TransactionMailService],
})
export class TransactionModule {}
