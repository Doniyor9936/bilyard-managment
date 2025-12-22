import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TableEntity } from 'src/tables/table.entity';
import { Customer } from 'src/customers/customer.entity';
import { User } from 'src/user/user.entity';
import { SessionStatus } from 'src/common/enums/session-status.enum';

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Qaysi stol
  @ManyToOne(() => TableEntity)
  @JoinColumn({ name: 'table_id' })
  table: TableEntity;

  // Qaysi mijoz
  @ManyToOne(() => Customer, { nullable: true })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer | null;

  // Sessiyani kim ochdi
  @ManyToOne(() => User)
  @JoinColumn({ name: 'opened_by_user_id' })
  openedBy: User;

  // Sessiyani kim yopdi
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'closed_by_user_id' })
  closedBy: User | null;

  @Column({ type: 'timestamp' })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  endedAt: Date | null;

  @Column({ type: 'enum', enum: SessionStatus })
  status: SessionStatus;
}
