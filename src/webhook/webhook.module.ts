import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { WebhookController } from './webhook.controller';
import { WebhookTemplatesController } from './controllers/webhook-templates.controller';
import { WebhookEventTypesController } from './controllers/webhook-event-types.controller';
import { WebhookProcessingRulesController } from './controllers/webhook-processing-rules.controller';
import { WebhookService } from './webhook.service';
import { WebhookDataParserService } from './services/webhook-data-parser.service';
import { WebhookMailSchedulerService } from './services/webhook-mail-scheduler.service';
import { Webhook } from '../entities/webhook.entity';
import { WebhookEventType } from '../entities/webhook-event-type.entity';
import { WebhookTemplate } from '../entities/webhook-template.entity';
import { WebhookProcessingRule } from '../entities/webhook-processing-rule.entity';
import { MailModule } from '../mail/mail.module';
import { CompaniesModule } from '../company/companies.module';
import { WebhookTemplateService } from './services/webhook-template.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Webhook, WebhookEventType, WebhookTemplate, WebhookProcessingRule]),
    ScheduleModule.forRoot(),
    MailModule,
    CompaniesModule
  ],
  controllers: [WebhookController, WebhookTemplatesController, WebhookEventTypesController, WebhookProcessingRulesController],
  providers: [WebhookService, WebhookDataParserService, WebhookMailSchedulerService, WebhookTemplateService],
  exports: [WebhookService, WebhookDataParserService, WebhookMailSchedulerService, WebhookTemplateService],
})
export class WebhookModule {}
