import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Payment } from './payments/payment.entity';
import { Debt } from './debt/debt.entity';
import { DebtPayment } from './debt/debt-payment.entity';
import { PaymentsController } from './payments/payments.controller';
import { PaymentsService } from './payments/payments.service';
import { DebtService } from './debt/debt.service';


@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Debt, DebtPayment]),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, DebtService],
  exports: [PaymentsService, DebtService],
})
export class BillingModule {}
