import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from 'src/common/enums/payment-method.enum';

export class CloseSessionDto {
  @ApiProperty({
    example: PaymentMethod.CASH,
    enum: PaymentMethod,
    description: 'Sessiyani yopishda ishlatiladigan to‘lov usuli',
  })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
}
