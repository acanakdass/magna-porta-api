import {Column, Entity, ManyToMany, PrimaryGeneratedColumn} from 'typeorm';
import {RoleEntity} from "../role/role.entity";
import {BaseEntity} from "../common/entities/base.entity";

@Entity('permissions')
export class PermissionEntity  extends BaseEntity{
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ unique: true })
    name!: string;

    @Column({ nullable: true })
    description?: string;

    @Column({ nullable: false })
    key?: string;

    @ManyToMany(() => RoleEntity, (role) => role.permissions)
    roles!: RoleEntity[];
}



