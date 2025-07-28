import {Entity, Column, ManyToOne, JoinColumn, OneToMany} from 'typeorm';
import {RoleEntity} from "../role/role.entity";
import {IsNotEmpty, IsOptional, IsString} from 'class-validator';
import {BaseEntity} from "../common/entities/base.entity";
import {UserEntity} from "../users/user.entity";
import {ApiProperty} from "@nestjs/swagger";


@Entity('companies')
export class CompanyEntity extends BaseEntity {

  @Column({ unique: true })
  name!: string;

  @OneToMany(() => UserEntity, (user) => user.role)
  users!: UserEntity[];

  @Column({ default: false })
  isVerified!: boolean;

  @Column({ default: false })
  isActive!: boolean;

  @Column({nullable: true})
  airwallex_account_id?: string;
}