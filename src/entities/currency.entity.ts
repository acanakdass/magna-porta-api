import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { CurrencyGroupEntity } from './currency-group.entity';

@Entity('currencies')
export class CurrencyEntity extends BaseEntity {
    @ApiProperty({
        description: 'Currency code (e.g., EUR, USD, TRY)',
        example: 'EUR'
    })
    @Column({ unique: true, length: 3 })
    @IsString()
    @IsNotEmpty()
    code: string;

    @ApiProperty({
        description: 'Currency name',
        example: 'Euro'
    })
    @Column()
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        description: 'Currency symbol',
        example: '€'
    })
    @Column({ length: 5 })
    @IsString()
    @IsNotEmpty()
    symbol: string;

    @ApiProperty({
        description: 'Whether the currency is active',
        example: true
    })
    @Column({ default: true })
    isActive: boolean;

    @ApiProperty({
        description: 'Currency group ID',
        example: 1
    })
    @Column()
    groupId: number;

    // Relation
    @ManyToOne(() => CurrencyGroupEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'groupId' })
    currencyGroup: CurrencyGroupEntity;
}
