import {Column, Entity} from "typeorm";
import {BaseEntityOld} from "./base.entity";

@Entity('logs')
export class LogEntityOld extends BaseEntityOld {
    @Column()
    level: string;

    @Column()
    message: string;

    @Column({type: 'jsonb', nullable: true})
    metadata: Record<string, any>;

    @Column({nullable: true})
    userId: number;

    @Column({nullable: true})
    ip: string;

    @Column({nullable: true})
    userAgent: string;
}

