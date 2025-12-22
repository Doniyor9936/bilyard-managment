import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './order.entity';
import { Session } from 'src/sessions/session.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, Session])],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule { }
