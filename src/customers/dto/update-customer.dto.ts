import { IsOptional, IsString, IsPhoneNumber, Length } from 'class-validator';

export class UpdateCustomerDto {
  // Mijoz ismini yangilash
  @IsOptional()
  @IsString({ message: 'Ism matn bo‘lishi kerak' })
  @Length(2, 100, { message: 'Ism uzunligi 2–100 belgidan iborat bo‘lishi kerak' })
  fullName?: string;

  // Telefon raqamini yangilash
  @IsOptional()
  @IsPhoneNumber('UZ', { message: 'Telefon raqami noto‘g‘ri formatda' })
  phoneNumber?: string;
}
