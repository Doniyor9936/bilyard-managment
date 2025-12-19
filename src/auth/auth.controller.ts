// auth/auth.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from 'src/user/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<{ user: User; token: string }> {
    return this.authService.register(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto): Promise<{ user: User; token: string }> {
    return this.authService.login(dto);
  }
}
