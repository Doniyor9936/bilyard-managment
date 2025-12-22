import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';
import { Session } from './session.entity';
import { TableEntity } from 'src/tables/table.entity';
import { Customer } from 'src/customers/customer.entity';
import { TablesModule } from 'src/tables/tables.module';
import { PaymentsModule } from 'src/billing/payments/payments.module';
import { LoyaltyModule } from 'src/loyalty/loyalty.module';
import { OrdersModule } from 'src/orders/orders.module';
import { SettingsModule } from 'src/settings/settings.module';

@Module({
  imports: [
    // 👇 REPOSITORY'LAR
    TypeOrmModule.forFeature([
      Session,
      TableEntity, // ✅ ENG MUHIM
      Customer,
    ]),

    // 👇 SERVICE'LAR KELADIGAN MODULLAR
    TablesModule,
    PaymentsModule,
    LoyaltyModule,
    OrdersModule,
    SettingsModule,
  ],
  providers: [SessionsService],
  controllers: [SessionsController],
  exports: [SessionsService],
})
export class SessionsModule { }
