import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @MinLength(6, { message: 'Eski parol kamida 6 ta belgidan iborat bo\'lishi kerak' })
  readonly oldPassword: string;

  @IsString()
  @MinLength(6, { message: 'Yangi parol kamida 6 ta belgidan iborat bo\'lishi kerak' })
  readonly newPassword: string;
}
