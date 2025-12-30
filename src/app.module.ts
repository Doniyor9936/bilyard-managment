import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { AccountsModule } from './accounts/accounts.module';
import { SettingsModule } from './settings/settings.module';
import { LoyaltyModule } from './loyalty/loyalty.module';
import { TablesModule } from './tables/tables.module';
import { SessionsModule } from './sessions/sessions.module';
import { OrdersModule } from './orders/orders.module';
import { BillingModule } from './billing/billing.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import { CustomersModule } from './customers/customers.module';
import { typeOrmAsyncConfig } from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync(typeOrmAsyncConfig),
    AuthModule,
    AccountsModule,
    CustomersModule,
    TablesModule,
    SessionsModule,
    OrdersModule,
    BillingModule,
    UserModule,
    LoyaltyModule,
    SettingsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
