import { Body, Controller, Delete, Get, Param, Post, Patch, Query, ParseIntPipe, Res } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiParam } from '@nestjs/swagger';
import { Response } from 'express';
import { WebhookTemplateService } from '../services/webhook-template.service';
import { BaseApiResponse } from '../../common/dto/api-response-dto';
import { WebhookTemplate } from '../../entities/webhook-template.entity';
import { PaginationDto, PaginatedResponseDto } from '../../common/models/pagination-dto';
import { UpsertTemplateDto, UpdateTemplateDto, RenderTemplateBodyDto } from '../dto/upsert-template.dto';

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

  @Post()
  @ApiOperation({ summary: 'Create template (fails if exists with same event/channel/locale)' })
  async create(@Body() dto: UpsertTemplateDto): Promise<BaseApiResponse<WebhookTemplate>> {
    const data = await this.templatesService.createTemplate(dto);
    return { success: true, message: 'Template created', data };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update template by id (checks conflict for event/channel/locale)' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTemplateDto): Promise<BaseApiResponse<WebhookTemplate>> {
    const data = await this.templatesService.updateTemplate(id, dto);
    return { success: true, message: 'Template updated', data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a template by id' })
  @ApiParam({ name: 'id', description: 'Template ID to delete', type: 'number' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<BaseApiResponse<null>> {
    await this.templatesService.remove(id);
    return { success: true, message: 'Template deleted', loading: false } as BaseApiResponse<null>;
  }

  @Post('seed')
  @ApiOperation({ summary: 'Seed default webhook templates' })
  async seed(): Promise<BaseApiResponse<{ created: number; updated: number }>> {
    const data = await this.templatesService.seedDefaults();
    return { success: true, message: 'Templates seeded', data };
  }

  @Get(':id/render')
  @ApiOperation({ summary: 'Render template HTML by id (GET - use only for quick checks)' })
  async renderGet(@Param('id', ParseIntPipe) id: number, @Query('data') data?: string): Promise<BaseApiResponse<{ subject: string; html: string }>> {
    let payload: any = {};
    if (data) {
      try { payload = JSON.parse(data); } catch { payload = {}; }
    }
    const rendered = await this.templatesService.renderTemplateById(id, payload);
    return { success: true, message: 'Template rendered', data: rendered };
  }

  @Post(':id/render')
  @ApiOperation({ summary: 'Render template HTML by id (POST body with JSON data)' })
  async renderPost(@Param('id', ParseIntPipe) id: number, @Body() body: RenderTemplateBodyDto): Promise<BaseApiResponse<{ subject: string; html: string }>> {
    const payload = body?.data ?? {};
    const rendered = await this.templatesService.renderTemplateById(id, payload);
    return { success: true, message: 'Template rendered', data: rendered };
  }

  @Get(':id/preview')
  @ApiOperation({ summary: 'Preview template as text/html (GET with optional data query)' })
  async previewGet(
    @Param('id', ParseIntPipe) id: number,
    @Query('data') data: string | undefined,
    @Res() res: Response,
  ) {
    let payload: any = {};
    if (data) { try { payload = JSON.parse(data); } catch { payload = {}; } }
    const { html } = await this.templatesService.renderTemplateById(id, payload);
    res.type('text/html').send(html);
  }

  @Post(':id/preview')
  @ApiOperation({ summary: 'Preview template as text/html (POST body with JSON data)' })
  async previewPost(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: RenderTemplateBodyDto,
    @Res() res: Response,
  ) {
    const payload = body?.data ?? {};
    const { html } = await this.templatesService.renderTemplateById(id, payload);
    res.type('text/html').send(html);
  }

  @Post('preview/by-event')
  @ApiOperation({ summary: 'Preview template by event/channel/locale with raw webhook JSON (POST)' })
  async previewByEvent(
    @Body() body: { eventName: string; channel?: 'email'|'web'|'slack'|'internal'; locale?: string; data: any },
    @Res() res: Response,
  ) {
    const { eventName, channel = 'email', locale = 'en', data = {} } = body || {} as any;
    const { html } = await this.templatesService.renderTemplateByEvent(eventName, channel, locale, data);
    res.type('text/html').send(html);
  }
}


