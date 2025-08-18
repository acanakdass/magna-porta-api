import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { WebhookDataParserService } from './services/webhook-data-parser.service';
import { Webhook } from '../entities/webhook.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Webhook])],
  controllers: [WebhookController],
  providers: [WebhookService, WebhookDataParserService],
  exports: [WebhookService, WebhookDataParserService],
})
export class WebhookModule {}
