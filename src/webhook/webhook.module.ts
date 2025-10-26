import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { WebhookController } from './webhook.controller';
import { WebhookTemplatesController } from './controllers/webhook-templates.controller';
import { WebhookEventTypesController } from './controllers/webhook-event-types.controller';
import { WebhookProcessingRulesController } from './controllers/webhook-processing-rules.controller';
import { WebhookRefsController } from './controllers/webhook-refs.controller';
import { WebhookRefsSeedController } from './controllers/webhook-refs-seed.controller';
import { WebhookService } from './webhook.service';
import { WebhookMailSchedulerService } from './services/webhook-mail-scheduler.service';
import { Webhook } from '../entities/webhook.entity';
import { WebhookEventType } from '../entities/webhook-event-type.entity';
import { WebhookTemplate } from '../entities/webhook-template.entity';
import { WebhookProcessingRule } from '../entities/webhook-processing-rule.entity';
import { WebhookChannel } from '../entities/webhook-channel.entity';
import { WebhookLocale } from '../entities/webhook-locale.entity';
import { MailModule } from '../mail/mail.module';
import { CompaniesModule } from '../company/companies.module';
import { WebhookTemplateService } from './services/webhook-template.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Webhook, WebhookEventType, WebhookTemplate, WebhookProcessingRule, WebhookChannel, WebhookLocale]),
    ScheduleModule.forRoot(),
    MailModule,
    CompaniesModule
  ],
  controllers: [WebhookController, WebhookTemplatesController, WebhookEventTypesController, WebhookProcessingRulesController, WebhookRefsController, WebhookRefsSeedController],
  providers: [WebhookService, WebhookMailSchedulerService, WebhookTemplateService],
  exports: [WebhookService, WebhookMailSchedulerService, WebhookTemplateService],
})
export class WebhookModule {}
