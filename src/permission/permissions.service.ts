import {Injectable, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {PermissionEntity} from './permission.entity';
import {RoleEntity} from '../role/role.entity';
import {BaseService} from "../common/services/base.service";
import {PaginatedResponseDto, PaginationDto} from "../common/models/pagination-dto";
import {UserEntity} from "../users/user.entity";

@Injectable()
export class PermissionsService extends  BaseService<PermissionEntity> {
  constructor(
    @InjectRepository(PermissionEntity)
    private readonly permissionRepository: Repository<PermissionEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
  ) {
    super(permissionRepository);
  }

  async listPaginated(paginationDto: PaginationDto): Promise<PaginatedResponseDto<PermissionEntity>> {
    return await this.findAllWithPagination({
      ...paginationDto,
      select: [],
      relations: ['roles'],
      where: {},
    });
  }
  async getPermissions(): Promise<PermissionEntity[]> {
    return this.permissionRepository.find();
  }

  async getRoles(): Promise<RoleEntity[]> {
    return this.roleRepository.find({ relations: ['permissions'] });
  }

  async assignPermissionToRole(
    roleId: number,
    permissionId: number,
  ): Promise<RoleEntity> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ['permissions'],
    });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const permission = await this.permissionRepository.findOne({
      where: { id: permissionId },
    });
    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    role.permissions.push(permission);
    return this.roleRepository.save(role);
  }
}



