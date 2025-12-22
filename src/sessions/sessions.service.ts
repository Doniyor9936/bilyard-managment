import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
  } from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
  import { DataSource, Repository } from 'typeorm';
  import { Session } from './session.entity';
  import { TableEntity } from 'src/tables/table.entity';
  import { Customer } from 'src/customers/customer.entity';
  import { User } from 'src/user/user.entity';
  import { TablesService } from 'src/tables/tables.service';
  import { PaymentsService } from 'src/billing/payments/payments.service';
  import { LoyaltyService } from 'src/loyalty/loyalty.service';
  import { OrdersService } from 'src/orders/orders.service';
  import { SettingsService } from 'src/settings/settings.service';
  import { SessionStatus } from 'src/common/enums/session-status.enum';
  import { PaymentMethod } from 'src/common/enums/payment-method.enum';
  import { UserRole } from 'src/common/enums/user-role.enum';
  
  @Injectable()
  export class SessionsService {
    constructor(
      private readonly dataSource: DataSource,
  
      @InjectRepository(Session)
      private readonly sessionRepo: Repository<Session>,
  
      @InjectRepository(TableEntity)
      private readonly tableRepo: Repository<TableEntity>,
  
      @InjectRepository(Customer)
      private readonly customerRepo: Repository<Customer>,
  
      private readonly tablesService: TablesService,
      private readonly paymentsService: PaymentsService,
      private readonly loyaltyService: LoyaltyService,
      private readonly ordersService: OrdersService,
      private readonly settingsService: SettingsService,
    ) {}
  
    // ===============================
    // ▶️ SESSIYA OCHISH
    // ===============================
    async openSession(
      tableId: string,
      customerId: string | undefined,
      openedBy: User,
    ): Promise<Session> {
      const table = await this.tableRepo.findOne({ where: { id: tableId } });
      if (!table) throw new NotFoundException('Stol topilmadi');
      if (!table.isActive) throw new BadRequestException('Stol faol emas');
      if (table.isOccupied) throw new BadRequestException('Stol band');
  
      const customer = customerId
        ? await this.customerRepo.findOne({ where: { id: customerId } })
        : null;
  
      if (customerId && !customer) {
        throw new NotFoundException('Mijoz topilmadi');
      }
  
      const session = this.sessionRepo.create({
        table,
        customer,
        openedBy,
        startedAt: new Date(),
        status: SessionStatus.ACTIVE,
      });
  
      await this.sessionRepo.save(session);
      await this.tablesService.markAsOccupied(table.id);
  
      return session;
    }
  
    // ===============================
    // ⏹ SESSIYANI YOPISH (UMUMIY)
    // ===============================
    async closeSession(
      sessionId: string,
      paymentMethod: PaymentMethod,
      closedBy: User,
    ) {
      return this.finishSession(sessionId, paymentMethod, closedBy);
    }
  
    // ===============================
    // 🚨 ADMIN FORCE CLOSE
    // ===============================
    async forceClose(sessionId: string, user: User) {
      if (user.role !== UserRole.ADMIN) {
        throw new ForbiddenException('Faqat admin ruxsatiga ega');
      }
  
      return this.finishSession(sessionId, PaymentMethod.DEBT, user);
    }
  
    // ===============================
    // 🔒 UMUMIY YOPISH LOGIKASI
    // ===============================
    private async finishSession(
      sessionId: string,
      paymentMethod: PaymentMethod,
      closedBy: User,
    ) {
      return this.dataSource.transaction(async (manager) => {
        const session = await manager.findOne(Session, {
          where: { id: sessionId },
          relations: ['table', 'customer'],
        });
  
        if (!session) throw new NotFoundException('Sessiya topilmadi');
        if (session.status === SessionStatus.COMPLETED) {
          throw new BadRequestException('Sessiya yakunlangan');
        }
  
        session.status = SessionStatus.COMPLETED;
        session.endedAt = new Date();
        session.closedBy = closedBy;
  
        await manager.save(session);
  
        const minutes = Math.ceil(
          (session.endedAt.getTime() - session.startedAt.getTime()) / 60000,
        );
        const hours = Math.ceil(minutes / 60);
  
        const hourPrice = await this.settingsService.getSoatNarxi(
          session.table.type,
        );
        const tableAmount = hours * hourPrice;
  
        const ordersAmount =
          await this.ordersService.getSessionOrdersSum(session.id);
  
        const totalAmount = tableAmount + ordersAmount;
  
        await this.paymentsService.createPayment({
          session,
          customer: session.customer ?? undefined,
          user: closedBy,
          amount: totalAmount,
          method: paymentMethod,
        });
  
        if (session.customer) {
          await this.loyaltyService.sessiyaUchunBall(
            session,
            session.customer,
            closedBy,
          );
        }
  
        await this.tablesService.markAsFree(session.table.id);
  
        return {
          sessionId: session.id,
          hours,
          tableAmount,
          ordersAmount,
          totalAmount,
        };
      });
    }
  
    // ===============================
    // ⏸ PAUZA
    // ===============================
    async pauseSession(sessionId: string) {
      const session = await this.sessionRepo.findOne({
        where: { id: sessionId },
      });
  
      if (!session) throw new NotFoundException('Sessiya topilmadi');
      if (session.status !== SessionStatus.ACTIVE) {
        throw new BadRequestException('Faqat faol sessiya pauzaga qo‘yiladi');
      }
  
      session.status = SessionStatus.PAUSED;
      return this.sessionRepo.save(session);
    }
  
    // ===============================
    // ▶️ DAVOM ETTIRISH
    // ===============================
    async resumeSession(sessionId: string) {
      const session = await this.sessionRepo.findOne({
        where: { id: sessionId },
      });
  
      if (!session) throw new NotFoundException('Sessiya topilmadi');
      if (session.status !== SessionStatus.PAUSED) {
        throw new BadRequestException('Faqat pauzadagi sessiya davom ettiriladi');
      }
  
      session.status = SessionStatus.ACTIVE;
      return this.sessionRepo.save(session);
    }
  }
  