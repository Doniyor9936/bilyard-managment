import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Customer } from 'src/customers/customer.entity';
import { User } from 'src/user/user.entity';

export enum LoyaltyAction {
    EARN = 'EARN',
    SPEND = 'SPEND',
}

@Entity('loyalty_history')
export class LoyaltyHistory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Customer)
    customer: Customer;

    @ManyToOne(() => User)
    createdBy: User;

    // + yoki - ball
    @Column({ type: 'int' })
    points: number;

    @Column({ type: 'enum', enum: LoyaltyAction })
    action: LoyaltyAction;

    @Column({ nullable: true })
    reason?: string;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;
}
