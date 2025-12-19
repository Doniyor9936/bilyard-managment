import { TableType } from "src/common/enums/table-type.enum";
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('tables')
export class TableEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string; // Stol 1, VIP 2

  @Column({ type: 'enum', enum: TableType })
  type: TableType;

  @Column()
  number: number; // Stol raqami

  @Column({ type: 'int', default: 4 })
  capacity: number; // Necha kishi sig'adi

  @Column({ default: true })
  isActive: boolean; // Faolmi

  @Column({ default: false })
  isOccupied: boolean; // Hozir bandmi

  @Column({ nullable: true })
  floor: number; // Qavat

  @Column({ nullable: true })
  section: string; // Bo'lim (A, B, C...)

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}