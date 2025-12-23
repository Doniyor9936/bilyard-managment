import { BadRequestException, Injectable } from "@nestjs/common";
import { Payment } from "./payment.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Debt } from "../debt/debt.entity";
import { Session } from "src/sessions/session.entity";
import { Customer } from "src/customers/customer.entity";
import { User } from "src/user/user.entity";
import { PaymentMethod } from "src/common/enums/payment-method.enum";
import { DebtStatus } from "src/common/enums/debt.status.enum";

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,

    @InjectRepository(Debt)
    private readonly debtRepo: Repository<Debt>,
  ) { }

  async createPayment(params: {
    sessionId: string;
    customerId?: string;
    userId: string;
    amount: number;
    method: PaymentMethod;
  }) {
    const { sessionId, customerId, userId, amount, method } = params;

    if (method === PaymentMethod.DEBT && !customerId) {
      throw new BadRequestException('Qarz uchun mijoz majburiy');
    }

    // 1️⃣ PAYMENT
    const payment = this.paymentRepo.create({
      session: { id: sessionId },
      customer: customerId ? { id: customerId } : null,
      receivedBy: { id: userId },
      amount,
      method,
      paidAt: new Date(),
    });

    await this.paymentRepo.save(payment);

    // 2️⃣ DEBT
    if (method === PaymentMethod.DEBT) {
      await this.debtRepo.insert({
        customer: { id: customerId! },
        session: { id: sessionId },
        totalAmount: amount,
        paidAmount: 0,
        status: DebtStatus.OCHIQ,
        createdAt: new Date(),
      });
    }

    return payment;
  }
}
