import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

import { configDotenv } from 'dotenv';
// import { AuthModule } from './auth/auth.module';
// import { UserModule } from './user/user.module';
// import { TransactionModule } from './transaction/transaction.module';
// import { StockModule } from './stock/stock.module';
// import { CopyTradingModule } from './copy-trading/copy-trading.module';
// import { AdminModule } from './admin/admin.module';
configDotenv()

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGO_DB),
    PassportModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET!,
      signOptions: { expiresIn: '30d' },
    }),
    // AuthModule,
    // UserModule,
    // TransactionModule,
    // StockModule,
    // CopyTradingModule,
    // AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
