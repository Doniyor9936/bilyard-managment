import {
  IsEnum,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from 'src/common/enums/user-role.enum';

export class RegisterDto {
  @ApiProperty({
    example: 'Doniyor Karimov',
    description: 'Foydalanuvchining to‘liq ismi',
  })
  @IsString({ message: "Ism string bo'lishi kerak" })
  readonly fullName: string;

  @ApiProperty({
    example: '+998901234567',
    description: 'Telefon raqami (UZ formatda)',
  })
  @IsPhoneNumber('UZ', { message: "Noto'g'ri telefon raqami" })
  readonly phoneNumber: string;

  @ApiProperty({
    example: 'password123',
    description: 'Parol (kamida 6 ta belgi)',
    minLength: 6,
  })
  @IsString({ message: "Parol string bo'lishi kerak" })
  @MinLength(6, {
    message: "Parol kamida 6 ta belgidan iborat bo'lishi kerak",
  })
  readonly password: string;

  @ApiProperty({
    example: UserRole.STAFF,
    enum: UserRole,
    description: 'Foydalanuvchi roli',
  })
  @IsEnum(UserRole, { message: "Noto'g'ri rol tanlandi" })
  readonly role: UserRole;

  @ApiPropertyOptional({
    example: true,
    description: 'Birinchi kirishda parolni majburiy almashtirish',
    default: true,
  })
  @IsOptional()
  readonly mustChangePassword?: boolean;
}
