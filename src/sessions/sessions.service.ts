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

import { PaymentsService } from 'src/billing/payments/payments.service';
import { LoyaltyService } from 'src/loyalty/loyalty.service';
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

    private readonly paymentsService: PaymentsService,
    private readonly loyaltyService: LoyaltyService,
    private readonly settingsService: SettingsService,
  ) { }

  // =====================================================
  // ▶️ OPEN SESSION
  // =====================================================
  async openSession(params: {
    tableId: string;
    customerId: string;
    openedBy: User;
  }) {
    return this.dataSource.transaction(async (manager) => {
      const table = await manager.findOne(TableEntity, {
        where: { id: params.tableId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!table) throw new NotFoundException('Stol topilmadi');
      if (!table.isActive) throw new BadRequestException('Stol faol emas');
      if (table.isOccupied) throw new BadRequestException('Stol band');

      const customer = await manager.findOne(Customer, {
        where: { id: params.customerId },
      });

      if (!customer) throw new NotFoundException('Mijoz topilmadi');

      await manager.update(
        TableEntity,
        { id: table.id },
        { isOccupied: true },
      );

      const now = new Date();

      // 🔥 INSERT — SAVE EMAS
      const result = await manager.insert(Session, {
        table: { id: table.id },
        customer: { id: customer.id },
        openedBy: { id: params.openedBy.id },
        startedAt: now,
        lastPointCalculatedAt: now,
        status: SessionStatus.ACTIVE,
      });

      return {
        id: result.identifiers[0].id,
        table,
        customer,
        startedAt: now,
        status: SessionStatus.ACTIVE,
      };
    });
  }

  // =====================================================
  // ⏸ PAUSE
  // =====================================================
  async pauseSession(sessionId: string) {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Sessiya topilmadi');

    if (session.status !== SessionStatus.ACTIVE) {
      throw new BadRequestException('Faqat faol sessiya pauzalanadi');
    }

    session.status = SessionStatus.PAUSED;
    return this.sessionRepo.save(session);
  }

  // =====================================================
  // ▶️ RESUME
  // =====================================================
  async resumeSession(sessionId: string) {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Sessiya topilmadi');

    if (session.status !== SessionStatus.PAUSED) {
      throw new BadRequestException('Sessiya pauzada emas');
    }

    session.status = SessionStatus.ACTIVE;
    session.lastPointCalculatedAt = new Date();

    return this.sessionRepo.save(session);
  }

  // =====================================================
  // ⏹ CLOSE SESSION
  // =====================================================
  async closeSession(
    sessionId: string,
    paymentMethod: PaymentMethod,
    closedBy: User,
  ) {
    return this.dataSource.transaction(async (manager) => {
      // 1️⃣ SESSION (LOCK)
      const session = await manager.findOne(Session, {
        where: { id: sessionId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!session) throw new NotFoundException('Sessiya topilmadi');

      if (
        session.status !== SessionStatus.ACTIVE &&
        session.status !== SessionStatus.PAUSED
      ) {
        throw new BadRequestException('Sessiyani yopib bo‘lmaydi');
      }

      // 2️⃣ FULL SESSION
      const sessionFull = await manager.findOne(Session, {
        where: { id: sessionId },
        relations: ['table', 'customer'],
      });

      if (!sessionFull?.table) {
        throw new BadRequestException('Sessiya stolga bog‘lanmagan');
      }

      // 3️⃣ VAQT
      const endedAt = new Date();
      const minutes = Math.max(
        1,
        Math.ceil(
          (endedAt.getTime() - sessionFull.startedAt.getTime()) / 60000,
        ),
      );
      const hours = Math.ceil(minutes / 60);

      // 4️⃣ STOL NARXI
      const hourPrice = await this.settingsService.getSoatNarxi(
        sessionFull.table.type,
      );
      const tableAmount = hours * hourPrice;

      // 5️⃣ BUYURTMALAR
      const raw = await manager
        .createQueryBuilder()
        .select('COALESCE(SUM(o.price * o.quantity), 0)', 'sum')
        .from('orders', 'o')
        .where('o.session_id = :id', { id: sessionId })
        .andWhere('o.isCancelled = false')
        .getRawOne<{ sum: string }>();

      const ordersAmount = Number(raw?.sum ?? 0);
      let totalAmount = tableAmount + ordersAmount;

      // 6️⃣ PAYMENT
      await this.paymentsService.createPayment(
        {
          sessionId,
          customerId: sessionFull.customer?.id,
          userId: closedBy.id,
          amount: totalAmount,
          method: paymentMethod,
        },
        manager,
      );

      // 7️⃣ SESSION UPDATE
      await manager.update(
        Session,
        { id: sessionId },
        {
          status: SessionStatus.COMPLETED,
          endedAt,
          closedBy: { id: closedBy.id },
        },
      );

      // 8️⃣ TABLE FREE
      await manager.update(
        TableEntity,
        { id: sessionFull.table.id },
        { isOccupied: false },
      );

      // 9️⃣ ⭐ LOYALTY — ASOSIY JOY
      const loyaltyResult = sessionFull.customer
        ? await this.loyaltyService.applySessionPoints({
          session: { ...sessionFull, endedAt } as Session,
          customer: sessionFull.customer,
          user: closedBy,
        })
        : { earned: 0, currentBalance: 0 };

      // 🔟 RESPONSE
      return {
        session: {
          id: sessionId,
          startedAt: sessionFull.startedAt,
          endedAt,
          hours,
          status: SessionStatus.COMPLETED,
        },
        receipt: {
          tableAmount,
          ordersAmount,
          totalAmount,
        },
        loyalty: {
          earnedThisSession: loyaltyResult.earned,
          currentBalance: loyaltyResult.currentBalance,
        },
      };
    });
  }

  // =====================================================
  // 🚨 ADMIN FORCE CLOSE
  // =====================================================
  async forceClose(sessionId: string, user: User) {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Faqat admin');
    }

    return this.closeSession(sessionId, PaymentMethod.DEBT, user);
  }
}
