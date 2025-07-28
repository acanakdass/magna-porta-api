import {Column, Entity, JoinColumn, ManyToOne} from "typeorm";
import {BaseEntityOld} from "./base.entity";
import {UserEntity} from "../users/user.entity";

@Entity('refresh_tokens')
export class RefreshTokenEntity extends BaseEntityOld {
    @Column()
    token: string;

    @Column()
    expiresAt: Date;

    @Column()
    userId: number;

    @ManyToOne(() => UserEntity)
    @JoinColumn({name: 'userId'})
    user: UserEntity;

    @Column({default: true})
    isValid: boolean;
}