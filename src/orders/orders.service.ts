import {
    BadRequestException,
    Injectable,
    NotFoundException,
  } from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
  import { Repository } from 'typeorm';
  import { Order } from './order.entity';
  import { Session } from 'src/sessions/session.entity';
  import { SessionStatus } from 'src/common/enums/session-status.enum';
  
  @Injectable()
  export class OrdersService {
    constructor(
      @InjectRepository(Order)
      private readonly orderRepo: Repository<Order>,
  
      @InjectRepository(Session)
      private readonly sessionRepo: Repository<Session>,
    ) {}
  
    // ===============================
    // ➕ ORDER QO‘SHISH
    // ===============================
    async createOrder(params: {
      sessionId: string;
      title: string;
      quantity: number;
      price: number;
    }): Promise<Order> {
      const session = await this.sessionRepo.findOne({
        where: { id: params.sessionId },
      });
  
      if (!session) {
        throw new NotFoundException('Sessiya topilmadi');
      }
  
      if (session.status === SessionStatus.COMPLETED) {
        throw new BadRequestException(
          'Yakunlangan sessiyaga buyurtma qo‘shib bo‘lmaydi',
        );
      }
  
      if (params.quantity <= 0) {
        throw new BadRequestException('Miqdor noto‘g‘ri');
      }
  
      if (params.price <= 0) {
        throw new BadRequestException('Narx noto‘g‘ri');
      }
  
      const order = this.orderRepo.create({
        session,
        title: params.title,
        quantity: params.quantity,
        price: params.price,
        isCancelled: false,
      });
  
      return this.orderRepo.save(order);
    }
  
    // ===============================
    // ❌ ORDER BEKOR QILISH
    // ===============================
    async cancelOrder(orderId: string): Promise<Order> {
      const order = await this.orderRepo.findOne({
        where: { id: orderId },
        relations: ['session'],
      });
  
      if (!order) {
        throw new NotFoundException('Buyurtma topilmadi');
      }
  
      if (order.session.status === SessionStatus.COMPLETED) {
        throw new BadRequestException(
          'Yakunlangan sessiyadagi buyurtmani o‘zgartirib bo‘lmaydi',
        );
      }
  
      order.isCancelled = true;
      return this.orderRepo.save(order);
    }
  
    // ===============================
    // 📄 SESSIYA BUYURTMALARI
    // ===============================
    async getSessionOrders(sessionId: string): Promise<Order[]> {
      return this.orderRepo.find({
        where: {
          session: { id: sessionId },
          isCancelled: false,
        },
        order: { createdAt: 'ASC' },
      });
    }
  
    // ===============================
    // 💰 SESSIYA BUYURTMALARI SUMMASI
    // (SessionsService shu metodni chaqiradi)
    // ===============================
    async getSessionOrdersSum(sessionId: string): Promise<number> {
      const result = await this.orderRepo
        .createQueryBuilder('order')
        .select(
          'COALESCE(SUM(order.price * order.quantity), 0)',
          'sum',
        )
        .where('order.session_id = :sessionId', { sessionId })
        .andWhere('order.isCancelled = false')
        .getRawOne<{ sum: string }>();
  
      return result ? Number(result.sum) : 0;
    }
  }
  