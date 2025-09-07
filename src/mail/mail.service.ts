import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SentMessageInfo } from 'nodemailer';
import { MailProvider, MailOptions } from './interfaces/mail-provider.interface';
import { SmtpProvider } from './providers/smtp.provider';
import { SendGridProvider } from './providers/sendgrid.provider';
import { BrevoProvider } from './providers/brevo.provider';
import { EmailTemplatesService, TransferNotificationData, WelcomeEmailData, PasswordResetData, ForgotPasswordData } from './email-templates.service';

export enum MailProviderType {
  SMTP = 'smtp',
  SENDGRID = 'sendgrid',
  BREVO = 'brevo',
  AUTO = 'auto'
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private providers: Map<MailProviderType, MailProvider> = new Map();
  private defaultProvider: MailProviderType = MailProviderType.AUTO;

  constructor(
    private configService: ConfigService,
    private smtpProvider: SmtpProvider,
    private sendGridProvider: SendGridProvider,
    private brevoProvider: BrevoProvider,
    private emailTemplatesService: EmailTemplatesService
  ) {
    this.initializeProviders();
  }

  private initializeProviders() {
    // SMTP provider'ı her zaman ekle
    this.providers.set(MailProviderType.SMTP, this.smtpProvider);
    
    // SendGrid provider'ı varsa ekle
    if (this.configService.get('SENDGRID_API_KEY')) {
      this.providers.set(MailProviderType.SENDGRID, this.sendGridProvider);
    }

    // Brevo provider'ı varsa ekle
    if (this.configService.get('BREVO_API_KEY')) {
      this.providers.set(MailProviderType.BREVO, this.brevoProvider);
    }

    // Default provider'ı belirle - Brevo'ya öncelik ver
    const configuredProvider = this.configService.get('MAIL_PROVIDER', 'brevo');
    if (configuredProvider === 'brevo' && this.providers.has(MailProviderType.BREVO)) {
      this.defaultProvider = MailProviderType.BREVO;
    } else if (configuredProvider === 'sendgrid' && this.providers.has(MailProviderType.SENDGRID)) {
      this.defaultProvider = MailProviderType.SENDGRID;
    } else if (configuredProvider === 'smtp') {
      this.defaultProvider = MailProviderType.SMTP;
    } else {
      // Brevo varsa onu kullan, yoksa AUTO
      this.defaultProvider = this.providers.has(MailProviderType.BREVO) 
        ? MailProviderType.BREVO 
        : MailProviderType.AUTO;
    }

    this.logger.log(`Mail servisi başlatıldı. Default provider: ${this.defaultProvider}`);
    this.logger.log(`Aktif provider'lar: ${Array.from(this.providers.keys()).join(', ')}`);
  }

  private async selectProvider(): Promise<MailProvider> {
    if (this.defaultProvider === MailProviderType.AUTO) {
      // Brevo varsa öncelik ver, sonra SendGrid, sonra SMTP
      if (this.providers.has(MailProviderType.BREVO)) {
        const brevoStatus = await this.brevoProvider.checkStatus();
        if (brevoStatus.status === 'success') {
          return this.brevoProvider;
        }
      }
      
      if (this.providers.has(MailProviderType.SENDGRID)) {
        const sendGridStatus = await this.sendGridProvider.checkStatus();
        if (sendGridStatus.status === 'success') {
          return this.sendGridProvider;
        }
      }
      
      return this.smtpProvider;
    }

    const selectedProvider = this.providers.get(this.defaultProvider);
    if (!selectedProvider) {
      this.logger.warn(`Seçilen provider (${this.defaultProvider}) bulunamadı, SMTP kullanılıyor`);
      return this.smtpProvider;
    }

    return selectedProvider;
  }

  async sendMail(mailOptions: MailOptions, providerType?: MailProviderType): Promise<SentMessageInfo> {
    let provider: MailProvider;

    if (providerType && this.providers.has(providerType)) {
      provider = this.providers.get(providerType)!;
      this.logger.log(`Belirtilen provider kullanılıyor: ${providerType}`);
    } else {
      provider = await this.selectProvider();
      this.logger.log(`Otomatik seçilen provider: ${provider.constructor.name}`);
    }

    try {
      console.log('mailOptionsHtml', mailOptions.html);
      return await provider.sendMail(mailOptions);
    } catch (error) {
      this.logger.error(`Mail gönderimi başarısız: ${error.message}`);
      
      // Eğer Brevo başarısız olursa SendGrid'e, o da başarısız olursa SMTP'ye fallback yap
      if (provider instanceof BrevoProvider) {
        if (this.providers.has(MailProviderType.SENDGRID)) {
          this.logger.log('Brevo başarısız, SendGrid provider\'a geçiliyor...');
          try {
            return await this.sendGridProvider.sendMail(mailOptions);
          } catch (sendGridError) {
            this.logger.log('SendGrid de başarısız, SMTP provider\'a geçiliyor...');
            return await this.smtpProvider.sendMail(mailOptions);
          }
        } else if (this.providers.has(MailProviderType.SMTP)) {
          this.logger.log('Brevo başarısız, SMTP provider\'a geçiliyor...');
          return await this.smtpProvider.sendMail(mailOptions);
        }
      } else if (provider instanceof SendGridProvider && this.providers.has(MailProviderType.SMTP)) {
        this.logger.log('SendGrid başarısız, SMTP provider\'a geçiliyor...');
        return await this.smtpProvider.sendMail(mailOptions);
      }
      
      throw error;
    }
  }

