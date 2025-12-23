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
  ) { }

  // =====================================================
  // 🔹 SESSIYA YAKUNIDA BALL HISOBLASH (ASOSIY METOD)
  // =====================================================
  async calculateFinalSessionPoints(
    session: Session,
    customer: Customer,
    closedBy: User,
  ): Promise<number> {
    if (!session.startedAt || !session.endedAt) {
      return 0;
    }

    // 1️⃣ O‘ynalgan vaqt
    const ms = session.endedAt.getTime() - session.startedAt.getTime();
    if (ms <= 0) return 0;

    const soat = Math.ceil(ms / 3600000);

    // 2️⃣ Faol qoidalarni olamiz
    const rules = await this.ruleRepo.find({
      where: { faol: true },
      order: { minSoat: 'DESC' },
    });

    // 3️⃣ Mos qoida
    // 3️⃣ Mos qoida
    const rule = rules.find((r) => {
      if (soat < r.minSoat) {
        return false;
      }

      if (r.maxSoat === undefined || r.maxSoat === null) {
        return true;
      }

      return soat <= r.maxSoat;
    });

    // ⚠️ MUHIM: rule topilmasa chiqib ketamiz
    if (!rule || rule.beriladiganBall <= 0) {
      return 0;
    }

    // 4️⃣ Ball yozamiz
    await this.txRepo.insert({
      customer: { id: customer.id },
      session: { id: session.id },
      ball: rule.beriladiganBall,
      turi: BallHarakatiTuri.QOSHILDI,
      bajarganUser: { id: closedBy.id },
      izoh: `Sessiya (${soat} soat) uchun ${rule.beriladiganBall} ball`,
      yaratilganVaqt: session.endedAt,
    });

    return rule.beriladiganBall;
  }
  // =====================================================
  // 🔹 MIJOZ BALL BALANSI
  // =====================================================
  async mijozBallBalansi(customerId: string): Promise<number> {
    const transactions = await this.txRepo.find({
      where: { customer: { id: customerId } },
    });

    let balans = 0;

    for (const tx of transactions) {
      balans +=
        tx.turi === BallHarakatiTuri.QOSHILDI
          ? tx.ball
          : -tx.ball;
    }

    return balans;
  }

  // =====================================================
  // 🔹 MIJOZ BALL TARIXI
  // =====================================================
  async mijozBallTarixi(customerId: string) {
    return this.txRepo.find({
      where: { customer: { id: customerId } },
      order: { yaratilganVaqt: 'DESC' },
    });
  }

  // =====================================================
  // 🔹 ADMIN TOMONIDAN BALL O‘ZGARTIRISH
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
  }
}
