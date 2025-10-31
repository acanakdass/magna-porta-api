import {BadRequestException, ConflictException, Injectable, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {FindManyOptions, FindOneOptions, FindOptionsWhere, Repository} from 'typeorm';
import * as bcrypt from 'bcrypt';
import {CreateUserDto} from "./dtos/create-user-dto";
import {PaginatedResponseDto, PaginationDto} from 'src/common/models/pagination-dto';
import {UpdateUserDto} from "./dtos/update-user-dto";
import {UserEntity} from './user.entity';
import {BaseService} from "../common/services/base.service";
import {ValidationHelper} from "../common/helpers/validation.helpers";

@Injectable()
export class UsersService extends BaseService<UserEntity> {
    constructor(
        @InjectRepository(UserEntity)
        private readonly userRepository: Repository<UserEntity>,
    ) {
        super(userRepository);
    }


    async listUsersPaginated(paginationDto: PaginationDto & { userTypeId?: number }): Promise<PaginatedResponseDto<UserEntity>> {
        const where: any = { isDeleted: false };
        
        if (paginationDto.userTypeId) {
            where.userTypeId = paginationDto.userTypeId;
        }

        return await this.findAllWithPagination({
            ...paginationDto,
            select: ['id', 'firstName', 'lastName', 'email', 'phoneNumber', 'isActive', 'isVerified', 'createdAt'],
            relations: ['role', 'company', 'userType'],
            where,
        });
    }

    async listUsersByUserType(userTypeId: number, paginationDto: PaginationDto): Promise<PaginatedResponseDto<UserEntity>> {
        return await this.findAllWithPagination({
            ...paginationDto,
            select: ['id', 'firstName', 'lastName', 'email', 'phoneNumber', 'isActive', 'isVerified', 'createdAt'],
            relations: ['role','company', 'userType'],
            where: { isDeleted: false, userTypeId },
        });
    }


    async createUser(createUserDto: CreateUserDto): Promise<UserEntity> {
        // const existingUser = await this.findByEmail(createUserDto.email);
        // if (existingUser) {
        //     throw new ConflictException('Email already exists');
        // }
        // const existingUserWithPhone = await this.userRepository.findOne({where: {phoneNumber: createUserDto.phoneNumber}});
        // if (existingUserWithPhone) {
        //     throw new ConflictException('Phone Number already exists');
        // }
        //
        const duplicateCheckFields: any = {
            email: createUserDto.email,
        };
        
        if (createUserDto.phoneNumber && createUserDto.phoneNumber.trim()) {
            duplicateCheckFields.phoneNumber = createUserDto.phoneNumber;
        }
        
        await ValidationHelper.checkDuplicates(this.userRepository, duplicateCheckFields);

        const userEntity = Object.assign(new UserEntity(), createUserDto);
        userEntity.isVerified = false;
        console.log(userEntity)
        userEntity.password = await bcrypt.hash(userEntity.password, 10);
        return super.create(userEntity);
    }

    async findOne(id: number): Promise<UserEntity> {
        const user = await this.userRepository.findOne({
            where: {id, isActive: true},
        });

        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        return user;
    }

    async findOneForAdmin(id: number): Promise<UserEntity> {
        const user = await this.userRepository.findOne({
            where: {id, isDeleted: false},
        });

        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        return user;
    }

    async findByEmail(email: string): Promise<UserEntity | null> {
        return this.userRepository.findOne({
            where: {email, isActive: true},
        });
    }

    async findBy(where: FindOptionsWhere<UserEntity>, relations?: string[]): Promise<UserEntity[]> {
        const options: FindManyOptions<UserEntity> = {where};
        if (relations) {
            options.relations = relations;
        }
        return this.userRepository.find(options);
    }

    async findOneDynamic(where: FindOptionsWhere<UserEntity>, relations?: string[]): Promise<UserEntity> {
        const options: FindOneOptions<UserEntity> = {where};
        console.log(where)
        console.log("------")
        console.log(relations)
        if (relations) {
            options.relations = relations;
        }
        return this.userRepository.findOne(options);
    }

    async updateUser(id: number, updateUserDto: UpdateUserDto): Promise<UserEntity> {
        const user = await this.findOne(id);

        // If password update is requested
        if (updateUserDto.password) {
            // If current password verification is required
            if (updateUserDto.currentPassword) {
                const isPasswordValid = await bcrypt.compare(
                    updateUserDto.currentPassword,
                    user.password,
                );

                if (!isPasswordValid) {
                    throw new BadRequestException('Current password is incorrect');
                }
            }

            updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
        }

        if (updateUserDto.email && updateUserDto.email !== user.email) {
            const existingUser = await this.findByEmail(updateUserDto.email);
            if (existingUser) {
                throw new ConflictException('Email already exists');
            }
        }

        if (updateUserDto.phoneNumber && updateUserDto.phoneNumber !== user.phoneNumber) {
            const existingUserWithPhone = await this.userRepository.findOne({
                where: { phoneNumber: updateUserDto.phoneNumber, isDeleted: false }
            });
            if (existingUserWithPhone && existingUserWithPhone.id !== user.id) {
                throw new ConflictException('Phone number already exists');
            }
        }

        Object.assign(user, updateUserDto);
        return this.userRepository.save(user);
    }

    async remove(id: number): Promise<void> {
        const user = await this.findOne(id);
        await this.userRepository.remove(user);
    }

    async softRemove(id: number): Promise<UserEntity> {
        const user = await this.findOne(id);
        user.isActive = false;
        return this.userRepository.save(user);
    }

    async softRemoveForAdmin(id: number): Promise<UserEntity> {
        const user = await this.findOneForAdmin(id);
        user.isDeleted = true;
        user.isActive = false;
        return this.userRepository.save(user);
    }

    async count(where: FindOptionsWhere<UserEntity> = {}): Promise<number> {
        return this.userRepository.count({where});
    }

    async exists(where: FindOptionsWhere<UserEntity>): Promise<boolean> {
        const count = await this.userRepository.count({where});
        return count > 0;
    }

    async changePassword(id: number, currentPassword: string, newPassword: string): Promise<UserEntity> {
        const user = await this.findOne(id);

        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            throw new BadRequestException('Current password is incorrect');
        }

        user.password = await bcrypt.hash(newPassword, 10);
        return this.userRepository.save(user);
    }

    async activate(id: number): Promise<UserEntity> {
        const user = await this.userRepository.findOne({
            where: {id},
        });

        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        user.isActive = true;
        return this.userRepository.save(user);
    }

    async deactivate(id: number): Promise<UserEntity> {
        const user = await this.findOne(id);
        user.isActive = false;
        return this.userRepository.save(user);
    }

    async getUsersWithRolesAndPermissions() {
        return this.userRepository.find({
            relations: ['role', 'role.permissions'],
        });
    }

}
