import { IsOptional, IsString, IsPhoneNumber, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({
    example: 'Ali Valiyev',
    description: 'Mijozning to‘liq ismi',
  })
  @IsString({ message: 'Ism matn bo‘lishi kerak' })
  @Length(2, 100, {
    message: 'Ism uzunligi 2–100 belgidan iborat bo‘lishi kerak',
  })
  fullName: string;

  @ApiProperty({
    example: '+998901234567',
    description: 'Mijozning telefon raqami (ixtiyoriy, UZ formatda)',
  })
  @IsPhoneNumber('UZ', { message: 'Telefon raqami noto‘g‘ri formatda' })
  phoneNumber: string;
}
