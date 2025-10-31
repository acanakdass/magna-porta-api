import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { UserEntity } from './user.entity';

@Entity('user_types')
export class UserTypeEntity extends BaseEntity {
  @Column({ unique: true })
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: true })
  isActive!: boolean;

  @OneToMany(() => UserEntity, (user) => user.userType)
  users!: UserEntity[];
}

