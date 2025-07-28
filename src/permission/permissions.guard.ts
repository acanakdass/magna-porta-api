import {CanActivate, ExecutionContext, ForbiddenException, Injectable} from "@nestjs/common";
import {Reflector} from "@nestjs/core";
import {PermissionEntity} from "./permission.entity";
import {UserEntity} from "../users/user.entity";

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(private reflector: Reflector) {
    }

    canActivate(context: ExecutionContext): boolean {
        const requiredPermissions = this.reflector.get<string[]>(
            'permissions',
            context.getHandler(),
        );

        if (!requiredPermissions) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user as UserEntity;
console.log(user)

        if (!user || !user?.role?.permissions) {
            throw new ForbiddenException('User does not have sufficient permissions');
        }

        const hasPermission = requiredPermissions.every((perm) =>
            user.role?.permissions.some(
                (userPerm: PermissionEntity) => userPerm.key === perm,
            ),
        );
console.log('ownedPermissions', user.role.permissions)
console.log('requiredPermissions', requiredPermissions)
        if (!hasPermission) {
            throw new ForbiddenException(
                'User is denied access to this resource',
            );
        }

        return true;
    }
}