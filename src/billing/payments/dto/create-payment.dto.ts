import { IsEnum, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from 'src/common/enums/payment-method.enum';

export class CreatePaymentDto {
  @ApiProperty({
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    description: 'To‘lov qaysi sessiyaga tegishli',
  })
  @IsUUID()
  sessionId: string;

  @ApiPropertyOptional({
    example: '9b2c1d77-1a44-4a6c-9c5f-7c7c0c9c8e12',
    description: 'Qarz bo‘lsa – mijoz ID (ixtiyoriy)',
  })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiProperty({
    example: 50000,
    description: 'To‘lov summasi (kamida 1)',
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  summa: number;

  @ApiProperty({
    example: PaymentMethod.CASH,
    enum: PaymentMethod,
    description: 'To‘lov usuli',
  })
  @IsEnum(PaymentMethod)
  usul: PaymentMethod;
}
