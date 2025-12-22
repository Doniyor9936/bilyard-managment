import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './payment.entity';
import { Debt } from '../debt/debt.entity';

@Module({
  imports:[TypeOrmModule.forFeature([Payment,Debt])],
  controllers: [PaymentsController],
  providers: [PaymentsService],
    exports: [
    PaymentsService,   // 👈 SHART
    TypeOrmModule,     // 👈 agar repo boshqa joyda ishlatilsa
  ],
})
export class PaymentsModule {}
