import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'oldPassword123',
    description: 'Joriy (eski) parol',
    minLength: 6,
  })
  @IsString()
  @MinLength(6, {
    message: "Eski parol kamida 6 ta belgidan iborat bo'lishi kerak",
  })
  readonly oldPassword: string;

  @ApiProperty({
    example: 'newPassword456',
    description: 'Yangi parol (kamida 6 ta belgi)',
    minLength: 6,
  })
  @IsString()
  @MinLength(6, {
    message: "Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak",
  })
  readonly newPassword: string;
}
