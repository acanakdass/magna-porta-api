import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { Webhook } from '../entities/webhook.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

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
  @ApiOperation({ summary: 'Tüm webhook\'ları listele' })
  @ApiResponse({ status: 200, description: 'Webhook listesi başarıyla getirildi' })
  async findAll(): Promise<Webhook[]> {
    return await this.webhookService.findAll();
  }

  @Get(':id')
  //@UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ID ile webhook getir' })
  @ApiResponse({ status: 200, description: 'Webhook başarıyla getirildi' })
  @ApiResponse({ status: 404, description: 'Webhook bulunamadı' })
  async findById(@Param('id') id: number): Promise<Webhook> {
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
      parsedData: this.webhookService['webhookDataParserService'].parseWebhookData(
        webhook.webhookName,
        webhook.dataJson
      )
    }));
  }
}
