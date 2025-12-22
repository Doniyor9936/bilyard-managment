import { IsEnum, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';
import { PaymentMethod } from 'src/common/enums/payment-method.enum';

export class CreatePaymentDto {
  @IsUUID()
  sessionId: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsNumber()
  @Min(1)
  summa: number;

  @IsEnum(PaymentMethod)
  usul: PaymentMethod;
}
