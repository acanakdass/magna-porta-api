import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LogEntity } from './log.entity';
import { PaginationDto, PaginatedResponseDto } from '../common/models/pagination-dto';

@Injectable()
export class LogsService {
  constructor(
      @InjectRepository(LogEntity)
      private readonly logsRepository: Repository<LogEntity>,
  ) {}

  /**
   * Creates a log entry in the database
   * @param log Partial log data
   */
  async createLog(log: Partial<LogEntity>): Promise<LogEntity> {
    const newLog = this.logsRepository.create(log);
    return this.logsRepository.save(newLog);
  }

  /**
   * Retrieve all logs with optional filtering
   * @param filters Custom filters for retrieving logs
   */
  async findAll(filters: Partial<LogEntity> = {}): Promise<LogEntity[]> {
    return this.logsRepository.find({ where: filters });
  }

  /**
   * Retrieve logs with pagination
   * @param paginationDto Pagination parameters
   */
  async findAllWithPagination(paginationDto: PaginationDto): Promise<PaginatedResponseDto<LogEntity>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.logsRepository.findAndCount({
      skip,
      take: limit,
      order: { [sortBy]: sortOrder },
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}