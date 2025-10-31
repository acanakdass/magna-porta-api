import { Controller, Post, Get, Body, Param, UseGuards, ParseIntPipe, Query, Put } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { Webhook } from '../entities/webhook.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiParam } from '@nestjs/swagger';
import { BaseApiResponse } from '../common/dto/api-response-dto';
import { PaginationDto, PaginatedResponseDto } from '../common/models/pagination-dto';
import { WebhookMailSchedulerService } from './services/webhook-mail-scheduler.service';
import { WebhookTemplateService } from './services/webhook-template.service';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhookController {
  constructor(
    private readonly webhookService: WebhookService,
    private readonly webhookMailSchedulerService: WebhookMailSchedulerService,
    private readonly webhookTemplateService: WebhookTemplateService,
  ) {}

  @Post('receive')
  @ApiOperation({ summary: 'Webhook endpoint - external services tarafından çağrılır' })
  @ApiResponse({ status: 201, description: 'Webhook başarıyla kaydedildi' })
  @ApiResponse({ status: 400, description: 'Geçersiz veri' })
  async receiveWebhook(@Body() createWebhookDto: CreateWebhookDto): Promise<Webhook> {
    return await this.webhookService.createWebhook(createWebhookDto);
  }

  @Get()
  //@UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tüm webhook\'ları listele (paginated destekli)' })
  @ApiResponse({ status: 200, description: 'Webhook listesi başarıyla getirildi' })
  async findAll(@Query() query: PaginationDto & { webhookName?: string; accountId?: string }): Promise<BaseApiResponse<PaginatedResponseDto<Webhook> | Webhook[]>> {
    if (query.page || query.limit || query.order || query.orderBy || query.webhookName || query.accountId) {
      const data = await this.webhookService.findAllPaginated(query);
      return { success: true, message: 'Webhooks fetched', data };
    }
    const data = await this.webhookService.findAll();
    return { success: true, message: 'Webhooks fetched', data } as BaseApiResponse<Webhook[]>;
  }

  @Get('paginated')
  //@UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Webhook listesi (paginated) with company details' })
  @ApiResponse({ status: 200, description: 'Webhook listesi başarıyla getirildi' })
  async findAllOnlyPaginated(@Query() query: PaginationDto & { webhookName?: string; accountId?: string }): Promise<BaseApiResponse<PaginatedResponseDto<any>>> {
    const data = await this.webhookService.findAllPaginatedWithCompanies(query);
    return { success: true, message: 'Webhooks fetched', data };
  }

  @Get('by-id/:id')
  //@UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ID ile webhook getir' })
  @ApiResponse({ status: 200, description: 'Webhook başarıyla getirildi' })
  @ApiResponse({ status: 404, description: 'Webhook bulunamadı' })
  async findById(@Param('id', ParseIntPipe) id: number): Promise<Webhook> {
    return await this.webhookService.findById(id);
  }

  @Get('webhook-id/:webhookId')
  //@UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Webhook ID ile webhook getir' })
  @ApiResponse({ status: 200, description: 'Webhook başarıyla getirildi' })
  @ApiResponse({ status: 404, description: 'Webhook bulunamadı' })
  async findByWebhookId(@Param('webhookId') webhookId: string): Promise<Webhook> {
    return await this.webhookService.findByWebhookId(webhookId);
  }

  @Get('account/:accountId')
  //@UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Account ID ile webhook\'ları getir' })
  @ApiResponse({ status: 200, description: 'Webhook listesi başarıyla getirildi' })
  async findByAccountId(@Param('accountId') accountId: string): Promise<Webhook[]> {
    return await this.webhookService.findByAccountId(accountId);
  }

  @Get('name/:webhookName')
  //@UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Webhook name ile webhook\'ları getir' })
  @ApiResponse({ status: 200, description: 'Webhook listesi başarıyla getirildi' })
  async findByWebhookName(@Param('webhookName') webhookName: string): Promise<Webhook[]> {
    return await this.webhookService.findByWebhookName(webhookName);
  }

  // ===== PARSED DATA ENDPOINTS =====

  @Get('parsed/all')
  //@UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tüm webhook\'ları parsed data ile birlikte getir' })
  @ApiResponse({ status: 200, description: 'Parsed webhook listesi başarıyla getirildi' })
  async findAllParsed(): Promise<any[]> {
    return await this.webhookService.findParsedWebhooks();
  }

  @Get('parsed/paginated')
  //@UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Parsed webhooks (paginated)' })
  @ApiResponse({ status: 200, description: 'Parsed webhook listesi başarıyla getirildi' })
  async findAllParsedPaginated(@Query() query: PaginationDto & { webhookName?: string; accountId?: string }): Promise<BaseApiResponse<PaginatedResponseDto<any>>> {
    const data = await this.webhookService.findParsedWebhooksPaginated(query);
    return { success: true, message: 'Parsed webhooks fetched', data };
  }

  @Get('parsed/:id')
  //@UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ID ile webhook\'u parsed data ile birlikte getir' })
  @ApiResponse({ status: 200, description: 'Parsed webhook başarıyla getirildi' })
  @ApiResponse({ status: 404, description: 'Webhook bulunamadı' })
  async findParsedById(@Param('id') id: number): Promise<any> {
    return await this.webhookService.findParsedWebhookById(id);
  }

  @Get('parsed/name/:webhookName')
  //@UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Webhook name ile parsed data\'ları getir' })
  @ApiResponse({ status: 200, description: 'Parsed webhook listesi başarıyla getirildi' })
  async findParsedByName(@Param('webhookName') webhookName: string): Promise<any[]> {
    return await this.webhookService.findParsedWebhooksByName(webhookName);
  }

  @Get('parsed/account/:accountId')
  //@UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Account ID ile parsed webhook\'ları getir' })
  @ApiResponse({ status: 200, description: 'Parsed webhook listesi başarıyla getirildi' })
  async findParsedByAccountId(@Param('accountId') accountId: string): Promise<any[]> {
    const webhooks = await this.webhookService.findByAccountId(accountId);
    
    return webhooks.map(webhook => ({
      id: webhook.id,
      accountId: webhook.accountId,
      createdAt: webhook.createdAt,
      webhookId: webhook.webhookId,
      webhookName: webhook.webhookName,
      receivedAt: webhook.receivedAt,
      updatedAt: webhook.updatedAt,
      parsedData: webhook.dataJson // Raw data kullan
    }));
  }

  // ===== MAIL SCHEDULER ENDPOINTS =====

  @Post('trigger-mail-process')
  //@UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Webhook mail işlemini manuel olarak tetikle' })
  @ApiResponse({ status: 200, description: 'Mail işlemi başarıyla tetiklendi' })
  async triggerMailProcess(): Promise<{ message: string }> {
    await this.webhookMailSchedulerService.triggerWebhookMailProcess();
    return { message: 'Webhook mail işlemi tetiklendi' };
  }

  @Get('mail-status')
  //@UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mail gönderilmemiş webhook\'ları listele' })
  @ApiResponse({ status: 200, description: 'Mail durumu başarıyla getirildi' })
  async getMailStatus(): Promise<any[]> {
    const unsentWebhooks = await this.webhookService.findUnsentMailWebhooks();
    
    return unsentWebhooks.map(webhook => ({
      id: webhook.id,
      webhookName: webhook.webhookName,
      accountId: webhook.accountId,
      receivedAt: webhook.receivedAt,
      isMailSent: webhook.isMailSent
    }));
  }

  @Get('preview')
  //@UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Preview a template by templateId and random webhook data' })
  async previewTemplate(@Query('templateId') templateId: number): Promise<BaseApiResponse<{ subject: string; html: string }>> {
    const tpl = await this.webhookTemplateService.findById(Number(templateId));
    if (!tpl) return { success: false, message: 'Template not found' } as any;
    // random webhook by event name
    const candidates = await this.webhookService.findByWebhookName(tpl.eventType.eventName);
    if (!candidates || candidates.length === 0) return { success: false, message: 'No webhook data found for this event type' } as any;
    const random = candidates[Math.floor(Math.random() * candidates.length)];
    const rendered = await this.webhookTemplateService.renderTemplateByEvent(tpl.eventType.eventName, tpl.channel as any, tpl.locale, random.dataJson, random.overriddenSubtext1, random.overriddenSubtext2);
    return { success: true, message: 'Preview generated', data: rendered };
  }

  @Get('template/:templateId/sample-data')
  //@UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get sample webhook data for a template by templateId' })
  @ApiParam({ name: 'templateId', description: 'Template ID to get sample data for' })
  @ApiResponse({ 
    status: 200, 
    description: 'Sample webhook data retrieved successfully',
    type: BaseApiResponse<{ dataJson: string }>
  })
  @ApiResponse({
    status: 404,
    description: 'Template not found or no webhook data available',
    schema: {
      example: {
        success: false,
        data: null,
        message: "Template not found"
      }
    }
  })
  async getTemplateSampleData(
    @Param('templateId', ParseIntPipe) templateId: number
  ): Promise<BaseApiResponse<{ dataJson: string }>> {
    try {
      const template = await this.webhookTemplateService.findById(templateId);
      
      if (!template) {
        return {
          success: false,
          data: null,
          message: 'Template not found',
          loading: false
        };
      }

      // Bu template'in event type'ına ait webhook'ları bul
      const webhooks = await this.webhookService.findByWebhookName(template.eventType.eventName);
      
      if (!webhooks || webhooks.length === 0) {
        return {
          success: false,
          data: null,
          message: `No webhook data found for event type: ${template.eventType.eventName}`,
          loading: false
        };
      }

      // İlk webhook'u örnek olarak al
      const sampleWebhook = webhooks[0];

      return {
        success: true,
        data: {
          dataJson: JSON.stringify(sampleWebhook.dataJson)
        },
        message: 'Sample webhook data retrieved successfully',
        loading: false
      };

    } catch (error) {
      console.error('Error in getTemplateSampleData:', error);
      return {
        success: false,
        data: null,
        message: `Failed to get sample data: ${error.message}`,
        loading: false
      };
    }
  }

  @Post(':id/send-email')
  //@UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send webhook as email using its template' })
  @ApiBody({ schema: { properties: { to: { oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }] }, locale: { type: 'string', default: 'en' } } } })
  async sendEmail(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { to: string | string[]; locale?: string },
  ): Promise<BaseApiResponse<{ subject: string; html: string; recipients: string[] }>> {
    const data = await this.webhookService.sendWebhookEmail(id, body.to, body.locale || 'en');
    return { success: true, message: 'Email sent', data };
  }

  @Post(':id/send-email-to-company')
  //@UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send webhook as email to company users automatically' })
  @ApiResponse({ 
    status: 200, 
    description: 'Webhook email sent to company users successfully',
    type: BaseApiResponse<{ subject: string; html: string; recipients: string[] }>
  })
  @ApiResponse({
    status: 404,
    description: 'Webhook or company not found',
    schema: {
      example: {
        success: false,
        data: null,
        message: "Webhook not found"
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'No active users found for company',
    schema: {
      example: {
        success: false,
        data: null,
        message: "No active users found for this company"
      }
    }
  })
  @ApiParam({ name: 'id', description: 'Webhook ID' })
  async sendEmailToCompany(
    @Param('id', ParseIntPipe) id: number
  ): Promise<BaseApiResponse<{ subject: string; html: string; recipients: string[] }>> {
    return await this.webhookService.sendWebhookEmailById(id);
  }

  @Get(':id/preview-email')
  //@UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Preview webhook email HTML without sending' })
  @ApiResponse({ 
    status: 200, 
    description: 'Webhook email preview generated successfully',
    type: BaseApiResponse<{ subject: string; html: string; company: any; recipients: string[] }>
  })
  @ApiResponse({
    status: 404,
    description: 'Webhook or company not found',
    schema: {
      example: {
        success: false,
        data: null,
        message: "Webhook not found"
      }
    }
  })
  @ApiParam({ name: 'id', description: 'Webhook ID' })
  async previewEmail(
    @Param('id', ParseIntPipe) id: number
  ): Promise<BaseApiResponse<{ subject: string; html: string; company: any; recipients: string[] }>> {
    return await this.webhookService.previewWebhookEmail(id);
  }

  @Put(':id/overrides')
  //@UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update webhook subtext overrides' })
  @ApiBody({ 
    schema: { 
      properties: { 
        overriddenSubtext1: { type: 'string', nullable: true },
        overriddenSubtext2: { type: 'string', nullable: true }
      } 
    } 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Webhook overrides updated successfully',
    type: BaseApiResponse<Webhook>
  })
  @ApiResponse({
    status: 404,
    description: 'Webhook not found',
    schema: {
      example: {
        success: false,
        data: null,
        message: "Webhook not found"
      }
    }
  })
  @ApiParam({ name: 'id', description: 'Webhook ID' })
  async updateOverrides(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { overriddenSubtext1?: string; overriddenSubtext2?: string }
  ): Promise<BaseApiResponse<Webhook>> {
    return await this.webhookService.updateWebhookOverrides(id, body.overriddenSubtext1, body.overriddenSubtext2);
  }
}
