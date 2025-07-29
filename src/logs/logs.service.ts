import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LogEntity } from './log.entity';

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
}