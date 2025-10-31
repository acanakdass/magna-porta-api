import {UsersService} from "./users.service";
import {Module} from "@nestjs/common";
import {TypeOrmModule} from "@nestjs/typeorm";
import {UsersController} from "./users.controller";
import {UserEntity} from "./user.entity";
import {UserTypeEntity} from "./user-type.entity";
import {UserTypeService} from "./user-type.service";

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, UserTypeEntity])],
  controllers: [UsersController],
  providers: [UsersService, UserTypeService],
  exports: [UsersService, UserTypeService],
})
export class UsersModule {}