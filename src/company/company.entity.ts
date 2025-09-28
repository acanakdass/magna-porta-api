import {Entity, Column, ManyToOne, JoinColumn, OneToMany} from 'typeorm';
import {RoleEntity} from "../role/role.entity";
import {IsNotEmpty, IsOptional, IsString, IsNumber} from 'class-validator';
import {BaseEntity} from "../common/entities/base.entity";
import {UserEntity} from "../users/user.entity";
import {PlanEntity} from "../plan/plan.entity";
import {ApiProperty} from "@nestjs/swagger";


@Entity('companies')
export class CompanyEntity extends BaseEntity {

  @Column({ unique: true })
  name!: string;

  @OneToMany(() => UserEntity, (user) => user.company)
  users!: UserEntity[];

  @Column({ default: false })
  isVerified!: boolean;

  @Column({ default: false })
  isActive!: boolean;

  @Column({ default: false })
  isDeleted!: boolean;

  @Column({nullable: true})
  airwallex_account_id?: string;

  @ApiProperty({
    description: 'Plan ID for this company',
    example: 1,
    required: false
  })
  @Column({ nullable: true })
  @IsOptional()
  @IsNumber()
  planId?: number;

  @ApiProperty({
    description: 'Company plan relationship',
    type: () => PlanEntity,
    required: false
  })
  @ManyToOne(() => PlanEntity, (plan) => plan.companies, { nullable: true })
  @JoinColumn({ name: 'planId' })
  plan?: PlanEntity;
}