import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PointRule } from './point-rule.entity';
import { PointTransaction, BallHarakatiTuri } from './point-transaction.entity';
import { Session } from 'src/sessions/session.entity';
import { Customer } from 'src/customers/customer.entity';
import { User } from 'src/user/user.entity';

@Injectable()
export class LoyaltyService {
  constructor(
    @InjectRepository(PointRule)
    private readonly ruleRepo: Repository<PointRule>,

    @InjectRepository(PointTransaction)
    private readonly txRepo: Repository<PointTransaction>,

    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
  ) { }

  // =====================================================
  // 1️⃣ RULE ENGINE — sessiya bo‘yicha ball hisoblash
  // =====================================================
  async calculateFinalSessionPoints(session: Session): Promise<number> {
    // 1️⃣ startedAt / endedAt borligini tekshiramiz
    if (!session.startedAt || !session.endedAt) {
      return 0;
    }

    // 2️⃣ STRING → DATE (Postman + DB uchun universal)
    const startedAt =
      session.startedAt instanceof Date
        ? session.startedAt
        : new Date(session.startedAt);

    const endedAt =
      session.endedAt instanceof Date
        ? session.endedAt
        : new Date(session.endedAt);

    // 3️⃣ Date validligini tekshiramiz
    if (
      isNaN(startedAt.getTime()) ||
      isNaN(endedAt.getTime())
    ) {
      return 0;
    }

    // 4️⃣ Vaqt farqi (soatlarda, yuqoriga yaxlitlab)
    const diffMs = endedAt.getTime() - startedAt.getTime();
    if (diffMs <= 0) {
      return 0;
    }

    const soat = Math.ceil(diffMs / 3600000);

    // 5️⃣ Qoidalarni olamiz
    const rules = await this.ruleRepo.find({
      where: { faol: true },
      order: { minSoat: 'DESC' },
    });

    // 6️⃣ Mos qoidani topamiz
    const rule = rules.find(
      (r) =>
        soat >= r.minSoat &&
        (r.maxSoat == null || soat <= r.maxSoat),
    );

    // 7️⃣ Ballni qaytaramiz
    return rule?.beriladiganBall ?? 0;
  }


  // =====================================================
  // 2️⃣ HAQIQIY BALANS (LEDGER ASOSIDA)
  // =====================================================
  async mijozBallBalansi(customerId: string): Promise<number> {
    const list = await this.txRepo.find({
      where: { customer: { id: customerId } },
    });

    return list.reduce(
      (sum, tx) =>
        sum + (tx.turi === BallHarakatiTuri.QOSHILDI ? tx.ball : -tx.ball),
      0,
    );
  }

  // =====================================================
  // 3️⃣ MIJOZ BALL TARIXI
  // =====================================================
  async mijozBallTarixi(customerId: string) {
    return this.txRepo.find({
      where: { customer: { id: customerId } },
      order: { yaratilganVaqt: 'DESC' },
    });
  }

  // =====================================================
  // 4️⃣ SESSIYA YAKUNI → BALL YOZISH
  // =====================================================
  async applySessionPoints(params: {
    session: Session;
    customer: Customer;
    user: User;
  }): Promise<{
    earned: number;
    currentBalance: number;
  }> {
    const { session, customer, user } = params;

    const earned = await this.calculateFinalSessionPoints(session);

    if (earned > 0) {
      // LEDGER
      await this.txRepo.insert({
        customer: { id: customer.id },
        session: { id: session.id },
        ball: earned,
        turi: BallHarakatiTuri.QOSHILDI,
        bajarganUser: { id: user.id },
        izoh: 'Sessiya yakuni',
        yaratilganVaqt: new Date(),
      });

      // CUSTOMER CACHE
      await this.customerRepo.update(
        { id: customer.id },
        { pointsBalance: () => `"pointsBalance" + ${earned}` },
      );
    }

    return {
      earned,
      currentBalance: await this.mijozBallBalansi(customer.id),
    };
  }

  // =====================================================
  // 5️⃣ BALL ISHLATISH (TO‘LOVDA)
  // =====================================================
  async spendPoints(params: {
    customer: Customer;
    points: number;
    user: User;
  }): Promise<void> {
    const { customer, points, user } = params;

    if (points <= 0) return;

    const balans = await this.mijozBallBalansi(customer.id);
    if (balans < points) {
      throw new BadRequestException('Mijozda yetarli ball yo‘q');
    }

    await this.txRepo.insert({
      customer: { id: customer.id },
      session: null,
      ball: points,
      turi: BallHarakatiTuri.AYIRILDI,
      bajarganUser: { id: user.id },
      izoh: 'To‘lovda ball ishlatildi',
      yaratilganVaqt: new Date(),
    });

    await this.customerRepo.update(
      { id: customer.id },
      { pointsBalance: () => `"pointsBalance" - ${points}` },
    );
  }

  // =====================================================
  // 6️⃣ ADMIN BALL O‘ZGARTIRISH
  // =====================================================
  async adminBallOzgartirish(params: {
    customerId: string;
    ball: number;
    turi: BallHarakatiTuri;
    user: User;
    izoh?: string;
  }): Promise<void> {
    const { customerId, ball, turi, user, izoh } = params;

    if (ball <= 0) {
      throw new BadRequestException('Ball miqdori noto‘g‘ri');
    }

    if (turi === BallHarakatiTuri.AYIRILDI) {
      const balans = await this.mijozBallBalansi(customerId);
      if (balans < ball) {
        throw new BadRequestException('Mijozda yetarli ball yo‘q');
      }
    }

    await this.txRepo.insert({
      customer: { id: customerId },
      session: null,
      ball,
      turi,
      bajarganUser: { id: user.id },
      izoh: izoh ?? 'Admin tomonidan o‘zgartirildi',
      yaratilganVaqt: new Date(),
    });

    await this.customerRepo.update(
      { id: customerId },
      {
        pointsBalance: () =>
          turi === BallHarakatiTuri.QOSHILDI
            ? `"pointsBalance" + ${ball}`
            : `"pointsBalance" - ${ball}`,
      },
    );
  }
}
