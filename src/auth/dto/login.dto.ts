import { IsPhoneNumber, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: '+998901234567',
    description: 'Telefon raqami (UZ formatda)',
  })
  @IsPhoneNumber('UZ', { message: "Noto'g'ri telefon raqami" })
  readonly phoneNumber: string;

  @ApiProperty({
    example: 'password123',
    description: 'Foydalanuvchi paroli (kamida 6 ta belgi)',
    minLength: 6,
  })
  @IsString({ message: "Parol string bo'lishi kerak" })
  @MinLength(6, {
    message: "Parol kamida 6 ta belgidan iborat bo'lishi kerak",
  })
  readonly password: string;
}
