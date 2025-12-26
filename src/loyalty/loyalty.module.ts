import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoyaltyService } from './loyalty.service';
import { LoyaltyController } from './loyalty.controller';
import { PointRule } from './point-rule.entity';
import { PointTransaction } from './point-transaction.entity';
import { Customer } from 'src/customers/customer.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PointRule, PointTransaction, Customer]),
  ],
  providers: [LoyaltyService],
  controllers: [LoyaltyController],
  exports: [LoyaltyService],
})
export class LoyaltyModule { }
