import { IsOptional, IsString, IsPhoneNumber, Length } from 'class-validator';

export class CreateCustomerDto {
  // Mijozning to‘liq ismi
  @IsString({ message: 'Ism matn bo‘lishi kerak' })
  @Length(2, 100, { message: 'Ism uzunligi 2–100 belgidan iborat bo‘lishi kerak' })
  fullName: string;

  // Telefon raqami (ixtiyoriy)
  @IsOptional()
  @IsPhoneNumber('UZ', { message: 'Telefon raqami noto‘g‘ri formatda' })
  phoneNumber?: string;
}
