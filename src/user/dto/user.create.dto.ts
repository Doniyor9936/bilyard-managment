import {
  IsEnum,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MinLength,
} from 'class-validator';
import { UserRole } from 'src/common/enums/user-role.enum';
export class UserCreateDto {
  @IsString({ message: 'ism string bolishi kerak' })
  readonly fullName: string;

  @IsPhoneNumber('UZ', { message: "Noto'g'ri telefon raqami" })
  readonly phoneNumber: string;

  @IsString({ message: 'password string bolishi kerak' })
  @MinLength(6, {
    message: 'password kamida 6 ta belgidan iborat bolishi kerak',
  })
  readonly password: string;

  @IsEnum(UserRole, { message: "Noto'g'ri rol tanlandi" })
  @IsOptional()
  readonly role: UserRole;
}
