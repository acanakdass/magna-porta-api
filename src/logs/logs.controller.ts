import { Controller, Post, Body, Get, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LogsService } from './logs.service';
import { CreateLogDto } from './dtos/create-log.dto';
import { LogEntity } from './log.entity';
import { BaseApiResponse } from '../common/dto/api-response-dto';
import { PaginationDto, PaginatedResponseDto } from '../common/models/pagination-dto';

@ApiTags('Logs')
@Controller('logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Post('external')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Create log from external source',
    description: 'Allows external services to create log entries in the system'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Log created successfully',
    type: BaseApiResponse<{ id: number }>
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid log data provided'
  })
  async createExternalLog(@Body() createLogDto: CreateLogDto): Promise<BaseApiResponse<{ id: number }>> {
    try {
      const log = await this.logsService.createLog(createLogDto);
      return {
        success: true,
        message: 'Log created successfully',
        data: { id: log.id }
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to create log: ${error.message}`,
        data: null
      };
    }
  }

  @Get()
  @ApiOperation({ 
    summary: 'Get all logs',
    description: 'Retrieve all logs with optional filtering'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Logs retrieved successfully',
    type: BaseApiResponse<LogEntity[]>
  })
  async getAllLogs(@Query() filters: Partial<LogEntity>): Promise<BaseApiResponse<LogEntity[]>> {
    try {
      const logs = await this.logsService.findAll(filters);
      return {
        success: true,
        message: 'Logs retrieved successfully',
        data: logs
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to retrieve logs: ${error.message}`,
        data: null
      };
    }
  }

  @Get('paginated')
  @ApiOperation({ 
    summary: 'Get paginated logs',
    description: 'Retrieve logs with pagination support'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Paginated logs retrieved successfully',
    type: BaseApiResponse<PaginatedResponseDto<LogEntity>>
  })
  async getPaginatedLogs(@Query() paginationDto: PaginationDto): Promise<BaseApiResponse<PaginatedResponseDto<LogEntity>>> {
    try {
      const result = await this.logsService.findAllWithPagination(paginationDto);
      return {
        success: true,
        message: 'Paginated logs retrieved successfully',
        data: result
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to retrieve paginated logs: ${error.message}`,
        data: null
      };
    }
  }
}
