import {
  IsEnum,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from 'src/common/enums/user-role.enum';

export class UserCreateDto {
  @ApiProperty({
    example: 'Doniyor Qalandarov',
    description: 'Foydalanuvchining to‘liq ismi',
  })
  @IsString({ message: 'Ism string bo‘lishi kerak' })
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
  @IsString({ message: 'Password string bo‘lishi kerak' })
  @MinLength(6, {
    message: 'Password kamida 6 ta belgidan iborat bo‘lishi kerak',
  })
  readonly password: string;

  @ApiPropertyOptional({
    example: UserRole.STAFF,
    enum: UserRole,
    description: 'Foydalanuvchi roli (ixtiyoriy)',
  })
  @IsEnum(UserRole, { message: "Noto'g'ri rol tanlandi" })
  @IsOptional()
  readonly role: UserRole;
}
