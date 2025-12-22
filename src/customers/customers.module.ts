import { Module } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './customer.entity';
import { LoyaltyModule } from 'src/loyalty/loyalty.module';

@Module({
  imports: [TypeOrmModule.forFeature([Customer]), LoyaltyModule],
  controllers: [CustomersController],
  providers: [CustomersService],
})
export class CustomersModule { }
