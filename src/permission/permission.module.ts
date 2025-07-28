import {Module} from "@nestjs/common";
import {TypeOrmModule} from "@nestjs/typeorm";
import {PermissionEntity} from "./permission.entity";
import {RoleEntity} from "../role/role.entity";
import {PermissionsService} from "./permissions.service";
import {PermissionsController} from "./permissions.controller";

@Module({
    imports: [TypeOrmModule.forFeature([PermissionEntity, RoleEntity])],
    providers: [PermissionsService],
    controllers: [PermissionsController],
    exports: [PermissionsService],
})
export class PermissionModule {
}