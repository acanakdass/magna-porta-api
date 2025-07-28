import {
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    Column,
} from 'typeorm';

export abstract class BaseEntity {
    @PrimaryGeneratedColumn()
    id?: number;

    @CreateDateColumn()
    createdAt?: Date;

    @UpdateDateColumn()
    updatedAt?: Date;

    @DeleteDateColumn()
    deletedAt?: Date;

    @Column({ default: false })
    isDeleted: boolean;
}
