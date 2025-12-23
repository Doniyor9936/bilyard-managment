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
    if (!summa || summa <= 0) {
      throw new BadRequestException('To‘lov summasi noto‘g‘ri kiritildi');
    }

    const qarz = await this.debtRepository.findOne({
      where: { id: debtId },
    });

    if (!qarz) {
      throw new BadRequestException('Qarz topilmadi');
    }

    if (qarz.status === DebtStatus.YOPILGAN) {
      throw new BadRequestException('Bu qarz allaqachon yopilgan');
    }

    const qolganSumma = qarz.totalAmount - qarz.paidAmount;

    if (summa > qolganSumma) {
      throw new BadRequestException(
        `Ortiqcha to‘lov kiritildi. Qolgan summa: ${qolganSumma}`,
      );
    }

    // 1️⃣ Payment history (BU JOYDA save OK)
    const qarzTolovi = this.debtPaymentRepository.create({
      debt: { id: qarz.id },
      amount: summa,
      receivedBy: { id: foydalanuvchi.id },
      paidAt: new Date(),
    });

    await this.debtPaymentRepository.save(qarzTolovi);

    // 2️⃣ Debt update
    const newPaidAmount = qarz.paidAmount + summa;

    await this.debtRepository.update(
      { id: qarz.id },
      {
        paidAmount: newPaidAmount,
        status:
          newPaidAmount === qarz.totalAmount
            ? DebtStatus.YOPILGAN
            : DebtStatus.QISMAN,
      },
    );

    return {
      xabar:
        newPaidAmount === qarz.totalAmount
          ? 'Qarz to‘liq yopildi'
          : 'Qarz qisman to‘landi',
    };
  }


  async createDebt(params: {
    customer: Customer;
    session: Session;
    amount: number;
  }): Promise<void> {
    const { customer, session, amount } = params;

    if (!customer) {
      throw new BadRequestException('Qarz uchun mijoz majburiy');
    }

    if (amount <= 0) {
      throw new BadRequestException('Qarz summasi noto‘g‘ri');
    }

    await this.debtRepository.insert({
      customer: { id: customer.id },
      session: { id: session.id },
      totalAmount: amount,
      paidAmount: 0,
      status: DebtStatus.OCHIQ,
      createdAt: new Date(),
    });
  }
}
