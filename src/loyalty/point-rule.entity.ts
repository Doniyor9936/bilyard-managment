import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('point_rules')
export class PointRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nomi: string;

  @Column({ type: 'int' })
  minSoat: number;

  @Column({ type: 'int', nullable: true })
  maxSoat?: number;

  @Column({ type: 'int' })
  beriladiganBall: number;

  @Column({ default: true })
  faol: boolean;

  @CreateDateColumn()
  yaratilganVaqt: Date;
}
