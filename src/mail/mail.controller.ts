import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { MailService } from './mail.service';
import { SendMailDto, SendTemplateMailDto } from './dto/send-mail.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('mail')
@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Post('send')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mail gönder' })
  @ApiBody({
    type: SendMailDto,
    description: 'Mail gönderme verileri',
    examples: {
      simple: {
        summary: 'Basit Mail',
        value: {
          to: ['user@example.com'],
          subject: 'Test Mail',
          text: 'Bu bir test mailidir.'
        }
      },
      html: {
        summary: 'HTML Mail',
        value: {
          to: ['user@example.com'],
          subject: 'HTML Test',
          html: '<h1>Merhaba!</h1><p>HTML mail</p>'
        }
      },
      withCC: {
        summary: 'CC ile Mail',
        value: {
          to: ['user@example.com'],
          cc: ['manager@example.com'],
          subject: 'Rapor',
          text: 'Rapor ektedir.'
        }
      }
    }
  })
  @ApiResponse({ status: 201, description: 'Mail başarıyla gönderildi' })
  @ApiResponse({ status: 400, description: 'Geçersiz mail verisi' })
  async sendMail(@Body() sendMailDto: SendMailDto) {
    return await this.mailService.sendMail(sendMailDto);
  }

  @Post('send-text')
  //@UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Text mail gönder' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        to: {
          type: 'array',
          items: { type: 'string', format: 'email' },
          description: 'Alıcı email adresleri'
        },
        subject: {
          type: 'string',
          description: 'Mail konusu'
        },
        text: {
          type: 'string',
          description: 'Mail içeriği (text)'
        }
      },
      required: ['to', 'subject', 'text'],
      example: {
        to: ['user@example.com'],
        subject: 'Test Mail',
        text: 'Bu bir test mailidir.'
      }
    }
  })
  @ApiResponse({ status: 201, description: 'Text mail başarıyla gönderildi' })
  async sendTextMail(
    @Body() body: { to: string | string[]; subject: string; text: string }
  ) {
    console.log(body);
    return await this.mailService.sendTextMail(body.to, body.subject, body.text);
  }

  @Post('send-html')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'HTML mail gönder' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        to: {
          type: 'array',
          items: { type: 'string', format: 'email' },
          description: 'Alıcı email adresleri'
        },
        subject: {
          type: 'string',
          description: 'Mail konusu'
        },
        html: {
          type: 'string',
          description: 'Mail içeriği (HTML)'
        }
      },
      required: ['to', 'subject', 'html'],
      example: {
        to: ['user@example.com'],
        subject: 'HTML Test Mail',
        html: '<h1>Merhaba!</h1><p>Bu bir HTML mailidir.</p>'
      }
    }
  })
  @ApiResponse({ status: 201, description: 'HTML mail başarıyla gönderildi' })
  async sendHtmlMail(
    @Body() body: { to: string | string[]; subject: string; html: string }
  ) {
    return await this.mailService.sendHtmlMail(body.to, body.subject, body.html);
  }

  @Post('send-template')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Template mail gönder' })
  @ApiResponse({ status: 201, description: 'Template mail başarıyla gönderildi' })
  async sendTemplateMail(@Body() sendTemplateMailDto: SendTemplateMailDto) {
    return await this.mailService.sendTemplateMail(
      sendTemplateMailDto.to,
      sendTemplateMailDto.subject,
      sendTemplateMailDto.template,
      sendTemplateMailDto.variables
    );
  }

  @Post('send-test')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Test mail gönder' })
  @ApiResponse({ status: 201, description: 'Test mail başarıyla gönderildi' })
  async sendTestMail() {
    return await this.mailService.sendTestMail();
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'SMTP durumunu kontrol et' })
  @ApiResponse({ status: 200, description: 'SMTP durumu başarıyla getirildi' })
  async checkSmtpStatus() {
    return await this.mailService.checkSmtpStatus();
  }
}
