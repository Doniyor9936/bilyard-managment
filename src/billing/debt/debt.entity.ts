import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Customer } from 'src/customers/customer.entity';
import { Session } from 'src/sessions/session.entity';
import { DebtStatus } from 'src/common/enums/debt.status.enum';

@Entity('debts')
export class Debt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Qarz qaysi mijozga tegishli
  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  // Qarz qaysi sessiya sababli
  @ManyToOne(() => Session)
  @JoinColumn({ name: 'session_id' })
  session: Session;

  // Umumiy qarz summasi
  @Column({ type: 'decimal'})
  totalAmount: number;

  // To‘langan summa
  @Column({ type: 'decimal',})
  paidAmount: number;

  // Qarz holati (OCHIQ, QISMAN, YOPILGAN)
  @Column({
    type: 'enum',
    enum: DebtStatus,
    default: DebtStatus.OCHIQ,
  })
  status: DebtStatus; // ✅ FAQAT SHU

  // Yaratilgan vaqt
  @Column({ type: 'timestamp' })
  createdAt: Date;
}
