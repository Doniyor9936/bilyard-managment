import { BadRequestException, Injectable } from "@nestjs/common";
import { Payment } from "./payment.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Debt } from "../debt/debt.entity";
import { PaymentMethod } from "src/common/enums/payment-method.enum";
import { DebtStatus } from "src/common/enums/debt.status.enum";
import { EntityManager, Repository } from 'typeorm';
import { Session } from "src/sessions/session.entity";
import { Customer } from "src/customers/customer.entity";
import { User } from "src/user/user.entity";

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,

    @InjectRepository(Debt)
    private readonly debtRepo: Repository<Debt>,
  ) { }

  async createPayment(
    params: {
      sessionId: string;
      customerId?: string;
      userId: string;
      amount: number;
      method: PaymentMethod;
    },
    manager?: EntityManager,
  ) {
    const repo = manager
      ? manager.getRepository(Payment)
      : this.paymentRepo;

    const debtRepo = manager
      ? manager.getRepository(Debt)
      : this.debtRepo;

    // 🔥 SAVE YO‘Q — FAQAT INSERT
    await repo.insert({
      session: { id: params.sessionId },
      customer: params.customerId ? { id: params.customerId } : null,
      receivedBy: { id: params.userId },
      amount: params.amount,
      method: params.method,
      paidAt: new Date(),
    });

    if (params.method === PaymentMethod.DEBT) {
      if (!params.customerId) {
        throw new BadRequestException('Qarz uchun mijoz majburiy');
      }

      await debtRepo.insert({
        session: { id: params.sessionId },
        customer: { id: params.customerId },
        totalAmount: params.amount,
        paidAmount: 0,
        status: DebtStatus.OCHIQ,
        createdAt: new Date(),
      });
    }
  }

}
