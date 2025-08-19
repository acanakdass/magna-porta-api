import { Controller, Post, Get, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiQuery } from '@nestjs/swagger';
import { MailService, MailProviderType } from './mail.service';
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
  @ApiQuery({ 
    name: 'provider', 
    required: false, 
    enum: Object.values(MailProviderType),
    description: 'Mail provider türü (smtp, sendgrid, brevo, auto)'
  })
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
  async sendMail(
    @Body() sendMailDto: SendMailDto,
    @Query('provider') provider?: MailProviderType
  ) {
    return await this.mailService.sendMail(sendMailDto, provider);
  }

  @Post('send-text')
  //@UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Text mail gönder' })
  @ApiQuery({ 
    name: 'provider', 
    required: false, 
    enum: Object.values(MailProviderType),
    description: 'Mail provider türü (smtp, sendgrid, brevo, auto)'
  })
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
    @Body() body: { to: string | string[]; subject: string; text: string },
    @Query('provider') provider?: MailProviderType
  ) {
    console.log(body);
    return await this.mailService.sendTextMail(body.to, body.subject, body.text, provider);
  }

  @Post('send-html')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'HTML mail gönder' })
  @ApiQuery({ 
    name: 'provider', 
    required: false, 
    enum: Object.values(MailProviderType),
    description: 'Mail provider türü (smtp, sendgrid, brevo, auto)'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        to: {
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
    @Body() body: { to: string | string[]; subject: string; html: string },
    @Query('provider') provider?: MailProviderType
  ) {
    return await this.mailService.sendHtmlMail(body.to, body.subject, body.html, provider);
  }

  @Post('send-template')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Template mail gönder' })
  @ApiQuery({ 
    name: 'provider', 
    required: false, 
    enum: Object.values(MailProviderType),
    description: 'Mail provider türü (smtp, sendgrid, brevo, auto)'
  })
  @ApiBody({
    type: SendTemplateMailDto,
    description: 'Template mail gönderme verileri'
  })
  @ApiResponse({ status: 201, description: 'Template mail başarıyla gönderildi' })
  async sendTemplateMail(
    @Body() sendTemplateMailDto: SendTemplateMailDto,
    @Query('provider') provider?: MailProviderType
  ) {
    return await this.mailService.sendTemplateMail(
      sendTemplateMailDto.to,
      sendTemplateMailDto.subject,
      sendTemplateMailDto.template,
      sendTemplateMailDto.variables,
      provider
    );
  }

  @Post('send-transfer-notification')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Transfer bildirim maili gönder' })
  @ApiQuery({ 
    name: 'provider', 
    required: false, 
    enum: Object.values(MailProviderType),
    description: 'Mail provider türü (smtp, sendgrid, brevo, auto)'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        to: {
          type: 'array',
          items: { type: 'string', format: 'email' },
          description: 'Alıcı email adresleri'
        },
        transferData: {
          type: 'object',
          properties: {
            recipientName: { type: 'string', description: 'Alıcı adı' },
            transferAmount: { type: 'string', description: 'Transfer tutarı' },
            currency: { type: 'string', description: 'Para birimi' },
            transferDate: { type: 'string', description: 'Transfer tarihi' },
            transferMethod: { type: 'string', description: 'Transfer yöntemi' },
            transferId: { type: 'string', description: 'Transfer ID' },
            reference: { type: 'string', description: 'Referans' },
            iban: { type: 'string', description: 'IBAN' },
            businessDays: { type: 'string', description: 'İş günü sayısı' }
          },
          required: ['recipientName', 'transferAmount', 'currency', 'transferDate', 'transferMethod', 'transferId', 'reference', 'iban', 'businessDays']
        }
      },
      required: ['to', 'transferData'],
      example: {
        to: ['customer@example.com'],
        transferData: {
          recipientName: 'Hotelizy OU',
          transferAmount: '5.00',
          currency: 'EUR',
          transferDate: '2025-08-07',
          transferMethod: 'SEPA',
          transferId: 'P250807-9AJ4YP9',
          reference: 'INV-3671',
          iban: '8382 - SXPYDEHH',
          businessDays: '0-2'
        }
      }
    }
  })
  @ApiResponse({ status: 201, description: 'Transfer bildirim maili başarıyla gönderildi' })
  async sendTransferNotification(
    @Body() body: { 
      to: string | string[]; 
      transferData: {
        recipientName: string;
        transferAmount: string;
        currency: string;
        transferDate: string;
        transferMethod: string;
        transferId: string;
        reference: string;
        iban: string;
        businessDays: string;
      }
    },
    @Query('provider') provider?: MailProviderType
  ) {
    return await this.mailService.sendTransferNotification(
      body.to,
      body.transferData,
      provider
    );
  }

  @Post('send-welcome-email')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Hoş geldin maili gönder' })
  @ApiQuery({ 
    name: 'provider', 
    required: false, 
    enum: Object.values(MailProviderType),
    description: 'Mail provider türü (smtp, sendgrid, brevo, auto)'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        to: {
          type: 'array',
          items: { type: 'string', format: 'email' },
          description: 'Alıcı email adresleri'
        },
        welcomeData: {
          type: 'object',
          properties: {
            userName: { type: 'string', description: 'Kullanıcı adı' },
            companyName: { type: 'string', description: 'Şirket adı (opsiyonel)' }
          },
          required: ['userName']
        }
      },
      required: ['to', 'welcomeData'],
      example: {
        to: ['newuser@example.com'],
        welcomeData: {
          userName: 'John Doe',
          companyName: 'Hotelizy OU'
        }
      }
    }
  })
  @ApiResponse({ status: 201, description: 'Hoş geldin maili başarıyla gönderildi' })
  async sendWelcomeEmail(
    @Body() body: { 
      to: string | string[]; 
      welcomeData: {
        userName: string;
        companyName?: string;
      }
    },
    @Query('provider') provider?: MailProviderType
  ) {
    return await this.mailService.sendWelcomeEmail(
      body.to,
      body.welcomeData,
      provider
    );
  }

  @Post('send-password-reset')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Şifre sıfırlama maili gönder' })
  @ApiQuery({ 
    name: 'provider', 
    required: false, 
    enum: Object.values(MailProviderType),
    description: 'Mail provider türü (smtp, sendgrid, brevo, auto)'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        to: {
          type: 'array',
          items: { type: 'string', format: 'email' },
          description: 'Alıcı email adresleri'
        },
        resetData: {
          type: 'object',
          properties: {
            userName: { type: 'string', description: 'Kullanıcı adı' },
            resetLink: { type: 'string', description: 'Şifre sıfırlama linki' },
            expiryTime: { type: 'string', description: 'Link geçerlilik süresi' }
          },
          required: ['userName', 'resetLink', 'expiryTime']
        }
      },
      required: ['to', 'resetData'],
      example: {
        to: ['user@example.com'],
        resetData: {
          userName: 'John Doe',
          resetLink: 'https://app.magnaporta.com/reset-password?token=abc123',
          expiryTime: '24 hours'
        }
      }
    }
  })
  @ApiResponse({ status: 201, description: 'Şifre sıfırlama maili başarıyla gönderildi' })
  async sendPasswordResetEmail(
    @Body() body: { 
      to: string | string[]; 
      resetData: {
        userName: string;
        resetLink: string;
        expiryTime: string;
      }
    },
    @Query('provider') provider?: MailProviderType
  ) {
    return await this.mailService.sendPasswordResetEmail(
      body.to,
      body.resetData,
      provider
    );
  }

  @Post('send-test')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Test mail gönder' })
  @ApiQuery({ 
    name: 'provider', 
    required: false, 
    enum: Object.values(MailProviderType),
    description: 'Mail provider türü (smtp, sendgrid, brevo, auto)'
  })
  @ApiResponse({ status: 201, description: 'Test mail başarıyla gönderildi' })
  async sendTestMail(@Query('provider') provider?: MailProviderType) {
    return await this.mailService.sendTestMail(provider);
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mail provider durumlarını kontrol et' })
  @ApiQuery({ 
    name: 'provider', 
    required: false, 
    enum: Object.values(MailProviderType),
    description: 'Belirli bir provider\'ın durumunu kontrol et'
  })
  @ApiResponse({ status: 200, description: 'Provider durumları başarıyla getirildi' })
  async checkProviderStatus(@Query('provider') provider?: MailProviderType) {
    return await this.mailService.checkProviderStatus(provider);
  }

  @Get('providers')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mevcut mail provider\'ları listele' })
  @ApiResponse({ status: 200, description: 'Provider listesi başarıyla getirildi' })
  async getAvailableProviders() {
    return {
      available: this.mailService.getAvailableProviders(),
      default: this.mailService.getDefaultProvider()
    };
  }

  @Post('set-default-provider')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Default mail provider\'ı ayarla' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        provider: {
          type: 'string',
          enum: Object.values(MailProviderType),
          description: 'Yeni default provider'
        }
      },
      required: ['provider'],
      example: {
        provider: 'sendgrid'
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Default provider başarıyla ayarlandı' })
  async setDefaultProvider(@Body() body: { provider: MailProviderType }) {
    await this.mailService.setDefaultProvider(body.provider);
    return { message: `Default provider ${body.provider} olarak ayarlandı` };
  }
}
