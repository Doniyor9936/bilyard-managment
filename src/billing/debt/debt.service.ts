import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Debt } from './debt.entity';
import { DebtPayment } from './debt-payment.entity';
import { User } from 'src/user/user.entity';
import { DebtStatus } from 'src/common/enums/debt.status.enum';
import { Customer } from 'src/customers/customer.entity';
import { Session } from 'src/sessions/session.entity';

@Injectable()
export class DebtService {
  constructor(
    @InjectRepository(Debt)
    private readonly debtRepository: Repository<Debt>,

    @InjectRepository(DebtPayment)
    private readonly debtPaymentRepository: Repository<DebtPayment>,
  ) { }

  /**
   * Qarzni qisman yoki to‘liq to‘lash
   * (XODIM ham, ADMIN ham ishlata oladi)
   */
  async qarzniTolash(debtId: string, summa: number, foydalanuvchi: User) {
    // 1️⃣ Summa tekshiruvi
    if (!summa || summa <= 0) {
      throw new BadRequestException('To‘lov summasi noto‘g‘ri kiritildi');
    }

    // 2️⃣ Qarzni topamiz
    const qarz = await this.debtRepository.findOne({
      where: { id: debtId },
    });

    if (!qarz) {
      throw new BadRequestException('Qarz topilmadi');
    }

    // 3️⃣ Agar qarz allaqachon yopilgan bo‘lsa
    if (qarz.status === DebtStatus.YOPILGAN) {
      throw new BadRequestException('Bu qarz allaqachon yopilgan');
    }

    // 4️⃣ Qolgan qarz summasini hisoblaymiz
    const qolganSumma = qarz.totalAmount - qarz.paidAmount;

    if (summa > qolganSumma) {
      throw new BadRequestException(`Ortiqcha to‘lov kiritildi. Qolgan summa: ${qolganSumma}`);
    }

    // 5️⃣ Qarzni to‘lash yozuvi (tarix uchun)
    const qarzTolovi = this.debtPaymentRepository.create({
      debt: qarz,
      amount: summa,
      receivedBy: foydalanuvchi,
      paidAt: new Date(),
    });

    await this.debtPaymentRepository.save(qarzTolovi);

    // 6️⃣ Qarzni yangilaymiz
    qarz.paidAmount += summa;

    if (qarz.paidAmount === qarz.totalAmount) {
      qarz.status = DebtStatus.YOPILGAN; // Qarz to‘liq yopildi
    } else {
      qarz.status = DebtStatus.QISMAN; // Qarz qisman to‘landi
    }

    await this.debtRepository.save(qarz);

    // 7️⃣ Natija
    return {
      xabar: qarz.status === DebtStatus.YOPILGAN ? 'Qarz to‘liq yopildi' : 'Qarz qisman to‘landi',
      qarz,
    };
  }

  async createDebt(params: {
    customer: Customer;
    session: Session;
    amount: number;
  }): Promise<Debt> {
    const { customer, session, amount } = params;

    if (!customer) {
      throw new BadRequestException('Qarz uchun mijoz majburiy');
    }

    if (amount <= 0) {
      throw new BadRequestException('Qarz summasi noto‘g‘ri');
    }

    const debt = this.debtRepository.create({
      customer,
      session,
      totalAmount: amount,
      paidAmount: 0,
      status: DebtStatus.OCHIQ,
      createdAt: new Date(),
    });

    return this.debtRepository.save(debt);
  }

}
