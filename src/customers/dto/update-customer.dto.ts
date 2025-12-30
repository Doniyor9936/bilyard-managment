import { IsOptional, IsString, IsPhoneNumber, Length } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCustomerDto {
  @ApiPropertyOptional({
    example: 'Ali Valiyev',
    description: 'Mijozning yangi to‘liq ismi',
  })
  @IsOptional()
  @IsString({ message: 'Ism matn bo‘lishi kerak' })
  @Length(2, 100, {
    message: 'Ism uzunligi 2–100 belgidan iborat bo‘lishi kerak',
  })
  fullName?: string;

  @ApiPropertyOptional({
    example: '+998901234567',
    description: 'Mijozning yangi telefon raqami (UZ formatda)',
  })
  @IsOptional()
  @IsPhoneNumber('UZ', { message: 'Telefon raqami noto‘g‘ri formatda' })
  phoneNumber?: string;
}
