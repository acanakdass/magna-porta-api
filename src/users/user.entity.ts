import {Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Unique} from 'typeorm';
import {RoleEntity} from "../role/role.entity";
import {IsNotEmpty, IsOptional, IsString} from 'class-validator';
import {BaseEntity} from "../common/entities/base.entity";
import {CompanyEntity} from "../company/company.entity";


@Entity('users')
export class UserEntity extends BaseEntity {
  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @IsOptional()
  @IsString()
  @Column({ nullable: false })
  phoneNumber?: string;


  @Column({ default: false })
  isVerified!: boolean;
  @Column({ default: false })
  isActive!: boolean;

  @Column({ nullable: true })
  emailVerificationToken!: string;

  @Column({ nullable: true })
  resetPasswordToken!: string;

  @ManyToOne(() => RoleEntity, (role) => role.users, { cascade: true })
  @JoinColumn({ name: 'roleId' })
  role!: RoleEntity;

  @Column({ nullable: true })
  @IsNotEmpty()
  roleId: number;

  @ManyToOne(() => CompanyEntity, (company) => company.users, { cascade: true })
  @JoinColumn({ name: 'companyId' })
  company!: CompanyEntity;

  @Column({ nullable: true })
  @IsNotEmpty()
  companyId: number;

  @Column({ default: false })
  @IsNotEmpty()
  scaSetup: boolean;
}