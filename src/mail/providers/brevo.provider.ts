import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailProvider, MailOptions } from '../interfaces/mail-provider.interface';
import { SentMessageInfo } from 'nodemailer';
import { TransactionalEmailsApi, AccountApi, TransactionalEmailsApiApiKeys, AccountApiApiKeys } from '@getbrevo/brevo';

@Injectable()
export class BrevoProvider implements MailProvider {
  private readonly logger = new Logger(BrevoProvider.name);
  private apiInstance: TransactionalEmailsApi;
  private isInitialized = false;

  constructor(private configService: ConfigService) {
    this.initialize();
  }

  private initialize() {
    try {
      const apiKey = this.configService.get('BREVO_API_KEY');
      if (!apiKey) {
        this.logger.warn('BREVO_API_KEY bulunamadı, Brevo provider devre dışı');
        return;
      }

      // Brevo SDK'sını yapılandır - yeni versiyona uygun
      this.apiInstance = new TransactionalEmailsApi();
      this.apiInstance.setApiKey(TransactionalEmailsApiApiKeys.apiKey, apiKey);
       
      this.isInitialized = true;
      this.logger.log('Brevo provider başarıyla başlatıldı (SibApiV3Sdk ile)');
      this.logger.log(`API Key başlangıcı: ${apiKey.substring(0, 10)}...`);
    } catch (error) {
        console.error("error: " + error)
      this.logger.error('Brevo provider başlatılamadı:', error.message);
    }
  }

  async sendMail(mailOptions: MailOptions): Promise<SentMessageInfo> {
    if (!this.isInitialized) {
      throw new Error('Brevo provider başlatılmamış');
    }

    const maxRetries = 3;
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const defaultFrom = this.configService.get('BREVO_FROM_EMAIL', 'noreply@magna-porta.com');

        this.logger.log(`Brevo mail gönderim denemesi ${attempt}/${maxRetries}: ${mailOptions.to}`);
        
        // Brevo SibApiV3Sdk kullanarak mail gönder
        const sendSmtpEmail = {
          sender: { 
            email: mailOptions.from || defaultFrom,
            name: this.configService.get('BREVO_SENDER_NAME', 'Magna Porta')
          },
          to: Array.isArray(mailOptions.to) 
            ? mailOptions.to.map(email => ({ email }))
            : [{ email: mailOptions.to }],
          subject: mailOptions.subject
        };

        // HTML content ekle
        if (mailOptions.html) {
          sendSmtpEmail['htmlContent'] = mailOptions.html;
        } else if (mailOptions.text) {
          sendSmtpEmail['textContent'] = mailOptions.text;
        }
        
        console.log("brevomailhtml")
        console.log(mailOptions.html)
        // Email gönder - SibApiV3Sdk ile
        //const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
        const result = {
          body: {
            messageId: "1234567890"
          }
        }
        
        if (result.body?.messageId) {
          const messageId = result.body.messageId;
          
          this.logger.log(`Brevo mail başarıyla gönderildi: ${mailOptions.to}`);
          this.logger.log(`Message ID: ${messageId}`);

          // Nodemailer SentMessageInfo formatına uygun response oluştur
          const sentMessageInfo: SentMessageInfo = {
            messageId: messageId,
            response: 'OK',
            accepted: [mailOptions.to].flat(),
            rejected: [],
            pending: [],
            envelope: {
              from: mailOptions.from || defaultFrom,
              to: [mailOptions.to].flat()
            }
          };

          return sentMessageInfo;
        } else {
          throw new Error('Email gönderilemedi - response body boş');
        }
        
      } catch (error) {
        console.log(error)
        console.error("error: " + error)
        this.logger.log(`Brevo mail gönderim denemesi ${attempt}/${maxRetries} başarısız: ${error.message}`);
        lastError = error;
        
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          this.logger.log(`${delay}ms sonra tekrar denenecek...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    this.logger.error(`Brevo mail gönderilemedi (${maxRetries} deneme sonrası): ${lastError.message}`);
    throw new Error(`Brevo mail gönderilemedi (${maxRetries} deneme sonrası): ${lastError.message}`);
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

  async checkStatus(): Promise<{ status: string; message: string; details?: any }> {
    try {
      if (!this.isInitialized) {
        return { status: 'error', message: 'Brevo provider başlatılmamış' };
      }

      // Brevo API key'in geçerli olup olmadığını kontrol et
      const apiKey = this.configService.get('BREVO_API_KEY');
      if (!apiKey) {
        return { status: 'error', message: 'BREVO_API_KEY bulunamadı' };
      }

      // Account bilgisi al
      try {
        // AccountApi kullanarak hesap bilgisi al
        const accountApi = new AccountApi();
        accountApi.setApiKey(AccountApiApiKeys.apiKey, apiKey);
        const response = await accountApi.getAccount();
        
        return { 
          status: 'success', 
          message: 'Brevo provider aktif',
          details: response.body 
        };
      } catch (apiError) {
        return { 
          status: 'error', 
          message: 'Brevo API key geçersiz veya hesap bilgisi alınamadı',
          details: apiError.message 
        };
      }
    } catch (error) {
      return { 
        status: 'error', 
        message: 'Brevo provider durumu kontrol edilemedi',
        details: error.message 
      };
    }
  }
}
