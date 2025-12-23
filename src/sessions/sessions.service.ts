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

    private readonly paymentsService: PaymentsService,
    private readonly loyaltyService: LoyaltyService,
    private readonly ordersService: OrdersService,
    private readonly settingsService: SettingsService,
  ) { }

  // =====================================================
  // ▶️ SESSIYA OCHISH
  // =====================================================
  async openSession(
    tableId: string,
    customerId: string | undefined,
    openedBy: User,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const table = await manager.findOne(TableEntity, {
        where: { id: tableId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!table) throw new NotFoundException('Stol topilmadi');
      if (!table.isActive) throw new BadRequestException('Stol faol emas');
      if (table.isOccupied) throw new BadRequestException('Stol band');

      const now = new Date();

      // 🔥 STOlNI FAQAT UPDATE BILAN BAND QILAMIZ
      const updateResult = await manager.update(
        TableEntity,
        { id: table.id, isOccupied: false },
        { isOccupied: true },
      );

      if (updateResult.affected !== 1) {
        throw new BadRequestException('Stol band (parallel so‘rov)');
      }

      const customer = customerId
        ? await manager.findOne(Customer, { where: { id: customerId } })
        : null;

      const session = manager.create(Session, {
        table: { id: table.id } as TableEntity, // ⚠️ TOZA REFERENCE
        customer: customer ? ({ id: customer.id } as Customer) : null,
        openedBy: { id: openedBy.id } as User,
        startedAt: now,
        lastPointCalculatedAt: now,
        status: SessionStatus.ACTIVE,
      });

      await manager.insert(Session, session);

      return session;
    });
  }


  // =====================================================
  // ⏹ SESSIYANI YOPISH
  // =====================================================
  async closeSession(
    sessionId: string,
    paymentMethod: PaymentMethod,
    closedBy: User,
  ) {
    return this.finishSession(sessionId, paymentMethod, closedBy);
  }

  // =====================================================
  // 🚨 ADMIN FORCE CLOSE
  // =====================================================
  async forceClose(sessionId: string, user: User) {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Faqat admin ruxsatiga ega');
    }
    return this.finishSession(sessionId, PaymentMethod.DEBT, user);
  }

  // =====================================================
  // 🔒 SESSIYANI YOPISH (ASOSIY LOGIKA)
  // =====================================================
  private async finishSession(
    sessionId: string,
    paymentMethod: PaymentMethod,
    closedBy: User,
  ) {
    return this.dataSource.transaction(async (manager) => {
      // 1️⃣ SESSIONNI LOCK QILAMIZ (relationssiz)
      const lockedSession = await manager
        .createQueryBuilder(Session, 's')
        .setLock('pessimistic_write')
        .where('s.id = :id', { id: sessionId })
        .getOne();

      if (!lockedSession) {
        throw new NotFoundException('Sessiya topilmadi');
      }

      if (lockedSession.status === SessionStatus.COMPLETED) {
        throw new BadRequestException('Sessiya allaqachon yopilgan');
      }

      // 2️⃣ FULL SESSIONNI RELATIONLAR BILAN OLAMIZ (LOCK YO‘Q)
      const session = await manager.findOne(Session, {
        where: { id: sessionId },
        relations: ['table', 'customer'],
      });

      if (!session || !session.table) {
        throw new NotFoundException('Sessiya yoki stol topilmadi');
      }

      const endedAt = new Date();

      // 3️⃣ SESSION STATUS UPDATE
      await manager.update(
        Session,
        { id: session.id },
        {
          status: SessionStatus.COMPLETED,
          endedAt,
          closedBy: { id: closedBy.id } as User,
        },
      );

      // 4️⃣ VAQT HISOBLASH
      const minutes = Math.max(
        1,
        Math.ceil(
          (endedAt.getTime() - session.startedAt.getTime()) / 60000,
        ),
      );
      const hours = Math.ceil(minutes / 60);

      // 5️⃣ SUMMALAR
      const hourPrice = await this.settingsService.getSoatNarxi(
        session.table.type,
      );
      const tableAmount = hours * hourPrice;

      const ordersAmount =
        await this.ordersService.getSessionOrdersSum(session.id);

      const totalAmount = tableAmount + ordersAmount;

      // 6️⃣ PAYMENT
      await this.paymentsService.createPayment({
        session: { id: session.id } as Session,
        customer: session.customer ?? undefined,
        user: closedBy,
        amount: totalAmount,
        method: paymentMethod,
      });

      // 7️⃣ LOYALTY BALL
      if (session.customer) {
        await this.loyaltyService.sessiyaUchunBall(
          { ...session, endedAt } as Session,
          session.customer,
          closedBy,
        );
      }

      // 8️⃣ STOLNI BO‘SHATAMIZ
      await manager.update(
        TableEntity,
        { id: session.table.id, isOccupied: true },
        { isOccupied: false },
      );

      // 9️⃣ RESPONSE
      return {
        sessionId: session.id,
        hours,
        tableAmount,
        ordersAmount,
        totalAmount,
      };
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
    if (session.status === SessionStatus.PAUSED) return session;
    if (session.status !== SessionStatus.ACTIVE) {
      throw new BadRequestException('Faqat faol sessiya pauzaga qo‘yiladi');
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
    if (session.status === SessionStatus.ACTIVE) return session;
    if (session.status !== SessionStatus.PAUSED) {
      throw new BadRequestException('Faqat pauzadagi sessiya davom ettiriladi');
    }

    session.status = SessionStatus.ACTIVE;
    session.lastPointCalculatedAt = new Date();

    return this.sessionRepo.save(session);
  }
}
