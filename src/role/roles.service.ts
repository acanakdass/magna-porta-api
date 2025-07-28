import {Injectable, NotFoundException} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {RoleEntity} from "./role.entity";
import {Repository} from "typeorm";
import {CreateRoleDto} from "./dtos/ceate-role.dto";
import {UpdateRoleDto} from "./dtos/update-role.dto";
import {BaseService} from "../common/services/base.service";
import {PaginatedResponseDto, PaginationDto} from "../common/models/pagination-dto";

@Injectable()
export class RolesService extends  BaseService<RoleEntity>{
    constructor(
        @InjectRepository(RoleEntity)
        private readonly roleRepository: Repository<RoleEntity>,
    ) {
        super(roleRepository);
    }

    async listPaginated(paginationDto: PaginationDto): Promise<PaginatedResponseDto<RoleEntity>> {
        return await this.findAllWithPagination({
            ...paginationDto,
            select: [],
            relations: ['permissions'],
            where: {},
        });
    }
    async findAll(): Promise<RoleEntity[]> {
        return this.roleRepository.find();
    }

    async findOne(id: number): Promise<RoleEntity> {
        const role = await this.roleRepository.findOne({where: {id}});
        if (!role) {
            throw new NotFoundException(`Role with ID ${id} not found`);
        }
        return role;
    }

    async create(dto: CreateRoleDto): Promise<RoleEntity> {
        const role = this.roleRepository.create({
            name: dto.name,
            description: dto.description,
            key:dto.key
        });
        return this.roleRepository.save(role);
    }

    async update(id: number, dto: UpdateRoleDto): Promise<RoleEntity> {
        await this.findOne(id);
        await this.roleRepository.update(id, dto);
        return this.findOne(id);
    }

    async delete(id: number): Promise<void> {
        const result = await this.roleRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`Role with ID ${id} not found`);
        }
    }
}

