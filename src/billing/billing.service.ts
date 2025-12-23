import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaymentsService } from './payments/payments.service';
import { DebtService } from './debt/debt.service';
import { OrdersService } from 'src/orders/orders.service';
import { SettingsService } from 'src/settings/settings.service';
import { Session } from 'src/sessions/session.entity';
import { PaymentMethod } from 'src/common/enums/payment-method.enum';
import { User } from 'src/user/user.entity';
import { SessionStatus } from 'src/common/enums/session-status.enum';

@Injectable()
export class BillingService {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly debtService: DebtService,
    private readonly ordersService: OrdersService,
    private readonly settingsService: SettingsService,
  ) { }

  // =====================================================
  // 1️⃣ SESSIYA UCHUN HISOB (READ-ONLY)
  // =====================================================
  async hisobChiqarish(session: Session) {
    if (!session.startedAt || !session.endedAt) {
      throw new BadRequestException('Sessiya vaqtlari noto‘g‘ri');
    }

    // ⏱ Vaqt
    const ms = session.endedAt.getTime() - session.startedAt.getTime();
    if (ms <= 0) {
      throw new BadRequestException('Sessiya vaqti noto‘g‘ri');
    }

    const soat = Math.ceil(ms / 3600000);

    // 💰 Stol narxi
    const soatNarxi = await this.settingsService.getSoatNarxi(
      session.table.type,
    );
    const stolSumma = soat * soatNarxi;

    // 🧾 Buyurtmalar
    const buyurtmaSumma =
      await this.ordersService.getSessionOrdersSum(session.id);

    const jamiSumma = stolSumma + buyurtmaSumma;

    return {
      soat,
      stolSumma,
      buyurtmaSumma,
      jamiSumma,
    };
  }

  // =====================================================
  // 2️⃣ PAYMENT + (Ixtiyoriy) DEBT
  // =====================================================
  async sessiyaUchunTolov(params: {
    session: Session;
    method: PaymentMethod;
    user: User;
  }) {
    const { session, method, user } = params;

    if (!session) {
      throw new NotFoundException('Sessiya topilmadi');
    }

    // ⚠️ FAQAT YOPILGAN SESSIYA UCHUN
    if (session.status !== SessionStatus.COMPLETED) {
      throw new BadRequestException(
        'Avval sessiyani yopish kerak',
      );
    }

    // 1️⃣ Hisob
    const hisob = await this.hisobChiqarish(session);

    // 2️⃣ PAYMENT
    const payment = await this.paymentsService.createPayment({
      sessionId: session.id,
      customerId: session.customer?.id,
      userId: user.id,
      amount: hisob.jamiSumma,
      method,
    });

    // 3️⃣ DEBT (faqat DEBT bo‘lsa)
    if (method === PaymentMethod.DEBT) {
      if (!session.customer) {
        throw new BadRequestException(
          'Qarz faqat mijoz mavjud bo‘lsa yoziladi',
        );
      }

      await this.debtService.createDebt({
        customer: session.customer,
        session: { id: session.id } as Session,
        amount: hisob.jamiSumma,
      });
    }

    return {
      sessionId: session.id,
      jamiSumma: hisob.jamiSumma,
      paymentId: payment.id,
      paymentMethod: method,
    };
  }

  // =====================================================
  // 3️⃣ QARZNI TO‘LASH
  // =====================================================
  async qarzniTolash(params: {
    debtId: string;
    summa: number;
    user: User;
  }) {
    return this.debtService.qarzniTolash(
      params.debtId,
      params.summa,
      params.user,
    );
  }
}
