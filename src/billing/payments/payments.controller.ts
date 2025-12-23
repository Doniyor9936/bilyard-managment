import {
  Body,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/user/user.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) { }

  /**
   * To‘lov yaratish (naqd / karta / QR / qarz)
   */
  @Post()
  async createPayment(
    @Body() dto: CreatePaymentDto,
    @CurrentUser() user: User,
  ) {
    return this.paymentsService.createPayment({
      sessionId: dto.sessionId,
      customerId: dto.customerId,   // optional
      userId: user.id,
      amount: dto.summa,
      method: dto.usul,
    });
  }
}
