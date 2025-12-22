import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
  } from 'typeorm';
  
  @Entity('settings')
  export class Setting {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    // sozlama kaliti (o‘zbekcha)
    @Column({ unique: true })
    key: string;
  
    // qiymat (string ko‘rinishda saqlanadi)
    @Column()
    value: string;
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  }
  