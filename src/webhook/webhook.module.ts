import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { WebhookDataParserService } from './services/webhook-data-parser.service';
import { WebhookMailSchedulerService } from './services/webhook-mail-scheduler.service';
import { Webhook } from '../entities/webhook.entity';
import { MailModule } from '../mail/mail.module';
import { CompaniesModule } from '../company/companies.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Webhook]),
    ScheduleModule.forRoot(),
    MailModule,
    CompaniesModule
  ],
  controllers: [WebhookController],
  providers: [WebhookService, WebhookDataParserService, WebhookMailSchedulerService],
  exports: [WebhookService, WebhookDataParserService, WebhookMailSchedulerService],
})
export class WebhookModule {}
