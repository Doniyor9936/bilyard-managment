import { IsPhoneNumber, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsPhoneNumber('UZ', { message: "Noto'g'ri telefon raqami" })
  readonly phoneNumber: string;

  @IsString({ message: 'Parol string bo\'lishi kerak' })
  @MinLength(6, { message: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak' })
  readonly password: string;
}