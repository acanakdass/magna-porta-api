import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { WebhookTemplateService, UpsertTemplateDto } from '../services/webhook-template.service';
import { BaseApiResponse } from '../../common/dto/api-response-dto';
import { WebhookTemplate } from '../../entities/webhook-template.entity';
import { PaginationDto, PaginatedResponseDto } from '../../common/models/pagination-dto';

@ApiTags('Webhook Templates')
@Controller('webhooks/templates')
export class WebhookTemplatesController {
  constructor(private readonly templatesService: WebhookTemplateService) {}

  @Get()
  @ApiOperation({ summary: 'List all templates' })
  async listAll(): Promise<BaseApiResponse<WebhookTemplate[]>> {
    const data = await this.templatesService.listAll();
    return { success: true, message: 'Templates fetched', data };
  }

  @Get('one')
  @ApiOperation({ summary: 'Get one template by event/channel/locale' })
  async getOne(
    @Query('eventName') eventName: string,
    @Query('channel') channel: 'email' | 'web' | 'slack' | 'internal',
    @Query('locale') locale = 'en',
  ): Promise<BaseApiResponse<WebhookTemplate | null>> {
    const data = await this.templatesService.findOne(eventName, channel, locale);
    return { success: true, message: 'Template fetched', data };
  }

  @Get('paginated')
  @ApiOperation({ summary: 'List templates with pagination and filters' })
  async listPaginated(
    @Query() query: PaginationDto & { eventName?: string; channel?: 'email' | 'web' | 'slack' | 'internal'; locale?: string; orderBy?: string; order?: 'ASC' | 'DESC' }
  ): Promise<BaseApiResponse<PaginatedResponseDto<WebhookTemplate>>> {
    const data = await this.templatesService.listPaginated(query);
    return { success: true, message: 'Templates fetched', data };
  }

  @Post('upsert')
  @ApiOperation({ summary: 'Create or update a template' })
  async upsert(@Body() dto: UpsertTemplateDto): Promise<BaseApiResponse<WebhookTemplate>> {
    const data = await this.templatesService.upsertTemplate(dto);
    return { success: true, message: 'Template saved', data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a template by id' })
  async remove(@Param('id') id: number): Promise<BaseApiResponse<null>> {
    await this.templatesService.remove(Number(id));
    return { success: true, message: 'Template deleted' } as BaseApiResponse<null>;
  }

  @Post('seed')
  @ApiOperation({ summary: 'Seed default webhook templates' })
  async seed(): Promise<BaseApiResponse<{ created: number; updated: number }>> {
    const data = await this.templatesService.seedDefaults();
    return { success: true, message: 'Templates seeded', data };
  }
}


