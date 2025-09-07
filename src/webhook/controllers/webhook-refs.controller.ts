import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { WebhookChannel } from '../../entities/webhook-channel.entity';
import { WebhookLocale } from '../../entities/webhook-locale.entity';
import { BaseApiResponse } from '../../common/dto/api-response-dto';

@ApiTags('Webhook Refs')
@Controller('webhooks/refs')
export class WebhookRefsController {
  constructor(
    @InjectRepository(WebhookChannel) private readonly channelRepo: Repository<WebhookChannel>,
    @InjectRepository(WebhookLocale) private readonly localeRepo: Repository<WebhookLocale>,
  ) {}

  @Get('channels')
  @ApiOperation({ summary: 'List available channels' })
  async channels(): Promise<BaseApiResponse<WebhookChannel[]>> {
    const data = await this.channelRepo.find({ order: { createdAt: 'ASC' } as any });
    return { success: true, message: 'Channels fetched', data };
  }

  @Get('locales')
  @ApiOperation({ summary: 'List available locales' })
  async locales(): Promise<BaseApiResponse<WebhookLocale[]>> {
    const data = await this.localeRepo.find({ order: { createdAt: 'ASC' } as any });
    return { success: true, message: 'Locales fetched', data };
  }
}


