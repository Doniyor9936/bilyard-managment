import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from 'src/user/user.module'; // ⭐ Import qo'shish
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    UserModule, // ⭐ Bu qatorni qo'shing!
    PassportModule,
    ConfigModule, // ⭐ ConfigModule ham kerak bo'ladi
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '15m',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy,],
  exports: [AuthService], // ⭐ AuthService'ni boshqa modullar ishlatishi mumkin
})
export class AuthModule {}