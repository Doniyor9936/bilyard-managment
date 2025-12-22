import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { Session } from 'src/sessions/session.entity';
import { Debt } from 'src/billing/debt/debt.entity';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fullName: string;

  @Column({ nullable: true })
  phoneNumber?: string;

  // Mijozga tegishli sessiyalar
  @OneToMany(() => Session, (session) => session.customer)
  sessions: Session[];

  // Mijozning qarzlari
  @OneToMany(() => Debt, (debt) => debt.customer)
  debts: Debt[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
