import {Column, Entity, OneToMany, PrimaryGeneratedColumn} from 'typeorm';

@Entity('accounts')
export class Account{
    @PrimaryGeneratedColumn('uuid')
    id:string;

    @Column({unique:true})
    email:string;

    // @OneToMany()
}