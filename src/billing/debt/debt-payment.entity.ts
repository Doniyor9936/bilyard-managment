import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Debt } from "./debt.entity";
import { User } from "src/user/user.entity";

@Entity('debt_payments')
export class DebtPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Debt)
  @JoinColumn({ name: 'debt_id' })
  debt: Debt;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'received_by_user_id' })
  receivedBy: User;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'timestamp' })
  paidAt: Date;
}
