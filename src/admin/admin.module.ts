import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { AdminGuard } from '../common/guards/admin.guard';
import { User, UserSchema } from '../common/schemas/user/user.schema';
import { Transaction, TransactionSchema } from '../transaction/schemas/transaction.schema';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { TransactionModule } from 'src/transaction/transaction.module';

@Module({ imports: [AuthModule, TransactionModule, MongooseModule.forFeature([{ name: User.name, schema: UserSchema }, { name: Transaction.name, schema: TransactionSchema }])], controllers: [AdminController], providers: [AdminService, AdminGuard] })
export class AdminModule {}
