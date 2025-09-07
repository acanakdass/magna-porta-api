import { Controller, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { WebhookChannel } from '../../entities/webhook-channel.entity';
import { WebhookLocale } from '../../entities/webhook-locale.entity';
import { BaseApiResponse } from '../../common/dto/api-response-dto';

@ApiTags('Webhook Refs')
@Controller('webhooks/refs')
export class WebhookRefsSeedController {
  constructor(
    @InjectRepository(WebhookChannel) private readonly channelRepo: Repository<WebhookChannel>,
    @InjectRepository(WebhookLocale) private readonly localeRepo: Repository<WebhookLocale>,
  ) {}

  @Post('seed')
  @ApiOperation({ summary: 'Seed default channels (email, sms) and locales (en, tr)' })
  async seed(): Promise<BaseApiResponse<{ channels: number; locales: number }>> {
    const channels = [
      { key: 'email', name: 'Email', isActive: true },
      { key: 'sms', name: 'SMS', isActive: true },
    ];
    const locales = [
      { code: 'en', name: 'English', isActive: true },
      { code: 'tr', name: 'Türkçe', isActive: true },
    ];

    let channelUpserts = 0;
    for (const ch of channels) {
      const existing = await this.channelRepo.findOne({ where: { key: ch.key } });
      if (!existing) {
        await this.channelRepo.save(this.channelRepo.create(ch));
        channelUpserts++;
      }
    }

    let localeUpserts = 0;
    for (const lc of locales) {
      const existing = await this.localeRepo.findOne({ where: { code: lc.code } });
      if (!existing) {
        await this.localeRepo.save(this.localeRepo.create(lc));
        localeUpserts++;
      }
    }

    return { success: true, message: 'Refs seeded', data: { channels: channelUpserts, locales: localeUpserts } };
  }
}


