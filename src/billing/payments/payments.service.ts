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
    private paymentRepo: Repository<Payment>,

    @InjectRepository(Debt)
    private debtRepo: Repository<Debt>,
  ) {}

  async createPayment(params: {
    session: Session;
    customer?: Customer;
    user: User;
    amount: number;
    method: PaymentMethod;
  }) {
    const { session, customer, user, amount, method } = params;
  
    if (method === PaymentMethod.DEBT && !customer) {
      throw new BadRequestException('Qarz uchun mijoz majburiy');
    }
  
    // 1️⃣ Payment yozamiz
    const payment = this.paymentRepo.create({
      session: { id: session.id },
      customer: customer ? { id: customer.id } : null,
      receivedBy: { id: user.id },
      amount,
      method,
      paidAt: new Date(),
    });
  
    await this.paymentRepo.save(payment);
  
    // 2️⃣ Agar qarz bo‘lsa — Debt yaratamiz
    if (method === PaymentMethod.DEBT) {
      const debt = this.debtRepo.create({
        customer: { id: customer!.id }, // ❗ relation ID bilan
        session: { id: session.id },   // ❗ relation ID bilan
        totalAmount: amount,
        paidAmount: 0,
        status: DebtStatus.OCHIQ,       // ✅ ENG MUHIM JOY
        createdAt: new Date(),
      });
  
      await this.debtRepo.save(debt);
    }
  
    return payment;
  }
  
}
