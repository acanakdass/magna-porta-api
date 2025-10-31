import {Module} from "@nestjs/common";
import {TypeOrmModule} from "@nestjs/typeorm";
import {UserTypeEntity} from "./user-type.entity";

@Module({
    imports: [TypeOrmModule.forFeature([UserTypeEntity])],
    exports: [TypeOrmModule],
})
export class UserTypeModule {}

