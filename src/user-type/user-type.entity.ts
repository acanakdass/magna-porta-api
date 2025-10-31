import {Column, Entity, OneToMany} from "typeorm";
import {UserEntity} from "../users/user.entity";
import {BaseEntity} from "../common/entities/base.entity";

@Entity('user_types')
export class UserTypeEntity extends BaseEntity {

    @Column({unique: true})
    name!: string;

    @Column({nullable: true})
    description?: string;

    @OneToMany(() => UserEntity, (user) => user.userType)
    users!: UserEntity[];
}

