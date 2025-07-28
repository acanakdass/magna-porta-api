import {Body, Controller, Delete, Get, Param, Patch, Post, Query} from "@nestjs/common";
import {RolesService} from "./roles.service";
import {CreateRoleDto} from "./dtos/ceate-role.dto";
import {UpdateRoleDto} from "./dtos/update-role.dto";
import {PaginatedResponseDto, PaginationDto} from "../common/models/pagination-dto";
import {ApiTags} from "@nestjs/swagger";

import {PermissionEntity} from "../permission/permission.entity";

@ApiTags('Roles')
@Controller('roles')
export class RolesController {
    constructor(private readonly service: RolesService) {
    }
    @Get()
    async findAll(@Query() paginationDto: PaginationDto) {
        return this.service.findAllWithPagination(paginationDto);
    }

    @Get('paginated')
    async findAllPaginated(@Query() paginationDto: PaginationDto) {
        return this.service.listPaginated({...paginationDto});
    }


    @Get(':id')
    async findOne(@Param('id') id: number) {
        return this.service.findOne(id);
    }

    @Post()
    async create(@Body() dto: CreateRoleDto) {
        return this.service.create(dto);
    }

    @Patch(':id')
    async update(@Param('id') id: number, @Body() dto: UpdateRoleDto) {
        return this.service.update(id, dto);
    }

    @Delete(':id')
    async delete(@Param('id') id: number) {
        return this.service.delete(id);
    }
}