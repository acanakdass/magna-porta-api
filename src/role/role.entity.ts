import {Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {PermissionEntity} from "../permission/permission.entity";
import {UserEntity} from "../users/user.entity";
import {BaseEntity} from "../common/entities/base.entity";

@Entity('roles')
export class RoleEntity extends BaseEntity{

    @Column({unique: true})
    name!: string;

    @Column({nullable: true})
    description?: string;
    @Column({nullable: false})
    key?: string;

    @ManyToMany(() => PermissionEntity, (permission) => permission.roles, {cascade: true})
    @JoinTable({
        name: 'role_permissions',
        joinColumn: {name: 'roleId', referencedColumnName: 'id'},
        inverseJoinColumn: {name: 'permission_id', referencedColumnName: 'id'},
    })
    permissions!: PermissionEntity[];

    @OneToMany(() => UserEntity, (user) => user.role)
    users!: UserEntity[];
}