  async sendTextMail(to: string | string[], subject: string, text: string, providerType?: MailProviderType): Promise<SentMessageInfo> {
    return this.sendMail({ to, subject, text }, providerType);
  }

  async sendHtmlMail(to: string | string[], subject: string, html: string, providerType?: MailProviderType): Promise<SentMessageInfo> {
    return this.sendMail({ to, subject, html }, providerType);
  }

  async sendTemplateMail(
    to: string | string[],
    subject: string,
    template: string,
    variables: Record<string, any>,
    providerType?: MailProviderType
  ): Promise<SentMessageInfo> {
    return this.sendMail({ to, subject, html: template, ...variables }, providerType);
  }

  async sendTestMail(providerType?: MailProviderType): Promise<SentMessageInfo> {
    const testHtml = `
      <h1>Test Mail</h1>
      <p>Bu bir test mailidir.</p>
      <p>Gönderim zamanı: ${new Date().toLocaleString('tr-TR')}</p>
      <p>Provider: ${providerType || 'auto'}</p>
      <hr>
      <p><small>Magna Porta API - Test Mail</small></p>
    `;

    return this.sendHtmlMail(
      this.configService.get('TEST_MAIL_TO', 'test@example.com'),
      'Test Mail - Magna Porta API',
      testHtml,
      providerType
    );
  }

  /**
   * Welcome email gönder
   */
  async sendWelcomeEmail(
    to: string | string[],
    welcomeData: WelcomeEmailData,
    providerType?: MailProviderType
  ): Promise<SentMessageInfo> {
    const html = this.emailTemplatesService.createWelcomeEmailTemplate(welcomeData);
    
    return this.sendMail({
      to,
      subject: 'Welcome to Magna Porta!',
      html
    }, providerType);
  }

  /**
   * Password reset email gönder
   */
  async sendPasswordResetEmail(
    to: string | string[],
    resetData: PasswordResetData,
    providerType?: MailProviderType
  ): Promise<SentMessageInfo> {
    const html = this.emailTemplatesService.createPasswordResetTemplate(resetData);
    
    return this.sendMail({
      to,
      subject: 'Password Reset Request - Magna Porta',
      html
    }, providerType);
  }

  /**
   * Şifre unutma maili gönder
   */
  async sendForgotPasswordEmail(
    toEmail: string,
    subject: string,
    passcode: string,
    providerType?: MailProviderType
  ): Promise<SentMessageInfo> {
    const html = this.emailTemplatesService.createForgotPasswordTemplate({ passcode });
    
    return this.sendMail({
      to: toEmail,
      subject: subject,
      html
    }, providerType);
  }

  async sendTransferNotification(
    to: string | string[],
    transferData: TransferNotificationData,
    providerType?: MailProviderType
  ): Promise<SentMessageInfo> {
    let provider: MailProvider;

    if (providerType && this.providers.has(providerType)) {
      provider = this.providers.get(providerType)!;
      this.logger.log(`Belirtilen provider kullanılıyor: ${providerType}`);
    } else {
      provider = await this.selectProvider();
      this.logger.log(`Otomatik seçilen provider: ${provider.constructor.name}`);
    }

    try {
      // SendGrid provider'da yeni şablon varsa onu kullan
      if (provider instanceof SendGridProvider && 'sendTransactionalEmail' in provider) {
        return await (provider as any).sendTransactionalEmail(to, transferData);
      }
      
      // Güzel HTML template kullan
      const html = this.emailTemplatesService.createTransferNotificationTemplate(transferData);
      
      return await provider.sendMail({ 
        to, 
        subject: `Transfer to ${transferData.recipientName} is on its way`,
        html 
      });
      
    } catch (error) {
      this.logger.error(`Transfer mail gönderimi başarısız: ${error.message}`);
      throw error;
    }
  }

  async checkProviderStatus(providerType?: MailProviderType): Promise<{ [key: string]: { status: string; message: string; details?: any } }> {
    const status: { [key: string]: { status: string; message: string; details?: any } } = {};

    if (providerType) {
      const provider = this.providers.get(providerType);
      if (provider) {
        status[providerType] = await provider.checkStatus();
      }
    } else {
      // Tüm provider'ların durumunu kontrol et
      for (const [type, provider] of this.providers.entries()) {
        status[type] = await provider.checkStatus();
      }
    }

    return status;
  }

  async setDefaultProvider(providerType: MailProviderType): Promise<void> {
    if (this.providers.has(providerType)) {
      this.defaultProvider = providerType;
      this.logger.log(`Default provider ${providerType} olarak ayarlandı`);
    } else {
      throw new Error(`Provider ${providerType} bulunamadı`);
    }
  }

  getAvailableProviders(): MailProviderType[] {
    return Array.from(this.providers.keys());
  }

  getDefaultProvider(): MailProviderType {
    return this.defaultProvider;
  }
}
