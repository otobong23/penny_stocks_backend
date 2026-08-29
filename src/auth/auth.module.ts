import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { OAuth2Client } from 'google-auth-library';
import { JwtStrategy } from 'src/common/strategies/jwt.strategy';
import ResetPasswordStrategy from 'src/common/strategies/ResetPasswordStrategy';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/common/schemas/user/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
    ])
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    ResetPasswordStrategy,
    {
      provide: OAuth2Client,
      useFactory: () => {
        return new OAuth2Client({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        });
      },
    }
  ],
  exports: [AuthService],
})
export class AuthModule { }
