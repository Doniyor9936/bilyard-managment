import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Customer } from 'src/customers/customer.entity';
import { Session } from 'src/sessions/session.entity';
import { User } from 'src/user/user.entity';
import { PointRule } from './point-rule.entity';

// Ball harakati turlari
export enum BallHarakatiTuri {
  QOSHILDI = 'qoshildi', // Ball qo‘shildi
  AYIRILDI = 'ayirildi', // Ball ayirildi
}

@Entity('point_transactions')
export class PointTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ===============================
  // MIJOZ
  // ===============================
  @ManyToOne(() => Customer, { nullable: false })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  // ===============================
  // SESSIYA (ixtiyoriy)
  // ===============================
  // Agar ball sessiya sababli berilgan bo‘lsa
  @ManyToOne(() => Session, { nullable: true })
  @JoinColumn({ name: 'session_id' })
  session: Session | null;

  // ===============================
  // QOIDA (ADMIN BELGILAGAN)
  // ===============================
  // Qaysi rule asosida ball berildi / ayirildi
  @ManyToOne(() => PointRule, { nullable: true })
  @JoinColumn({ name: 'rule_id' })
  qoida?: PointRule;

  // ===============================
  // BALL MIQDORI
  // ===============================
  @Column({ type: 'int' })
  ball: number;

  // ===============================
  // HARAKAT TURI
  // ===============================
  @Column({
    type: 'enum',
    enum: BallHarakatiTuri,
  })
  turi: BallHarakatiTuri;

  // ===============================
  // KIM BAJARDI
  // ===============================
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'amalni_bajargan_user_id' })
  bajarganUser: User;

  // ===============================
  // IZOH
  // ===============================
  // Admin qo‘lda qo‘shganida yoki sovg‘a berilganda
  @Column({ type: 'text', nullable: true })
  izoh: string | null;

  // ===============================
  // YARATILGAN VAQT
  // ===============================
  @CreateDateColumn({ type: 'timestamptz' })
  yaratilganVaqt: Date;
}
