import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { WebhookEventType } from '../../entities/webhook-event-type.entity';
import { BaseApiResponse } from '../../common/dto/api-response-dto';
import { PaginationDto, PaginatedResponseDto } from '../../common/models/pagination-dto';

@ApiTags('Webhook Event Types')
@Controller('webhooks/event-types')
export class WebhookEventTypesController {
  constructor(
    @InjectRepository(WebhookEventType)
    private readonly eventRepo: Repository<WebhookEventType>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all event types' })
  async list(): Promise<BaseApiResponse<WebhookEventType[]>> {
    const data = await this.eventRepo.find();
    return { success: true, message: 'Event types fetched', data };
  }

  @Post()
  @ApiOperation({ summary: 'Create an event type' })
  async create(@Body() body: { eventName: string; description?: string }): Promise<BaseApiResponse<WebhookEventType>> {
    const created = this.eventRepo.create(body);
    const data = await this.eventRepo.save(created);
    return { success: true, message: 'Event type created', data };
  }

  @Get('paginated')
  @ApiOperation({ summary: 'List event types with pagination' })
  async listPaginated(@Query() query: PaginationDto): Promise<BaseApiResponse<PaginatedResponseDto<WebhookEventType>>> {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 10, 100);
    const skip = (page - 1) * limit;
    const orderBy = query.orderBy || 'createdAt';
    const order = (query.order as any) || 'DESC';

    const qb = this.eventRepo.createQueryBuilder('evt')
      .orderBy(`evt.${orderBy}`, order)
      .skip(skip)
      .take(limit);

    const [rows, total] = await qb.getManyAndCount();
    return {
      success: true,
      message: 'Event types fetched',
      data: {
        data: rows,
        meta: {
          totalItems: total,
          itemsPerPage: limit,
          totalPages: Math.ceil(total / limit),
          currentPage: page,
        },
      },
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an event type' })
  async remove(@Param('id') id: number): Promise<BaseApiResponse<null>> {
    await this.eventRepo.delete(Number(id));
    return { success: true, message: 'Event type deleted' } as BaseApiResponse<null>;
  }
}


