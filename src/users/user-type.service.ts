import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserTypeEntity } from './user-type.entity';

@Injectable()
export class UserTypeService {
  constructor(
    @InjectRepository(UserTypeEntity)
    private readonly userTypeRepository: Repository<UserTypeEntity>,
  ) {}

  async findAll(): Promise<UserTypeEntity[]> {
    return this.userTypeRepository.find({
      where: { isDeleted: false, isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findById(id: number): Promise<UserTypeEntity | null> {
    return this.userTypeRepository.findOne({
      where: { id, isDeleted: false, isActive: true },
    });
  }
}

