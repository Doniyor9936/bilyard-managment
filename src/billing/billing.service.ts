import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PaymentsService } from './payments/payments.service';
import { DebtService } from './debt/debt.service';
import { LoyaltyService } from 'src/loyalty/loyalty.service';
import { OrdersService } from 'src/orders/orders.service';
import { SettingsService } from 'src/settings/settings.service';
import { Session } from 'src/sessions/session.entity';
import { PaymentMethod } from 'src/common/enums/payment-method.enum';
import { User } from 'src/user/user.entity';

@Injectable()
export class BillingService {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly debtService: DebtService,
    private readonly loyaltyService: LoyaltyService,
    private readonly ordersService: OrdersService,
    private readonly settingsService: SettingsService,
  ) {}

  // =====================================================
  // 1️⃣ SESSIYA UCHUN HISOB CHIQARISH
  // =====================================================
  async hisobChiqarish(session: Session) {
    if (!session.startedAt || !session.endedAt) {
      throw new BadRequestException('Sessiya vaqtlari noto‘g‘ri');
    }

    // ⏱ O‘ynalgan vaqt
    const ms = session.endedAt.getTime() - session.startedAt.getTime();
    const soat = Math.ceil(ms / 3600000);

    // 💰 Stol narxi
    const soatNarxi = await this.settingsService.getSoatNarxi(session.table.type);
    const stolSumma = soat * soatNarxi;

    // 🧾 Buyurtmalar summasi
    const buyurtmaSumma = await this.ordersService.getSessionOrdersSum(session.id);

    const jamiSumma = stolSumma + buyurtmaSumma;

    return {
      soat,
      stolSumma,
      buyurtmaSumma,
      jamiSumma,
    };
  }

  // =====================================================
  // 2️⃣ SESSIYANI YOPISH + TO‘LOVNI RASMIYLASHTIRISH
  // =====================================================
  async sessiyaUchunTolov(params: { session: Session; method: PaymentMethod; user: User }) {
    const { session, method, user } = params;

    if (!session) {
      throw new NotFoundException('Sessiya topilmadi');
    }

    // 1️⃣ Hisob
    const hisob = await this.hisobChiqarish(session);

    // 2️⃣ PAYMENT (har qanday holatda yoziladi)
    const payment = await this.paymentsService.createPayment({
      session,
      customer: session.customer ?? undefined,
      user,
      amount: hisob.jamiSumma,
      method,
    });

    // 3️⃣ AGAR QARZ BO‘LSA → QARZ YARATILADI
    if (method === PaymentMethod.DEBT) {
      if (!session.customer) {
        throw new BadRequestException('Qarz faqat mijoz mavjud bo‘lsa yoziladi');
      }

      await this.debtService.createDebt({
        customer: session.customer,
        session,
        amount: hisob.jamiSumma,
        // user,
      });
    }

    // 4️⃣ LOYALTY → BALL QO‘SHISH
    if (session.customer) {
      await this.loyaltyService.sessiyaUchunBall(session, session.customer, user);
    }

    return {
      sessionId: session.id,
      jamiSumma: hisob.jamiSumma,
      paymentId: payment.id,
      paymentMethod: method,
    };
  }

  // =====================================================
  // 3️⃣ QARZNI TO‘LASH (XODIM / ADMIN)
  // =====================================================
  async qarzniTolash(params: { debtId: string; summa: number; user: User }) {
    return this.debtService.qarzniTolash(params.debtId, params.summa, params.user);
  }
}
