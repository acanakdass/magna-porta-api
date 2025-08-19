import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { SentMessageInfo } from 'nodemailer';

export interface MailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private async initializeTransporter() {
    try {    
      const smtpConfig = {
        host: this.configService.get('SMTP_HOST', 'smtp.gmail.com'),
        port: this.configService.get('SMTP_PORT', 587),
        secure: this.configService.get('SMTP_SECURE', false), // true for 465, false for other ports
        auth: {
          user: this.configService.get('SMTP_USER'),
          pass: this.configService.get('SMTP_PASS'),
        },
        // Gmail için özel ayarlar
        service: this.configService.get('SMTP_SERVICE', 'gmail'),
        // Connection timeout ayarları
        connectionTimeout: 60000, // 60 saniye
        greetingTimeout: 30000,   // 30 saniye
        socketTimeout: 60000,     // 60 saniye
        // Connection pool ayarları
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        // Rate limiting
        rateLimit: 14, // Gmail için saniyede max 14 mail
        rateDelta: 1000, // 1 saniye
      };

      this.transporter = nodemailer.createTransport(smtpConfig);

      await this.transporter.verify();
      this.logger.log('SMTP bağlantısı başarıyla kuruldu');
    } catch (error) {
      this.logger.error('SMTP bağlantısı kurulamadı:', error.message);
      // Fallback olarak test account oluştur
      this.createTestAccount();
    }
  }

  private async createTestAccount() {
    try {
      
      const testAccount = await nodemailer.createTestAccount();
      
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
        // Connection timeout ayarları
        connectionTimeout: 60000,
        greetingTimeout: 30000,
        socketTimeout: 60000,
      });

      this.logger.log('Test SMTP hesabı oluşturuldu (Ethereal Email)');
      this.logger.log(`Test kullanıcı: ${testAccount.user}`);
      this.logger.log(`Test şifre: ${testAccount.pass}`);
    } catch (error) {
      this.logger.error('Test SMTP hesabı oluşturulamadı:', error.message);
    }
  }


  async sendMail(mailOptions: MailOptions): Promise<SentMessageInfo> {
    const maxRetries = 3;
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const defaultFrom = this.configService.get('MAIL_FROM', 'noreply@magna-porta.com');
        
        const mailConfig = {
          from: mailOptions.from || defaultFrom,
          to: mailOptions.to,
          subject: mailOptions.subject,
          text: mailOptions.text,
          html: mailOptions.html,
          cc: mailOptions.cc,
          bcc: mailOptions.bcc,
          attachments: mailOptions.attachments,
        };
        console.log("mailConfig");
        console.log(mailConfig);

        this.logger.log(`Mail gönderim denemesi ${attempt}/${maxRetries}: ${mailOptions.to}`);
        const result = await this.transporter.sendMail(mailConfig);
        
        this.logger.log(`Mail başarıyla gönderildi: ${mailOptions.to}`);
        
        // Ethereal Email kullanılıyorsa preview URL'ini logla
        if (result.messageId && result.previewURL) {
          this.logger.log(`Mail preview: ${result.previewURL}`);
        }
        
        return result;
      } catch (error) {
        console.log("catch blockk")
        lastError = error;
        this.logger.log(`Mail gönderim denemesi ${attempt}/${maxRetries} başarısız: ${error.message}`);
        
        if (attempt < maxRetries) {
          // Bir sonraki denemeden önce bekle
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
          this.logger.log(`${delay}ms sonra tekrar denenecek...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    this.logger.error(`Mail gönderilemedi (${maxRetries} deneme sonrası): ${lastError.message}`);
    throw new Error(`Mail gönderilemedi (${maxRetries} deneme sonrası): ${lastError.message}`);
  }

  
  async sendTextMail(to: string | string[], subject: string, text: string): Promise<SentMessageInfo> {
    return this.sendMail({ to, subject, text });
  }

  
  async sendHtmlMail(to: string | string[], subject: string, html: string): Promise<SentMessageInfo> {
    return this.sendMail({ to, subject, html });
  }

  
  async sendTemplateMail(
    to: string | string[],
    subject: string,
    template: string,
    variables: Record<string, any>
  ): Promise<SentMessageInfo> {
    let html = template;
    
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, variables[key]);
    });

    return this.sendMail({ to, subject, html });
  }


  async sendTestMail(): Promise<SentMessageInfo> {
    const testHtml = `
      <h1>Test Mail</h1>
      <p>Bu bir test mailidir.</p>
      <p>Gönderim zamanı: ${new Date().toLocaleString('tr-TR')}</p>
      <hr>
      <p><small>Magna Porta API - Test Mail</small></p>
    `;

    return this.sendHtmlMail(
      this.configService.get('TEST_MAIL_TO', 'test@example.com'),
      'Test Mail - Magna Porta API',
      testHtml
    );
  }


  async checkSmtpStatus(): Promise<{ status: string; message: string; details?: any }> {
    try {
      if (!this.transporter) {
        return { status: 'error', message: 'SMTP transporter başlatılmamış' };
      }

      await this.transporter.verify();
      return { status: 'success', message: 'SMTP bağlantısı aktif' };
    } catch (error) {
      return { 
        status: 'error', 
        message: 'SMTP bağlantısı başarısız',
        details: error.message 
      };
    }
  }
}
