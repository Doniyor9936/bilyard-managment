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
  // ▶️ SESSIYA OCHISH (MIJOZ MAJBURIY)
  // =====================================================
  async openSession(params: {
    tableId: string;
    customerId: string;
    openedBy: User;
  }) {
    return this.dataSource.transaction(async (manager) => {
      // 1️⃣ Stolni lock qilamiz
      const table = await manager.findOne(TableEntity, {
        where: { id: params.tableId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!table) throw new NotFoundException('Stol topilmadi');
      if (!table.isActive) throw new BadRequestException('Stol faol emas');
      if (table.isOccupied) throw new BadRequestException('Stol band');

      // 2️⃣ Mijozni tekshiramiz
      const customer = await manager.findOne(Customer, {
        where: { id: params.customerId },
      });

      if (!customer) throw new NotFoundException('Mijoz topilmadi');

      // 3️⃣ Stolni band qilamiz
      const updateResult = await manager.update(
        TableEntity,
        { id: table.id, isOccupied: false },
        { isOccupied: true },
      );

      if (updateResult.affected !== 1) {
        throw new BadRequestException('Stol band (parallel so‘rov)');
      }

      // 4️⃣ Sessiya yaratamiz
      const now = new Date();

      const session = manager.create(Session, {
        table,
        customer,
        openedBy: params.openedBy,
        startedAt: now,
        lastPointCalculatedAt: now,
        status: SessionStatus.ACTIVE,
      });

      await manager.save(session);
      return session;
    });
  }

  // =====================================================
  // ⏸ PAUZA
  // =====================================================
  async pauseSession(sessionId: string) {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
    });

    if (!session) throw new NotFoundException('Sessiya topilmadi');

    if (session.status === SessionStatus.PAUSED) {
      return session;
    }

    if (session.status !== SessionStatus.ACTIVE) {
      throw new BadRequestException(
        'Faqat faol sessiyani pauzaga qo‘yish mumkin',
      );
    }

    session.status = SessionStatus.PAUSED;
    return this.sessionRepo.save(session);
  }

  // =====================================================
  // ▶️ DAVOM ETTIRISH
  // =====================================================
  async resumeSession(sessionId: string) {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
    });

    if (!session) throw new NotFoundException('Sessiya topilmadi');

    if (session.status === SessionStatus.ACTIVE) {
      return session;
    }

    if (session.status !== SessionStatus.PAUSED) {
      throw new BadRequestException(
        'Faqat pauzadagi sessiyani davom ettirish mumkin',
      );
    }

    session.status = SessionStatus.ACTIVE;
    session.lastPointCalculatedAt = new Date();

    return this.sessionRepo.save(session);
  }

  // =====================================================
  // ⏹ SESSIYANI YOPISH (HISOB + PAYMENT + BALL)
  // =====================================================
  async closeSession(
    sessionId: string,
    paymentMethod: PaymentMethod,
    closedBy: User,
  ) {
    return this.dataSource.transaction(async (manager) => {
      // 1️⃣ LOCK + RELATIONS
      const session = await manager.findOne(Session, {
        where: { id: sessionId },
        relations: ['table', 'customer'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!session) throw new NotFoundException('Sessiya topilmadi');

      if (![SessionStatus.ACTIVE, SessionStatus.PAUSED].includes(session.status)) {
        throw new BadRequestException('Sessiyani yopib bo‘lmaydi');
      }

      // 2️⃣ VAQT
      const endedAt = new Date();
      const minutes = Math.max(
        1,
        Math.ceil(
          (endedAt.getTime() - session.startedAt.getTime()) / 60000,
        ),
      );
      const hours = Math.ceil(minutes / 60);

      // 3️⃣ STOL HISOBI
      const hourPrice = await this.settingsService.getSoatNarxi(
        session.table.type,
      );
      const tableAmount = hours * hourPrice;

      // 4️⃣ BUYURTMALAR
      const raw = await manager
        .createQueryBuilder()
        .select('COALESCE(SUM(o.price * o.quantity), 0)', 'sum')
        .from('orders', 'o')
        .where('o.session_id = :id', { id: session.id })
        .andWhere('o.isCancelled = false')
        .getRawOne<{ sum: string }>();

      const ordersAmount = Number(raw?.sum ?? 0);
      const totalAmount = tableAmount + ordersAmount;

      // 5️⃣ PAYMENT
      await this.paymentsService.createPayment({
        sessionId: session.id,
        customerId: session.customer.id,
        userId: closedBy.id,
        amount: totalAmount,
        method: paymentMethod,
      });

      // 6️⃣ SESSIYA YOPISH
      session.status = SessionStatus.COMPLETED;
      session.endedAt = endedAt;
      session.closedBy = closedBy;
      await manager.save(session);

      // 7️⃣ STOLNI BO‘SHATISH
      session.table.isOccupied = false;
      await manager.save(session.table);

      // 8️⃣ BALL
      const pointsEarned =
        await this.loyaltyService.calculateFinalSessionPoints(
          session,
          session.customer,
          closedBy,
        );

      // 9️⃣ RESPONSE (SESSION + RECEIPT)
      return {
        session: {
          id: session.id,
          startedAt: session.startedAt,
          endedAt,
          hours,
          status: session.status,
        },
        receipt: {
          tableAmount,
          ordersAmount,
          totalAmount,
          pointsEarned,
        },
      };
    });
  }

  // =====================================================
  // 🚨 ADMIN FORCE CLOSE
  // =====================================================
  async forceClose(sessionId: string, user: User) {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Faqat admin ruxsatiga ega');
    }

    return this.closeSession(sessionId, PaymentMethod.DEBT, user);
  }
}
