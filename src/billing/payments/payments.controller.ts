import {
  Body,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { User } from 'src/user/user.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Session } from 'src/sessions/session.entity';
import { Customer } from 'src/customers/customer.entity';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * To‘lov yaratish (naqd / karta / QR / qarz)
   */
  @Post()
  async tolovYaratish(
    @Body() dto: CreatePaymentDto,
    @CurrentUser() user: User,
  ) {
    const session: Session = { id: dto.sessionId } as Session;

    const customer: Customer | undefined = dto.customerId
      ? ({ id: dto.customerId } as Customer)
      : undefined;

    return this.paymentsService.createPayment({
      session,
      customer,
      user,
      amount: dto.summa,
      method: dto.usul,
    });
  }
}
