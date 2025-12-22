import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UserService } from 'src/user/user.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponse, JwtPayload } from './interfaces/jwt-payload.interface';
import { User } from 'src/user/user.entity';
import { error } from 'console';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // Hash parol
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  // Parolni tekshirish
  async comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // Token yaratish
  async generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JwtPayload = {
      sub: user.id,
      phoneNumber: user.phoneNumber,
      role: user.role,
      fullName: user.fullName,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  // Login
  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.userService.findByPhone(loginDto.phoneNumber);

    if (!user) {
      throw new UnauthorizedException('Telefon raqam yoki parol noto\'g\'ri');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Foydalanuvchi bloklangan');
    }

    const isPasswordValid = await this.comparePasswords(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Telefon raqam yoki parol noto\'g\'ri');
    }

    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: {
        id: user.id,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
    };
  }

  // Register (faqat Admin uchun)
  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const existingUser = await this.userService.findByPhone(registerDto.phoneNumber);
    
    if (existingUser) {
      throw new ConflictException('Bu telefon raqam allaqachon ro\'yxatdan o\'tgan');
    }

    try {
      const existingAccountId = await this.userService.getUserById(registerDto.phoneNumber);
      if (existingAccountId) {
        throw new ConflictException('Bu accountId allaqachon ishlatilmoqda');
      }
    } catch (error) {
      // AccountId topilmasa, davom etamiz
    }

    const hashedPassword = await this.hashPassword(registerDto.password);

    const newUser = await this.userService.createUser({
      fullName: registerDto.fullName,
      phoneNumber: registerDto.phoneNumber,
      password: hashedPassword,
      role: registerDto.role,
      mustChangePassword: registerDto.mustChangePassword ?? true,
    });

    const tokens = await this.generateTokens(newUser);

    return {
      ...tokens,
      user: {
        id: newUser.id,
        fullName: newUser.fullName,
        phoneNumber: newUser.phoneNumber,
        role: newUser.role,
        mustChangePassword: newUser.mustChangePassword,
      },
    };
  }

  // Token yangilash
  async refreshTokens(userId: string): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.userService.getUserById(userId);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Foydalanuvchi topilmadi yoki faol emas');
    }

    return this.generateTokens(user);
  }

  // Parolni o'zgartirish
  async changePassword(id: string, changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
    const user = await this.userService.getUserById(id);

    const isOldPasswordValid = await this.comparePasswords(
      changePasswordDto.oldPassword,
      user.password,
    );

    if (!isOldPasswordValid) {
      throw new BadRequestException('Eski parol noto\'g\'ri');
    }

    const hashedNewPassword = await this.hashPassword(changePasswordDto.newPassword);

    await this.userService.updateUser(user.id, {
      password: hashedNewPassword,
      mustChangePassword: false,
    });

    return { message: 'Parol muvaffaqiyatli o\'zgartirildi' };
  }

  // Profil
  async getProfile(userId: string): Promise<Partial<User>> {
    const user = await this.userService.getUserById(userId);
    if (!user) {
   
      throw new Error("foydalanuvchi topilmadi");
      
    }
    const { password, ...result } = user;
    return result;
  }
}