import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import {PaginatedResponseDto, PaginationDto} from '../common/models/pagination-dto';
import {UpdateUserDto} from "./dtos/update-user-dto";
import {CreateUserDto} from "./dtos/create-user-dto";
import {UserTypeService} from "./user-type.service";
import {UserEntity} from "./user.entity";
import {UserTypeEntity} from "./user-type.entity";
import {ApiTags, ApiOperation} from "@nestjs/swagger";
import { BaseApiResponse } from '../common/dto/api-response-dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly userTypeService: UserTypeService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  async findAll(@Query() paginationDto: PaginationDto): Promise<BaseApiResponse<PaginatedResponseDto<UserEntity>>> {
    const result = await this.usersService.findAllWithPagination({...paginationDto});
    return {
      success: true,
      message: 'Users fetched successfully',
      data: result
    };
  }
  @Get('paginated')
  @ApiOperation({ summary: 'Get paginated users' })
  async findAllPaginated(@Query() paginationDto: PaginationDto & { userTypeId?: number }): Promise<BaseApiResponse<PaginatedResponseDto<UserEntity>>> {
    const result = await this.usersService.listUsersPaginated({...paginationDto});
    return {
      success: true,
      message: 'Users fetched successfully',
      data: result
    };
  }

  @Get('by-type/:userTypeId')
  @ApiOperation({ summary: 'Get users by user type' })
  async findByUserType(@Param('userTypeId') userTypeId: number, @Query() paginationDto: PaginationDto): Promise<BaseApiResponse<PaginatedResponseDto<UserEntity>>> {
    const result = await this.usersService.listUsersByUserType(userTypeId, {...paginationDto});
    return {
      success: true,
      message: 'Users fetched successfully',
      data: result
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    return this.usersService.findOneDynamic({ id });
  }

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  @Patch(':id')
  async update(@Param('id') id: number, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updateUser(id, updateUserDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: number) {
    return this.usersService.delete(id);
  }

  @Patch(':id/activate')
  async activate(@Param('id') id: number) {
    return this.usersService.activate(id);
  }

  @Get('types/list')
  @ApiOperation({ summary: 'Get all active user types (for dropdown/select)' })
  async getUserTypes(): Promise<BaseApiResponse<UserTypeEntity[]>> {
    const result = await this.userTypeService.findAll();
    return {
      success: true,
      message: 'User types fetched successfully',
      data: result
    };
  }
}