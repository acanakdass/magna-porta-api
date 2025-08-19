import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';
import { ConfigModule } from '@nestjs/config';
import { SmtpProvider } from './providers/smtp.provider';
import { SendGridProvider } from './providers/sendgrid.provider';
import { BrevoProvider } from './providers/brevo.provider';
import { EmailTemplatesService } from './email-templates.service';

@Module({
  imports: [ConfigModule],
  controllers: [MailController],
  providers: [MailService, EmailTemplatesService, SmtpProvider, SendGridProvider, BrevoProvider],
  exports: [MailService, EmailTemplatesService],
})
export class MailModule {}
