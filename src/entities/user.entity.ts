import {Column, Entity} from "typeorm";
import {BaseEntityOld} from "./base.entity";
import {Exclude} from "class-transformer";

@Entity('users')
export class UserEntityOld extends BaseEntityOld {
    @Column({unique: true})
    email: string;

    @Column()
    @Exclude()
    password: string;

    @Column({nullable: true})
    firstName: string;

    @Column({nullable: true})
    lastName: string;



    @Column({default: true})
    isActive: boolean;
}




