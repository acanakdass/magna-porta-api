import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { Roles } from '../common/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateUserDto } from '../users/dtos/create-user-dto';
import { UpdateUserDto } from '../users/dtos/update-user-dto';
import { ResetPasswordDto } from './dtos/reset-password-dto';
import { PaginationDto } from '../common/models/pagination-dto';
import { BaseApiResponse } from '../common/dto/api-response-dto';
import { PaginatedResponseDto } from '../common/models/pagination-dto';
import { UserEntity } from '../users/user.entity';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Admin - User Management')
@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @Roles('admin')
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
  getStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  @Roles('admin')
  @ApiOperation({ summary: 'Get all users with pagination (Admin only)' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async getAllUsers(@Query() paginationDto: PaginationDto): Promise<BaseApiResponse<PaginatedResponseDto<UserEntity>>> {
    return this.adminService.getAllUsers(paginationDto);
  }

  @Get('users/:id')
  @Roles('admin')
  @ApiOperation({ summary: 'Get user by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(@Param('id') id: number): Promise<BaseApiResponse<UserEntity>> {
    return this.adminService.getUserById(id);
  }

  @Post('users')
  @Roles('admin')
  @ApiOperation({ summary: 'Create new user (Admin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Email or phone number already exists' })
  async createUser(@Body() createUserDto: CreateUserDto): Promise<BaseApiResponse<UserEntity>> {
    return this.adminService.createUser(createUserDto);
  }

  @Patch('users/:id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async updateUser(@Param('id') id: number, @Body() updateUserDto: UpdateUserDto): Promise<BaseApiResponse<UserEntity>> {
    return this.adminService.updateUser(id, updateUserDto);
  }

  @Delete('users/:id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUser(@Param('id') id: number): Promise<BaseApiResponse<{ message: string }>> {
    return this.adminService.deleteUser(id);
  }

  @Patch('users/:id/activate')
  @Roles('admin')
  @ApiOperation({ summary: 'Activate user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User activated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async activateUser(@Param('id') id: number): Promise<BaseApiResponse<UserEntity>> {
    return this.adminService.activateUser(id);
  }

  @Patch('users/:id/deactivate')
  @Roles('admin')
  @ApiOperation({ summary: 'Deactivate user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User deactivated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deactivateUser(@Param('id') id: number): Promise<BaseApiResponse<UserEntity>> {
    return this.adminService.deactivateUser(id);
  }

  @Post('users/:id/reset-password')
  @Roles('admin')
  @ApiOperation({ summary: 'Reset user password (Admin only)' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'Invalid password format' })
  async resetUserPassword(@Param('id') id: number, @Body() resetPasswordDto: ResetPasswordDto): Promise<BaseApiResponse<{ message: string }>> {
    return this.adminService.resetUserPassword(id, resetPasswordDto.newPassword);
  }
}