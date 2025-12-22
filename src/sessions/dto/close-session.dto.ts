import { IsEnum } from 'class-validator';
import { PaymentMethod } from 'src/common/enums/payment-method.enum';

export class CloseSessionDto {
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
}
