import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { PlanEntity } from './plan.entity';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

@Entity('plan_types')
export class PlanTypeEntity extends BaseEntity {
  @ApiProperty({
    description: 'Plan type name (e.g., main, custom)',
    example: 'main'
  })
  @Column({ unique: true })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({
    description: 'Plan type display name',
    example: 'Main Plans',
    required: false
  })
  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiProperty({
    description: 'Plan type description',
    example: 'Standard plans provided by the system',
    required: false
  })
  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Whether this plan type is currently active',
    example: true
  })
  @Column({ default: true })
  isActive!: boolean;

  // Relations
  @OneToMany(() => PlanEntity, (plan) => plan.planType)
  plans!: PlanEntity[];
}



