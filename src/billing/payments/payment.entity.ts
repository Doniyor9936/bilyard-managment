import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Session } from 'src/sessions/session.entity';
import { User } from 'src/user/user.entity';
import { Customer } from 'src/customers/customer.entity';
import { PaymentMethod } from 'src/common/enums/payment-method.enum';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Session)
  @JoinColumn({ name: 'session_id' })
  session: Session;

  @ManyToOne(() => Customer, { nullable: true })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'received_by_user_id' })
  receivedBy: User;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  // 🔥 MUHIM JOY
  @Column({
    type: 'enum',
    enum: PaymentMethod,
  })
  method: PaymentMethod;

  @Column({ type: 'timestamp' })
  paidAt: Date;
}
