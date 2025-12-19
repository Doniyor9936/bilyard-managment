// auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { User } from 'src/user/user.entity';


@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  // Registratsiya
  async register(dto: RegisterDto): Promise<{ user: User; token: string }> {
    // parolni hash qilish
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.userService.createUser({
      fullName: dto.fullName,
      phoneNumber: dto.phoneNumber,
      password: hashedPassword,
      role: dto.role,
      accountId: dto.accountId,
      mustChangePassword: dto.mustChangePassword ?? true,
    });

    const token = this.generateJwt(user);
    return { user, token };
  }

  // Login
  async login(dto: LoginDto): Promise<{ user: User; token: string }> {
    const user = await this.userService.findByPhone(dto.phoneNumber);
    if (!user) {
      throw new UnauthorizedException('Telefon raqam yoki parol noto‘g‘ri');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Telefon raqam yoki parol noto‘g‘ri');
    }

    const token = this.generateJwt(user);
    return { user, token };
  }

  private generateJwt(user: User): string {
    const payload = { sub: user.id, role: user.role };
    return this.jwtService.sign(payload);
  }
}
