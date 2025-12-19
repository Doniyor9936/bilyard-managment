import {
  IsEnum,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MinLength,
} from 'class-validator';
import { UserRole } from 'src/common/enums/user-role.enum';

export class RegisterDto {
  @IsString({ message: 'Ism string bo\'lishi kerak' })
  readonly fullName: string;

  @IsPhoneNumber('UZ', { message: "Noto'g'ri telefon raqami" })
  readonly phoneNumber: string;

  @IsString({ message: 'Parol string bo\'lishi kerak' })
  @MinLength(6, {
    message: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak',
  })
  readonly password: string;

  @IsEnum(UserRole, { message: "Noto'g'ri rol tanlandi" })
  readonly role: UserRole;

  @IsString()
  readonly accountId: string;

  @IsOptional()
  readonly mustChangePassword?: boolean; // Default: true bo'ladi
}