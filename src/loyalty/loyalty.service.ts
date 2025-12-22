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
  // 1️⃣ SESSIYA UCHUN BALL QO‘SHISH (SOAT ORALIG‘I BO‘YICHA)
  // =====================================================
  async sessiyaUchunBall(
    session: Session,
    customer: Customer,
    amalniBajargan: User,
  ): Promise<void> {
    if (!session.startedAt || !session.endedAt) return;

    const ms = session.endedAt.getTime() - session.startedAt.getTime();
    const soat = Math.ceil(ms / 3600000);

    // Aktiv qoidalarni olamiz
    const rules = await this.ruleRepo.find({
      where: { faol: true },
      order: { minSoat: 'DESC' },
    });

    // Mos keladigan qoidani topamiz
    const rule = rules.find(
      (r) =>
        soat >= r.minSoat &&
        (r.maxSoat === null || r.maxSoat === undefined || soat <= r.maxSoat),
    );

    if (!rule || rule.beriladiganBall <= 0) return;

    const tx = this.txRepo.create({
      customer,
      session,
      ball: rule.beriladiganBall,
      turi: BallHarakatiTuri.QOSHILDI,
      bajarganUser: amalniBajargan,
      izoh: `Sessiya uchun ${rule.beriladiganBall} ball`,
      yaratilganVaqt: new Date(),
    });

    await this.txRepo.save(tx);
  }

  // =====================================================
  // 2️⃣ MIJOZ BALL BALANSI (QUERYBUILDER YO‘Q)
  // =====================================================
  async mijozBallBalansi(customerId: string): Promise<number> {
    const transactions = await this.txRepo.find({
      where: { customer: { id: customerId } },
    });

    let balans = 0;

    for (const tx of transactions) {
      if (tx.turi === BallHarakatiTuri.QOSHILDI) {
        balans += tx.ball;
      }
      if (tx.turi === BallHarakatiTuri.AYIRILDI) {
        balans -= tx.ball;
      }
    }

    return balans;
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
  // 4️⃣ SESSIYA UCHUN TAXMINIY BALL (OLDINDAN KO‘RISH)
  // =====================================================
  async taxminiyBall(soat: number): Promise<number> {
    const rules = await this.ruleRepo.find({
      where: { faol: true },
      order: { minSoat: 'DESC' },
    });

    const rule = rules.find(
      (r) =>
        soat >= r.minSoat &&
        (r.maxSoat === null || r.maxSoat === undefined || soat <= r.maxSoat),
    );

    return rule?.beriladiganBall ?? 0;
  }

  // =====================================================
  // 6️⃣ ADMIN TOMONIDAN BALLNI QO‘LDA O‘ZGARTIRISH
  // =====================================================
  async adminBallOzgartirish(params: {
    customerId: string;
    ball: number;
    turi: BallHarakatiTuri;
    user: User;
    izoh?: string;
  }): Promise<PointTransaction> {
    const { customerId, ball, turi, user, izoh } = params;

    if (ball <= 0) {
      throw new BadRequestException('Ball miqdori noto‘g‘ri');
    }

    // Agar ayirish bo‘lsa — balansni tekshiramiz
    if (turi === BallHarakatiTuri.AYIRILDI) {
      const balans = await this.mijozBallBalansi(customerId);
      if (balans < ball) {
        throw new BadRequestException('Mijozda yetarli ball yo‘q');
      }
    }

    const tx = this.txRepo.create({
      customer: { id: customerId },
      session: null,
      ball,
      turi,
      bajarganUser: user,
      izoh: izoh ?? 'Admin tomonidan qo‘lda o‘zgartirildi',
      yaratilganVaqt: new Date(),
    });

    return this.txRepo.save(tx);
  }

}
