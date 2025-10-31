import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { UserTypeService } from '../users/user-type.service';
import { CreateUserDto } from '../users/dtos/create-user-dto';
import { UpdateUserDto } from '../users/dtos/update-user-dto';
import { PaginationDto } from '../common/models/pagination-dto';
import { BaseApiResponse } from '../common/dto/api-response-dto';
import { PaginatedResponseDto } from '../common/models/pagination-dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly usersService: UsersService,
    private readonly userTypeService: UserTypeService,
  ) {}

  getDashboardStats() {
    return {
      users: 123,
      logs: 456,
      uptime: process.uptime(),
    };
  }

  async getAllUsers(paginationDto: PaginationDto & { userTypeId?: number }): Promise<BaseApiResponse<PaginatedResponseDto<UserEntity>>> {
    try {
      const result = await this.usersService.listUsersPaginated(paginationDto);
      return {
        success: true,
        message: 'Users retrieved successfully',
        data: result,
      };
    } catch (error) {
      throw new BadRequestException('Failed to retrieve users');
    }
  }

  async getUserById(id: number): Promise<BaseApiResponse<UserEntity>> {
    try {
      const user = await this.usersService.findOneForAdmin(id);
      const userWithRelations = await this.usersService.findOneDynamic({ id }, ['role', 'company']);
      if (!userWithRelations) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      return {
        success: true,
        message: 'User retrieved successfully',
        data: userWithRelations,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to retrieve user');
    }
  }

  async createUser(createUserDto: CreateUserDto): Promise<BaseApiResponse<UserEntity>> {
    try {
      const user = await this.usersService.createUser(createUserDto);
      return {
        success: true,
        message: 'User created successfully',
        data: user,
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to create user');
    }
  }

  async updateUser(id: number, updateUserDto: UpdateUserDto): Promise<BaseApiResponse<UserEntity>> {
    try {
      // Admin için özel update metodu - isActive kontrolü yok
      const user = await this.usersService.findOneForAdmin(id);
      
      // If password update is requested
      if (updateUserDto.password) {
        updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
      }

      if (updateUserDto.email && updateUserDto.email !== user.email) {
        const existingUser = await this.usersService.findByEmail(updateUserDto.email);
        if (existingUser) {
          throw new BadRequestException('Email already exists');
        }
      }

      Object.assign(user, updateUserDto);
      const updatedUser = await this.userRepository.save(user);
      
      return {
        success: true,
        message: 'User updated successfully',
        data: updatedUser,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(error.message || 'Failed to update user');
    }
  }

  async deleteUser(id: number): Promise<BaseApiResponse<{ message: string }>> {
    try {
      await this.usersService.softRemoveForAdmin(id);
      return {
        success: true,
        message: 'User deleted successfully',
        data: { message: 'User has been marked as deleted' },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete user');
    }
  }

  async activateUser(id: number): Promise<BaseApiResponse<UserEntity>> {
    try {
      const user = await this.usersService.findOneForAdmin(id);
      user.isActive = true;
      const updatedUser = await this.userRepository.save(user);
      return {
        success: true,
        message: 'User activated successfully',
        data: updatedUser,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to activate user');
    }
  }

  async deactivateUser(id: number): Promise<BaseApiResponse<UserEntity>> {
    try {
      const user = await this.usersService.findOneForAdmin(id);
      user.isActive = false;
      const updatedUser = await this.userRepository.save(user);
      return {
        success: true,
        message: 'User deactivated successfully',
        data: updatedUser,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to deactivate user');
    }
  }

  async resetUserPassword(id: number, newPassword: string): Promise<BaseApiResponse<{ message: string }>> {
    try {
      const user = await this.usersService.findOneForAdmin(id);

      // Validate new password
      if (!newPassword || newPassword.length < 8) {
        throw new BadRequestException('Password must be at least 8 characters long');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update user password
      await this.userRepository.update(id, { password: hashedPassword });

      return {
        success: true,
        message: 'Password reset successfully',
        data: { message: 'User password has been reset successfully' },
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to reset password');
    }
  }

  async getUserTypes(): Promise<BaseApiResponse<any[]>> {
    try {
      const userTypes = await this.userTypeService.findAll();
      return {
        success: true,
        message: 'User types retrieved successfully',
        data: userTypes,
      };
    } catch (error) {
      throw new BadRequestException('Failed to retrieve user types');
    }
  }
}