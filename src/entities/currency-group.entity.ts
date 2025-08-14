import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { CurrencyEntity } from './currency.entity';

@Entity('currency_groups')
export class CurrencyGroupEntity extends BaseEntity {
    @ApiProperty({
        description: 'Group name',
        example: 'Major Currencies'
    })
    @Column({ unique: true })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        description: 'Group description',
        example: 'Major world currencies like EUR, USD, GBP',
        required: false
    })
    @Column({ nullable: true })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({
        description: 'Whether the group is active',
        example: true
    })
    @Column({ default: true })
    isActive: boolean;

    @OneToMany(() => CurrencyEntity, (currency) => currency.currencyGroup)
    currencies: CurrencyEntity[];
}
