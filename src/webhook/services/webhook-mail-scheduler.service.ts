import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { WebhookService } from '../webhook.service';
import { MailService } from '../../mail/mail.service';
import { WebhookTemplateService } from './webhook-template.service';
import { CompaniesService } from '../../company/companies.service';
import { EmailTemplatesService, TransferNotificationData } from '../../mail/email-templates.service';
import { ConversionSettledEmailData } from '../models/conversion-settled.model';
import { AccountActiveHookData, AccountActiveEmailData } from '../models/account-active.model';
import { GlobalAccountActiveEmailData } from '../models/global-account-active.model';

@Injectable()
export class WebhookMailSchedulerService {
  private readonly logger = new Logger(WebhookMailSchedulerService.name);
  private readonly ADMIN_EMAIL = 'acanakdas@gmail.com';
  private readonly LOGO_URL: string;

  constructor(
    private readonly webhookService: WebhookService,
    private readonly mailService: MailService,
    private readonly companiesService: CompaniesService,
    private readonly configService: ConfigService,
    private readonly emailTemplatesService: EmailTemplatesService,
    private readonly webhookTemplateService: WebhookTemplateService,
  ) {
    // Logo URL'ini environment'dan al, fallback olarak production URL
    this.LOGO_URL = this.configService.get('LOGO_URL', 'http://209.38.223.41:3001/assets/magnaporta-logos/logo_magna_porta.png');
  }

  /**
   * Her dakika çalışır ve mail gönderilmemiş webhook'ları kontrol eder
   */
  @Cron(CronExpression.EVERY_30_SECONDS)
  async processUnsentWebhooks() {
    try {
      // Otomatik mail gönderimi kontrolü
      const isAutoMailEnabled = this.isAutoMailEnabled();
      if (!isAutoMailEnabled) {
        this.logger.debug('Otomatik mail gönderimi devre dışı (IS_AUTO_MAIL_SENT=false)');
        return;
      }

      this.logger.log('Webhook mail kontrolü başlatıldı...');
      
      // Mail gönderilmemiş webhook'ları getir
      const unsentWebhooks = await this.webhookService.findUnsentMailWebhooks();
      
      if (unsentWebhooks.length === 0) {
        this.logger.log('Mail gönderilecek webhook bulunamadı');
        return;
      }

      this.logger.log(`${unsentWebhooks.length} adet webhook için mail gönderilecek`);

      // Her webhook için mail gönder
      for (const webhook of unsentWebhooks) {
        await this.sendWebhookNotification(webhook);
      }

      this.logger.log('Webhook mail işlemi tamamlandı');
    } catch (error) {
      this.logger.error('Webhook mail işlemi sırasında hata:', error.message);
    }
  }

  /**
   * Otomatik mail gönderiminin aktif olup olmadığını kontrol eder
   */
  private isAutoMailEnabled(): boolean {
    const enabled = process.env.IS_AUTO_MAIL_SENT;
    if (!enabled) return false;
    return enabled.toLowerCase() === 'true' || enabled === '1' || enabled.toLowerCase() === 'yes' || enabled.toLowerCase() === 'on';
  }

  /**
   * Webhook bildirimi gönderir
   */
  private async sendWebhookNotification(webhook: any): Promise<void> {
    try {
      // Önce template'i kontrol et - isActive ve autoSendMail kontrolü
      const template = await this.webhookTemplateService.findOne(webhook.webhookName, 'email', 'en');
      if (!template) {
        this.logger.log(`Webhook ${webhook.webhookName} için template bulunamadı, mail gönderilmeyecek`);
        await this.webhookService.markMailAsSent(webhook.id);
        return;
      }
      
      if (!template.isActive) {
        this.logger.log(`Webhook ${webhook.webhookName} için template isActive=false, mail gönderilmeyecek`);
        await this.webhookService.markMailAsSent(webhook.id);
        return;
      }
      
      if (!template.autoSendMail) {
        this.logger.log(`Webhook ${webhook.webhookName} için autoSendMail=false, mail gönderilmeyecek`);
        await this.webhookService.markMailAsSent(webhook.id);
        return;
      }
      
      this.logger.log(`Webhook ${webhook.webhookName} için template aktif ve otomatik mail açık, mail gönderilecek`);

      // Account ID ile company bul
      const company = await this.companiesService.findByAirwallexAccountId(webhook.accountId);
      if (company) {
        this.logger.log(`Company bulundu: ${company.name} (ID: ${company.id})`);
        this.logger.log(`Company users count: ${company.users?.length || 0}`);
        if (company.users && company.users.length > 0) {
          this.logger.log(`Users: ${company.users.map(u => `${u.email} (${u.isActive ? 'active' : 'inactive'})`).join(', ')}`);
        }
      }
      
      // Template'den dinamik subject al
      const subject = await this.getWebhookSubjectFromTemplate(webhook.webhookName, webhook.dataJson);
      let htmlContent: string;
      let templateSubject = subject; // Default olarak fallback subject
      
      try {
        const rendered = await this.webhookTemplateService.renderTemplateByEvent(
          webhook.webhookName,
          'email',
          'en',
          webhook.dataJson,
          webhook.overriddenSubtext1,
          webhook.overriddenSubtext2,
        );
        templateSubject = rendered.subject || subject;
        htmlContent = rendered.html;
      } catch {
        htmlContent = await this.generateWebhookEmailContent(webhook, company);
      }
      
      if (!company) {
        this.logger.warn(`Company bulunamadı: ${webhook.accountId}`);
        // Company bulunamadıysa admin'e fallback mail gönder
        const fallbackSubject = `[FALLBACK] ${templateSubject} - Company Bulunamadı`;
        const fallbackContent = this.generateFallbackEmailContent(webhook, 'company_not_found', null);
        
        await this.mailService.sendHtmlMail(
          this.ADMIN_EMAIL,
          fallbackSubject,
          fallbackContent
        );
        await this.webhookService.markMailAsSent(webhook.id);
        return;
      }

      // Company'e atanmış user'ları bul
      const companyUsers = company.users || [];
      const usersWithEmail = companyUsers.filter(user => user.email && user.isActive);

      if (usersWithEmail.length === 0) {
        this.logger.warn(`Company ${company.name} için aktif user bulunamadı`);
        // User bulunamadıysa admin'e fallback mail gönder
        const fallbackSubject = `[FALLBACK] ${templateSubject} - Users Bulunamadı`;
        const fallbackContent = this.generateFallbackEmailContent(webhook, 'users_not_found', company);
        
        await this.mailService.sendHtmlMail(
          this.ADMIN_EMAIL,
          fallbackSubject,
          fallbackContent
        );
        await this.webhookService.markMailAsSent(webhook.id);
        return;
      }

      // Her user'a mail gönder
      const emailAddresses = usersWithEmail.map(user => user.email);
      
      await this.mailService.sendHtmlMail(emailAddresses, templateSubject, htmlContent);

      // Webhook'u mail gönderildi olarak işaretle
      await this.webhookService.markMailAsSent(webhook.id);
      
      this.logger.log(`Webhook ${webhook.id} için ${emailAddresses.length} adet user'a mail gönderildi: ${emailAddresses.join(', ')}`);

      // Admin'e bilgilendirme maili gönder
      await this.sendAdminNotification(webhook, company, usersWithEmail, emailAddresses);
    } catch (error) {
      this.logger.error(`Webhook ${webhook.id} için mail gönderilemedi:`, error.message);
    }
  }

  /**
   * Webhook template'inden dinamik olarak subject alır
   */
  private async getWebhookSubjectFromTemplate(webhookName: string, data: any = {}): Promise<string> {
    try {
      const rendered = await this.webhookTemplateService.renderTemplateByEvent(
        webhookName,
        'email',
        'en',
        data
      );
      return rendered.subject || `Webhook Notification: ${webhookName}`;
    } catch (error) {
      this.logger.warn(`Template bulunamadı veya render edilemedi: ${webhookName}, fallback subject kullanılıyor`);
      return `Webhook Notification: ${webhookName}`;
    }
  }

  /**
   * Webhook email içeriği oluşturur
   */
  private async generateWebhookEmailContent(webhook: any, company?: any): Promise<string> {
    // Webhook name'e göre özelleştirilmiş içerik
    const customContent = await this.generateCustomWebhookContent(webhook);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Magna Porta Notification</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 50px 20px; text-align: center; color: white; border-radius: 0 0 20px 20px;">
              <img src="${this.LOGO_URL}" 
                   alt="Magna Porta" 
                   style="max-width: 200px; height: auto; margin-bottom: 0; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));">
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px 30px; background-color: #ffffff;">
              ${await this.generateMinimalWebhookContent(webhook)}
              
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 20px 0;">
                <tr>
                  <td style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; border-left: 4px solid #2196f3;">
                    <p style="margin: 0 0 15px 0; line-height: 1.6;"><strong>Transaction Time:</strong> ${new Date(webhook.receivedAt).toLocaleString('en-US')}</p>
                    <p style="margin: 0 0 15px 0; line-height: 1.6;"><strong>Reference No:</strong> ${webhook.webhookId}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; color: #6c757d; font-size: 14px;">
              <p style="margin: 0 0 15px 0; line-height: 1.6;">This is an automated notification from Magna Porta</p>
              <p style="margin: 0 0 15px 0; line-height: 1.6;">Please do not reply to this email</p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  /**
   * Admin'e bilgilendirme maili gönderir
   */
  private async sendAdminNotification(webhook: any, company: any, users: any[], emailAddresses: string[]): Promise<void> {
    try {
      const subject = `[BİLGİLENDİRME] Webhook ${webhook.webhookName} - ${emailAddresses.length} User'a Mail Gönderildi`;
      
      const htmlContent = await this.generateAdminNotificationContent(webhook, company, users, emailAddresses);
      
      await this.mailService.sendHtmlMail(
        this.ADMIN_EMAIL,
        subject,
        htmlContent
      );
      
      this.logger.log(`Admin bilgilendirme maili gönderildi: ${emailAddresses.length} user'a mail gönderildi`);
    } catch (error) {
      this.logger.error('Admin bilgilendirme maili gönderilemedi:', error.message);
    }
  }

  /**
   * Fallback email içeriği oluşturur
   */
  private generateFallbackEmailContent(webhook: any, reason: string, company?: any): string {
    const receivedTime = new Date(webhook.receivedAt).toLocaleString('tr-TR');
    const companyInfo = company ? `
          <div style="margin: 10px 0;">
            <span style="font-weight: bold; color: #495057;">Company:</span>
            <span style="color: #212529;">${company.name}</span>
          </div>
          <div style="margin: 10px 0;">
            <span style="font-weight: bold; color: #495057;">Company ID:</span>
            <span style="color: #212529;">${company.id}</span>
          </div>
    ` : '';
    
    const reasonText = reason === 'company_not_found' 
      ? 'Account ID ile company bulunamadı'
      : 'Company bulundu ama aktif users bulunamadı';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Fallback Webhook Bildirimi</title>
      </head>
      <body style="font-family: Arial, sans-serif; margin: 20px;">
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; border: 1px solid #ffeaa7;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="${this.LOGO_URL}" 
                 alt="Magna Porta" 
                 style="max-width: 200px; height: auto; border-radius: 8px;">
          </div>
          <h2 style="margin: 0 0 15px 0;">⚠️ Fallback Webhook Notification</h2>
          <p style="margin: 0;">This email has been sent to admin as fallback</p>
        </div>
        
        <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; border: 1px solid #f5c6cb; margin: 15px 0;">
          <h3 style="margin: 0 0 15px 0;">🚨 Mail Asıl Alıcıya Gönderilemedi!</h3>
          <p style="margin: 0 0 10px 0;"><strong>Sebep:</strong> ${reasonText}</p>
          <p style="margin: 0;"><strong>Account ID:</strong> ${webhook.accountId}</p>
        </div>
        
        <div style="margin: 20px 0;">
          <div style="margin: 10px 0;">
            <span style="font-weight: bold; color: #495057;">Webhook ID:</span>
            <span style="color: #212529;">${webhook.webhookId}</span>
          </div>
          
          <div style="margin: 10px 0;">
            <span style="font-weight: bold; color: #495057;">Webhook Name:</span>
            <span style="color: #212529;">${webhook.webhookName}</span>
          </div>
          
          <div style="margin: 10px 0;">
            <span style="font-weight: bold; color: #495057;">Account ID:</span>
            <span style="color: #212529;">${webhook.accountId}</span>
          </div>
          
          ${companyInfo}
          
          <div style="margin: 10px 0;">
            <span style="font-weight: bold; color: #495057;">Alınma Zamanı:</span>
            <span style="color: #212529;">${receivedTime}</span>
          </div>
          
          <div style="margin: 10px 0;">
            <span style="font-weight: bold; color: #495057;">Oluşturulma Zamanı:</span>
            <span style="color: #212529;">${new Date(webhook.createdAt).toLocaleString('tr-TR')}</span>
          </div>
        </div>
        
        <div style="background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h3 style="margin: 0 0 15px 0;">📊 Webhook Data</h3>
          <pre style="background-color: #f8f9fa; padding: 10px; border-radius: 3px; overflow-x: auto; margin: 0;">${JSON.stringify(webhook.dataJson, null, 2)}</pre>
        </div>
        
        <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 12px;">
          <p style="margin: 0 0 10px 0;">Bu mail fallback olarak admin'e gönderilmiştir.</p>
          <p style="margin: 0 0 10px 0;">Asıl alıcıya gönderilememe sebebi: ${reasonText}</p>
          <p style="margin: 0;">Magna Porta API - Webhook Notification Service</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Webhook name'e göre özelleştirilmiş içerik oluşturur
   */
  private async generateCustomWebhookContent(webhook: any): Promise<string> {
    try {
      // Template sistemini kullan
      const rendered = await this.webhookTemplateService.renderTemplateByEvent(
        webhook.webhookName,
        'email',
        'en',
        webhook.dataJson,
        webhook.overriddenSubtext1,
        webhook.overriddenSubtext2
      );
      return rendered.html;
    } catch (error) {
      this.logger.warn(`Template bulunamadı veya render edilemedi: ${webhook.webhookName}, fallback content kullanılıyor`);
      return this.generateDefaultContent(webhook.webhookName);
    }
  }

  /**
   * Payout transfer funding funded webhook content
   */
  private generatePayoutTransferContent(data: any): string {
    const amount = data.amount_beneficiary_receives || 0;
    const currency = data.transfer_currency || 'USD';
    const sourceAmount = data.source_amount || 0;
    const sourceCurrency = data.source_currency || 'USD';
    const beneficiaryName = data.beneficiary?.bank_details?.account_name || 'Unknown';
    const payerName = data.payer?.company_name || 'Unknown';
    const status = data.status || 'Unknown';
    const transferDate = data.transfer_date || 'Unknown';
    
    return `
      <div class="custom-content">
        <h3>💰 Payout Transfer Completed</h3>
        <p><strong>Transfer Status:</strong> ${status}</p>
        <p><strong>Transfer Date:</strong> ${transferDate}</p>
        
        <div style="background-color: #f0f8ff; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h4>📤 Sender Information</h4>
          <p><strong>Company:</strong> ${payerName}</p>
          <p><strong>Amount Sent:</strong> ${sourceAmount} ${sourceCurrency}</p>
        </div>
        
        <div style="background-color: #f0fff0; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h4>📥 Recipient Information</h4>
          <p><strong>Recipient Name:</strong> ${beneficiaryName}</p>
          <p><strong>Amount Received:</strong> ${amount} ${currency}</p>
          <p><strong>Bank:</strong> ${data.beneficiary?.bank_details?.bank_name || 'Unknown'}</p>
          <p><strong>IBAN:</strong> ${data.beneficiary?.bank_details?.iban || 'Unknown'}</p>
        </div>
        
      </div>
    `;
  }

  /**
   * Connected account transfer webhook content
   */
  private generateConnectedAccountTransferContent(data: any): string {
    const amount = data.amount || 0;
    const currency = data.currency || 'USD';
    const status = data.status || 'Unknown';
    const reason = data.reason || 'Unknown';
    const reference = data.reference || 'Unknown';
    
    return `
      <div class="custom-content">
        <h3>🔄 Connected Account Transfer</h3>
        <p><strong>Transfer Status:</strong> ${status}</p>
        <p><strong>Transfer Amount:</strong> ${amount} ${currency}</p>
        <p><strong>Reference:</strong> ${reference}</p>
        <p><strong>Reason:</strong> ${reason}</p>
      </div>
    `;
  }

  /**
   * Conversion webhook content
   */
  private generateConversionContent(data: any): string {
    const sourceAmount = data.source_amount || 0;
    const sourceCurrency = data.source_currency || 'USD';
    const targetAmount = data.target_amount || 0;
    const targetCurrency = data.target_currency || 'USD';
    const rate = data.rate || 0;
    const status = data.status || 'Unknown';
    
    return `
      <div class="custom-content">
        <h3>💱 Currency Conversion</h3>
        <p><strong>Conversion Status:</strong> ${status}</p>
        <p><strong>Source Amount:</strong> ${sourceAmount} ${sourceCurrency}</p>
        <p><strong>Target Amount:</strong> ${targetAmount} ${targetCurrency}</p>
        <p><strong>Exchange Rate:</strong> 1 ${sourceCurrency} = ${rate} ${targetCurrency}</p>
      </div>
    `;
  }

  /**
   * Transfer webhook content
   */
  private generateTransferContent(data: any): string {
    const amount = data.amount || 0;
    const currency = data.currency || 'USD';
    const status = data.status || 'Unknown';
    const sourceAccount = data.source_account || 'Unknown';
    const destinationAccount = data.destination_account || 'Unknown';
    
    return `
      <div class="custom-content">
        <h3>📤 General Transfer</h3>
        <p><strong>Transfer Status:</strong> ${status}</p>
        <p><strong>Transfer Amount:</strong> ${amount} ${currency}</p>
        <p><strong>Source Account:</strong> ${sourceAccount}</p>
        <p><strong>Destination Account:</strong> ${destinationAccount}</p>
      </div>
    `;
  }

  /**
   * Default webhook content
   */
  private generateDefaultContent(webhookName: string): string {
    return `
      <div class="custom-content">
        <h3>📢 Webhook Notification</h3>
        <p><strong>Webhook Type:</strong> ${webhookName}</p>
        <p>Custom content for this webhook type has not been defined yet.</p>
      </div>
    `;
  }

  /**
   * Account active webhook content
   */
  private generateAccountActiveContent(data: any): string {
    const accountData = data as AccountActiveHookData;
    
    // Company name'i primary contact'tan al
    const companyName = accountData.data?.primary_contact?.first_name && accountData.data?.primary_contact?.last_name
      ? `${accountData.data.primary_contact.first_name} ${accountData.data.primary_contact.last_name}`
      : 'Your Company';
    
    // Account type'ı legal entity type'dan al
    const accountType = accountData.data?.account_details?.legal_entity_type === 'INDIVIDUAL' 
      ? 'Individual Account' 
      : 'Business Account';
    
    // Account location'ı address'ten al
    const accountLocation = accountData.data?.account_details?.individual_details?.address?.country_code || 'Unknown';
    
    // Account status
    const accountStatus = accountData.data?.status || 'Unknown';
    
    // Airwallex account name
    const airwallexAccount = companyName;
    
    // Activation date
    const activationDate = new Date(accountData.data?.created_at || Date.now()).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    return `
      <div class="custom-content">
        <h3>🎉 Account Activated Successfully!</h3>
        <p><strong>Account Status:</strong> ${accountStatus}</p>
        <p><strong>Activation Date:</strong> ${activationDate}</p>
        
        <div style="background-color: #f0f8ff; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h4>🏢 Account Information</h4>
          <p><strong>Company/Individual:</strong> ${companyName}</p>
          <p><strong>Account Type:</strong> ${accountType}</p>
          <p><strong>Account Location:</strong> ${accountLocation}</p>
          <p><strong>Airwallex Account:</strong> ${airwallexAccount}</p>
        </div>
        
        
        
        <div style="background-color: #fff8f0; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h4>💳 Account Usage</h4>
          <p><strong>Expected Monthly Volume:</strong> ${accountData.data?.account_usage?.expected_monthly_transaction_volume?.amount || '0'} USD</p>
          <p><strong>Collection Countries:</strong> ${accountData.data?.account_usage?.collection_country_codes?.join(', ') || 'None'}</p>
          <p><strong>Payout Countries:</strong> ${accountData.data?.account_usage?.payout_country_codes?.join(', ') || 'None'}</p>
        </div>
      </div>
    `;
  }

  /**
   * Global account active webhook content
   */
  private generateGlobalAccountActiveContent(data: any): string {

    const accountData = data;
    
    // Company name'i account name'den al
    const companyName = accountData.account_name || 'Your Company';
    
    // Account type
    const accountType = accountData.account_type || 'Unknown';
    
    // Account location'ı country code'dan al
    const accountLocation = accountData.country_code || 'Unknown';
    
    // Account status
    const accountStatus = accountData.status || 'Unknown';
    
    // Airwallex account ID
    const airwallexAccount = accountData.id || 'Unknown';
    
    // IBAN
    const iban = accountData.iban || 'Unknown';
    
    // Bank name
    const bankName = accountData.institution?.name || 'Unknown';
    
    // Account currency
    const accountCurrency = accountData.required_features?.[0]?.currency || 'Unknown';
    
    // Activation date
    const activationDate = new Date(accountData.created_at || Date.now()).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Account number
    const accountNumber = accountData.account_number || 'Unknown';
    
    // SWIFT code
    const swiftCode = accountData.swift_code || 'Unknown';
    
    // Nick name
    const nickName = accountData.nick_name || 'Unknown';
  
    return `
      <div class="custom-content">
        <h3>🏦 Global Account Activated Successfully!</h3>
        <p><strong>Account Status:</strong> ${accountStatus}</p>
        <p><strong>Activation Date:</strong> ${activationDate}</p>
        
        <div style="background-color: #f0f8ff; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h4>🏢 Account Information</h4>
          <p><strong>Company Name:</strong> ${companyName}</p>
          <p><strong>Account Type:</strong> ${accountType}</p>
          <p><strong>Account Location:</strong> ${accountLocation}</p>
          <p><strong>Airwallex Account ID:</strong> ${airwallexAccount}</p>
        </div>
        
        <div style="background-color: #f0fff0; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h4>🏦 Banking Details</h4>
          <p><strong>IBAN:</strong> ${iban}</p>
          <p><strong>Bank Name:</strong> ${bankName}</p>
          <p><strong>Account Number:</strong> ${accountNumber}</p>
          <p><strong>SWIFT Code:</strong> ${swiftCode}</p>
          <p><strong>Nick Name:</strong> ${nickName}</p>
        </div>
        
        <div style="background-color: #fff8f0; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h4>💱 Account Features</h4>
          <p><strong>Account Currency:</strong> ${accountCurrency}</p>
          <p><strong>Transfer Method:</strong> ${accountData.required_features?.[0]?.transfer_method || 'Unknown'}</p>
          <p><strong>Institution Address:</strong> ${accountData.institution?.address || 'Unknown'}, ${accountData.institution?.city || 'Unknown'}, ${accountData.institution?.zip_code || 'Unknown'}</p>
        </div>
      </div>
    `;
  }

  /**
   * Normal kullanıcılar için minimal webhook content
   */
  private async generateMinimalWebhookContent(webhook: any): Promise<string> {
    try {
      // Template sistemini kullan
      const rendered = await this.webhookTemplateService.renderTemplateByEvent(
        webhook.webhookName,
        'email',
        'en',
        webhook.dataJson,
        webhook.overriddenSubtext1,
        webhook.overriddenSubtext2
      );
      return rendered.html;
    } catch (error) {
      this.logger.warn(`Template bulunamadı veya render edilemedi: ${webhook.webhookName}, fallback content kullanılıyor`);
      return this.generateDefaultWebhookTemplate(webhook.webhookName);
    }
  }

  /**
   * Payment received template - beautiful design like the image
   */
  private generatePaymentReceivedTemplate(data: any): string {
    const amount = data.amount || 0;
    const currency = data.currency || 'USD';
    const transactionId = data.transaction_id || data.id || 'N/A';
    const date = new Date().toISOString().split('T')[0];
    
        return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Received</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8f9fa; color: #333; line-height: 1.6; margin: 0; padding: 0;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; text-align: center; color: white;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center;">
                    <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                      <tr>
                        <td style="width: 40px; height: 40px; background-color: #ff6b35; border-radius: 8px; text-align: center; vertical-align: middle; padding-right: 12px;">
                          <span style="font-size: 20px; color: white;">🏠</span>
                        </td>
                        <td style="text-align: left;">
                          <div style="font-size: 24px; font-weight: 700; color: white;">Magna Porta</div>
                        </td>
                      </tr>
                    </table>
                    <h1 style="font-size: 28px; font-weight: 700; margin: 20px 0 10px 0; color: white;">Payment Successfully Received!</h1>
                    <p style="font-size: 16px; opacity: 0.9; font-weight: 400; margin: 0;">Your account has been credited</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px 30px;">
              <p style="font-size: 18px; margin-bottom: 20px; color: #555;">Hello,</p>
              <p style="font-size: 16px; margin-bottom: 30px; color: #666; line-height: 1.8;">
                Great news! Your account has received a payment of <strong>${amount} ${currency}</strong>.<br>
                Here's a summary of this transaction:
              </p>
              
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8f9fa; border-radius: 12px; margin-bottom: 30px; border: 1px solid #e9ecef;">
                <tr>
                  <td style="padding: 30px;">
                    <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 20px; color: #333;">Transaction Summary</h3>
                    
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Transaction Type:</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="font-size: 14px; color: #333; font-weight: 600;">Payment Received</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Amount:</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="font-size: 14px; color: #333; font-weight: 600;">${amount} ${currency}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Transaction ID:</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="font-size: 14px; color: #333; font-weight: 600;">${transactionId}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Date:</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="font-size: 14px; color: #333; font-weight: 600;">${date}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0;">
                          <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Status:</span>
                        </td>
                        <td style="padding: 12px 0; text-align: right;">
                          <span style="font-size: 14px; color: #333; font-weight: 600;">✅ Completed</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center;">
                    <a href="#" style="display: inline-block; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; text-align: center; box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);">View Transaction</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="font-size: 12px; color: #6c757d; margin: 0;">
                This email was sent by Magna Porta. If you have any questions, please contact our support team.
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  /**
   * Transfer completed template
   */
  private generateTransferCompletedTemplate(data: any): string {
    const amount = data.amount || 0;
    const currency = data.currency || 'USD';
    const transactionId = data.transaction_id || data.id || 'N/A';
    const date = new Date().toISOString().split('T')[0];
    
        return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Transfer Completed</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8f9fa; color: #333; line-height: 1.6; margin: 0; padding: 0;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #17a2b8 0%, #138496 100%); padding: 30px; text-align: center; color: white;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center;">
                    <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                      <tr>
                        <td style="width: 40px; height: 40px; background-color: #ff6b35; border-radius: 8px; text-align: center; vertical-align: middle; padding-right: 12px;">
                          <span style="font-size: 20px; color: white;">🏠</span>
                        </td>
                        <td style="text-align: left;">
                          <div style="font-size: 24px; font-weight: 700; color: white;">Magna Porta</div>
                        </td>
                      </tr>
                    </table>
                    <h1 style="font-size: 28px; font-weight: 700; margin: 20px 0 10px 0; color: white;">Transfer Successfully Completed!</h1>
                    <p style="font-size: 16px; opacity: 0.9; font-weight: 400; margin: 0;">Your transfer has been processed</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px 30px;">
              <p style="font-size: 18px; margin-bottom: 20px; color: #555;">Hello,</p>
              <p style="font-size: 16px; margin-bottom: 30px; color: #666; line-height: 1.8;">
                Your transfer of <strong>${amount} ${currency}</strong> has been successfully completed.<br>
                Here's a summary of this transaction:
              </p>
              
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8f9fa; border-radius: 12px; margin-bottom: 30px; border: 1px solid #e9ecef;">
                <tr>
                  <td style="padding: 30px;">
                    <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 20px; color: #333;">Transfer Summary</h3>
                    
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Transfer Type:</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="font-size: 14px; color: #333; font-weight: 600;">Connected Account Transfer</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Amount:</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="font-size: 14px; color: #333; font-weight: 600;">${amount} ${currency}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Transaction ID:</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="font-size: 14px; color: #333; font-weight: 600;">${transactionId}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Date:</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="font-size: 14px; color: #333; font-weight: 600;">${date}</span>
                        </td>
                      </tr>
              
                      <tr>
                        <td style="padding: 12px 0;">
                          <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Status:</span>
                        </td>
                        <td style="padding: 12px 0; text-align: right;">
                          <span style="font-size: 14px; color: #333; font-weight: 600;">✅ Completed</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center;">
                    <a href="#" style="display: inline-block; background: linear-gradient(135deg, #17a2b8 0%, #138496 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; text-align: center; box-shadow: 0 4px 15px rgba(23, 162, 184, 0.3);">Transferi Görüntüle</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="font-size: 12px; color: #6c757d; margin: 0;">
                Bu e-posta Magna Porta tarafından gönderilmiştir. Sorularınız için destek ekibimizle iletişime geçin.
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  /**
   * Conversion completed template
   */
  private generateConversionCompletedTemplate(data: any): string {
    const sourceAmount = data.source_amount || 0;
    const sourceCurrency = data.source_currency || 'USD';
    const targetAmount = data.target_amount || 0;
    const targetCurrency = data.target_currency || 'EUR';
    const rate = data.rate || 0;
    const transactionId = data.transaction_id || data.id || 'N/A';
    const date = new Date().toISOString().split('T')[0];
    
        return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Currency Conversion Completed</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8f9fa; color: #333; line-height: 1.6; margin: 0; padding: 0;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #6f42c1 0%, #5a32a3 100%); padding: 30px; text-align: center; color: white;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center;">
                    <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                      <tr>
                        <td style="width: 40px; height: 40px; background-color: #ff6b35; border-radius: 8px; text-align: center; vertical-align: middle; padding-right: 12px;">
                          <span style="font-size: 20px; color: white;">🏠</span>
                        </td>
                        <td style="text-align: left;">
                          <div style="font-size: 24px; font-weight: 700; color: white;">Magna Porta</div>
                        </td>
                      </tr>
                    </table>
                    <h1 style="font-size: 28px; font-weight: 700; margin: 20px 0 10px 0; color: white;">Currency Conversion Completed!</h1>
                    <p style="font-size: 16px; opacity: 0.9; font-weight: 400; margin: 0;">Your conversion has been processed</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px 30px;">
              <p style="font-size: 18px; margin-bottom: 20px; color: #555;">Hello,</p>
              <p style="font-size: 16px; margin-bottom: 30px; color: #666; line-height: 1.8;">
                Your currency conversion has been successfully completed.<br>
                Here's a summary of this transaction:
              </p>
              
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8f9fa; border-radius: 12px; margin-bottom: 30px; border: 1px solid #e9ecef;">
                <tr>
                  <td style="padding: 30px;">
                    <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 20px; color: #333;">Conversion Summary</h3>
                    
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Source Amount:</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="font-size: 14px; color: #333; font-weight: 600;">${sourceAmount} ${sourceCurrency}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Target Amount:</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="font-size: 14px; color: #333; font-weight: 600;">${targetAmount} ${targetCurrency}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Exchange Rate:</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="font-size: 14px; color: #333; font-weight: 600;">1 ${sourceCurrency} = ${rate} ${targetCurrency}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Transaction ID:</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="font-size: 14px; color: #333; font-weight: 600;">${transactionId}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Date:</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="font-size: 14px; color: #333; font-weight: 600;">${date}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0;">
                          <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Status:</span>
                        </td>
                        <td style="padding: 12px 0; text-align: right;">
                          <span style="font-size: 14px; color: #333; font-weight: 600;">✅ Completed</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center;">
                    <a href="#" style="display: inline-block; background: linear-gradient(135deg, #6f42c1 0%, #5a32a3 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; text-align: center; box-shadow: 0 4px 15px rgba(111, 66, 193, 0.3);">View Conversion</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="font-size: 12px; color: #6c757d; margin: 0;">
                Bu e-posta Magna Porta tarafından gönderilmiştir. Sorularınız için destek ekibimizle iletişime geçin.
              </p>
            </td>
          </tr>
        </table>
        
      </body>
      </html>
    `;
  }

  /**
   * Conversion settled template - özel conversion.settled webhook için
   */
  private generateConversionSettledTemplate(data: any): string {
    // ConversionSettledEmailData tipinde data bekliyoruz
    const conversionData = data as ConversionSettledEmailData;
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Currency Conversion Settled</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8f9fa; color: #333; line-height: 1.6; margin: 0; padding: 0;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; text-align: center; color: white;">
              <h1 style="font-size: 28px; font-weight: 700; margin-bottom: 10px; color: white;">Currency Conversion Settled!</h1>
              <p style="font-size: 16px; opacity: 0.9; font-weight: 400; margin: 0;">Your conversion has been successfully processed</p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px 30px;">
              <p style="font-size: 18px; margin-bottom: 20px; color: #555;">Hello,</p>
              <p style="font-size: 16px; margin-bottom: 30px; color: #666; line-height: 1.8;">
                Your currency conversion has been successfully completed and settled.<br>
                Here's a detailed summary of this transaction:
              </p>
              
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8f9fa; border-radius: 12px; margin-bottom: 30px; border: 1px solid #e9ecef;">
                <tr>
                  <td style="padding: 30px;">
                    <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 20px; color: #333;">Conversion Transaction Summary</h3>
                    
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Reference ID:</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="font-size: 14px; color: #333; font-weight: 600;">${conversionData.shortReferenceId}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Currency Pair:</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="font-size: 14px; color: #333; font-weight: 600;">${conversionData.currencyPair}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Buy Amount:</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="font-size: 14px; color: #333; font-weight: 600;">${conversionData.buyAmount} ${conversionData.buyCurrency}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Sell Amount:</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="font-size: 14px; color: #333; font-weight: 600;">${conversionData.sellAmount} ${conversionData.sellCurrency}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Client Rate:</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="font-size: 14px; color: #333; font-weight: 600;">1 ${conversionData.buyCurrency} = ${conversionData.clientRate} ${conversionData.sellCurrency}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Conversion Date:</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="font-size: 14px; color: #333; font-weight: 600;">${conversionData.conversionDate}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0;">
                          <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Status:</span>
                        </td>
                        <td style="padding: 12px 0; text-align: right;">
                          <span style="font-size: 14px; color: #333; font-weight: 600;">✅ ${conversionData.status}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center;">
                    <a href="#" style="display: inline-block; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; text-align: center; box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);">View Conversion Details</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="font-size: 12px; color: #6c757d; margin: 0;">
                Bu e-posta Magna Porta tarafından gönderilmiştir. Sorularınız için destek ekibimizle iletişime geçin.
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  /**
   * Transfer processed template
   */
  private generateTransferProcessedTemplate(data: any): string {
    const amount = data.amount || 0;
    const currency = data.currency || 'USD';
    const sourceAccount = data.source_account || 'Bilinmiyor';
    const destinationAccount = data.destination_account || 'Bilinmiyor';
    const transactionId = data.transaction_id || data.id || 'N/A';
    const date = new Date().toISOString().split('T')[0];
    
        return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Transfer Processed</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8f9fa; color: #333; line-height: 1.6; margin: 0; padding: 0;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #fd7e14 0%, #e55a00 100%); padding: 30px; text-align: center; color: white;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center;">
                    <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                      <tr>
                        <td style="width: 40px; height: 40px; background-color: #ff6b35; border-radius: 8px; text-align: center; vertical-align: middle; padding-right: 12px;">
                          <span style="font-size: 20px; color: white;">🏠</span>
                        </td>
                        <td style="text-align: left;">
                          <div style="font-size: 24px; font-weight: 700; color: white;">Magna Porta</div>
                        </td>
                      </tr>
                    </table>
                    <h1 style="font-size: 28px; font-weight: 700; margin: 20px 0 10px 0; color: white;">Transfer Successfully Processed!</h1>
                    <p style="font-size: 16px; opacity: 0.9; font-weight: 400; margin: 0;">Your transfer has been completed</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px 30px;">
              <p style="font-size: 18px; margin-bottom: 20px; color: #555;">Hello,</p>
              <p style="font-size: 16px; margin-bottom: 30px; color: #666; line-height: 1.8;">
                Your transfer of <strong>${amount} ${currency}</strong> has been successfully processed.<br>
                Here's a summary of this transaction:
              </p>
              
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8f9fa; border-radius: 12px; margin-bottom: 30px; border: 1px solid #e9ecef;">
                <tr>
                  <td style="padding: 30px;">
                    <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 20px; color: #333;">Transfer Summary</h3>
                    
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Transfer Type:</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="font-size: 14px; color: #333; font-weight: 600;">General Transfer</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Amount:</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="font-size: 14px; color: #333; font-weight: 600;">${amount} ${currency}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Source Account:</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="font-size: 14px; color: #333; font-weight: 600;">${sourceAccount}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Destination Account:</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="font-size: 14px; color: #333; font-weight: 600;">${destinationAccount}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Transaction ID:</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="font-size: 14px; color: #333; font-weight: 600;">${transactionId}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Date:</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="font-size: 14px; color: #333; font-weight: 600;">${date}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0;">
                          <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Status:</span>
                        </td>
                        <td style="padding: 12px 0; text-align: right;">
                          <span style="font-size: 14px; color: #333; font-weight: 600;">✅ Completed</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center;">
                    <a href="#" style="display: inline-block; background: linear-gradient(135deg, #fd7e14 0%, #e55a00 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; text-align: center; box-shadow: 0 4px 15px rgba(253, 126, 20, 0.3);">Transferi Görüntüle</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="font-size: 12px; color: #6c757d; margin: 0;">
                Bu e-posta Magna Porta tarafından gönderilmiştir. Sorularınız için destek ekibimizle iletişime geçin.
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  /**
   * Default webhook template
   */
  private generateDefaultWebhookTemplate(webhookName: string): string {
    const date = new Date().toISOString().split('T')[0];
    
        return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Update</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8f9fa; color: #333; line-height: 1.6; margin: 0; padding: 0;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #6c757d 0%, #495057 100%); padding: 30px; text-align: center; color: white;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center;">
                    
                    <h1 style="font-size: 28px; font-weight: 700; margin: 20px 0 10px 0; color: white;">Account Updated</h1>
                    <p style="font-size: 16px; opacity: 0.9; font-weight: 400; margin: 0;">Your account has been updated</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px 30px;">
              <p style="font-size: 18px; margin-bottom: 20px; color: #555;">Hello,</p>
              <p style="font-size: 16px; margin-bottom: 30px; color: #666; line-height: 1.8;">
                Your Magna Porta account has been updated.<br>
                Here's a summary of this update:
              </p>
              
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8f9fa; border-radius: 12px; margin-bottom: 30px; border: 1px solid #e9ecef;">
                <tr>
                  <td style="padding: 30px;">
                    <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 20px; color: #333;">Update Summary</h3>
                    
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Update Type:</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="font-size: 14px; color: #333; font-weight: 600;">${webhookName}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Date:</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="font-size: 14px; color: #333; font-weight: 600;">${date}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0;">
                          <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Status:</span>
                        </td>
                        <td style="padding: 12px 0; text-align: right;">
                          <span style="font-size: 14px; color: #333; font-weight: 600;">✅ Updated</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center;">
                    <a href="#" style="display: inline-block; background: linear-gradient(135deg, #6c757d 0%, #495057 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; text-align: center; box-shadow: 0 4px 15px rgba(108, 117, 125, 0.3);">View Details</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="font-size: 12px; color: #6c757d; margin: 0;">
                Bu e-posta Magna Porta tarafından gönderilmiştir. Sorularınız için destek ekibimizle iletişime geçin.
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  /**
   * Normal kullanıcılar için işlem detayları
   */
  private generateTransactionDetails(webhook: any): string {
    const data = webhook.dataJson;
    
    switch (webhook.webhookName) {
      case 'payout_transfer_funding_funded':
      case 'payout.transfer.funding.funded':
        return `
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 20px;">
            <tr>
              <td style="background-color: white; padding: 18px 15px; border-radius: 10px; border: 1px solid #e9ecef; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05); width: 50%; vertical-align: top;">
                <span style="display: block; font-size: 11px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; font-weight: 500;">Transfer Amount</span>
                <span style="display: block; font-size: 15px; font-weight: 600; color: #212529; line-height: 1.3;">${data.amount_beneficiary_receives || 0} ${data.transfer_currency || 'USD'}</span>
              </td>
              <td style="width: 12px;"></td>
              <td style="background-color: white; padding: 18px 15px; border-radius: 10px; border: 1px solid #e9ecef; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05); width: 50%; vertical-align: top;">
                <span style="display: block; font-size: 11px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; font-weight: 500;">To Recipient</span>
                <span style="display: block; font-size: 15px; font-weight: 600; color: #212529; line-height: 1.3;">${data.beneficiary?.bank_details?.account_name || 'N/A'}</span>
              </td>
            </tr>
            <tr style="height: 12px;"><td colspan="3"></td></tr>
            <tr>
              <td style="background-color: white; padding: 18px 15px; border-radius: 10px; border: 1px solid #e9ecef; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05); width: 50%; vertical-align: top;">
                <span style="display: block; font-size: 11px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; font-weight: 500;">Transfer Date</span>
                <span style="display: block; font-size: 15px; font-weight: 600; color: #212529; line-height: 1.3;">${data.transfer_date || 'N/A'}</span>
              </td>
              <td style="width: 12px;"></td>
              <td style="background-color: white; padding: 18px 15px; border-radius: 10px; border: 1px solid #e9ecef; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05); width: 50%; vertical-align: top;">
                <span style="display: block; font-size: 11px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; font-weight: 500;">Reference</span>
                <span style="display: block; font-size: 15px; font-weight: 600; color: #212529; line-height: 1.3;">${data.reference || 'N/A'}</span>
              </td>
            </tr>
            <tr style="height: 12px;"><td colspan="3"></td></tr>
            <tr>
              <td colspan="3" style="background-color: white; padding: 18px 15px; border-radius: 10px; border: 1px solid #e9ecef; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <span style="display: block; font-size: 11px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; font-weight: 500;">Status</span>
                <span style="display: block; font-size: 15px; font-weight: 700; color: #28a745; line-height: 1.3;">Transfer Completed</span>
              </td>
            </tr>
          </table>
        `;
      case 'connected_account_transfer':
        return `
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 20px;">
            <tr>
              <td style="background-color: white; padding: 18px 15px; border-radius: 10px; border: 1px solid #e9ecef; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05); width: 50%; vertical-align: top;">
                <span style="display: block; font-size: 11px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; font-weight: 500;">Transfer Amount</span>
                <span style="display: block; font-size: 15px; font-weight: 600; color: #212529; line-height: 1.3;">${data.amount || 0} ${data.currency || 'USD'}</span>
              </td>
              <td style="width: 12px;"></td>
              <td style="background-color: white; padding: 18px 15px; border-radius: 10px; border: 1px solid #e9ecef; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05); width: 50%; vertical-align: top;">
                <span style="display: block; font-size: 11px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; font-weight: 500;">From Account</span>
                <span style="display: block; font-size: 15px; font-weight: 600; color: #212529; line-height: 1.3;">${data.source_account || 'Source Account'}</span>
              </td>
            </tr>
            <tr style="height: 12px;"><td colspan="3"></td></tr>
            <tr>
              <td style="background-color: white; padding: 18px 15px; border-radius: 10px; border: 1px solid #e9ecef; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05); width: 50%; vertical-align: top;">
                <span style="display: block; font-size: 11px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; font-weight: 500;">To Account</span>
                <span style="display: block; font-size: 15px; font-weight: 600; color: #212529; line-height: 1.3;">${data.destination_account || 'Destination Account'}</span>
              </td>
              <td style="width: 12px;"></td>
              <td style="background-color: white; padding: 18px 15px; border-radius: 10px; border: 1px solid #e9ecef; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05); width: 50%; vertical-align: top;">
                <span style="display: block; font-size: 11px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; font-weight: 500;">Status</span>
                <span style="display: block; font-size: 15px; font-weight: 700; color: #28a745; line-height: 1.3;">${data.status || 'Completed'}</span>
              </td>
            </tr>
          </table>
        `;
      case 'conversion':
        return `
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 20px;">
            <tr>
              <td style="background-color: white; padding: 18px 15px; border-radius: 10px; border: 1px solid #e9ecef; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05); width: 50%; vertical-align: top;">
                <span style="display: block; font-size: 11px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; font-weight: 500;">Converted From</span>
                <span style="display: block; font-size: 15px; font-weight: 600; color: #212529; line-height: 1.3;">${data.source_amount || 0} ${data.source_currency || 'USD'}</span>
              </td>
              <td style="width: 12px;"></td>
              <td style="background-color: white; padding: 18px 15px; border-radius: 10px; border: 1px solid #e9ecef; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05); width: 50%; vertical-align: top;">
                <span style="display: block; font-size: 11px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; font-weight: 500;">Converted To</span>
                <span style="display: block; font-size: 15px; font-weight: 600; color: #212529; line-height: 1.3;">${data.target_amount || 0} ${data.target_currency || 'USD'}</span>
              </td>
            </tr>
            <tr style="height: 12px;"><td colspan="3"></td></tr>
            <tr>
              <td style="background-color: white; padding: 18px 15px; border-radius: 10px; border: 1px solid #e9ecef; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05); width: 50%; vertical-align: top;">
                <span style="display: block; font-size: 11px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; font-weight: 500;">Exchange Rate</span>
                <span style="display: block; font-size: 15px; font-weight: 600; color: #212529; line-height: 1.3;">1 ${data.source_currency || 'USD'} = ${data.rate || 0} ${data.target_currency || 'USD'}</span>
              </td>
              <td style="width: 12px;"></td>
              <td style="background-color: white; padding: 18px 15px; border-radius: 10px; border: 1px solid #e9ecef; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05); width: 50%; vertical-align: top;">
                <span style="display: block; font-size: 11px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; font-weight: 500;">Status</span>
                <span style="display: block; font-size: 15px; font-weight: 700; color: #28a745; line-height: 1.3;">Successfully Converted</span>
              </td>
            </tr>
          </table>
        `;
      case 'transfer':
        return `
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 20px;">
            <tr>
              <td style="background-color: white; padding: 18px 15px; border-radius: 10px; border: 1px solid #e9ecef; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05); width: 50%; vertical-align: top;">
                <span style="display: block; font-size: 11px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; font-weight: 500;">Transfer Amount</span>
                <span style="display: block; font-size: 15px; font-weight: 600; color: #212529; line-height: 1.3;">${data.amount || 0} ${data.currency || 'USD'}</span>
              </td>
              <td style="width: 12px;"></td>
              <td style="background-color: white; padding: 18px 15px; border-radius: 10px; border: 1px solid #e9ecef; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05); width: 50%; vertical-align: top;">
                <span style="display: block; font-size: 11px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; font-weight: 500;">From Account</span>
                <span style="display: block; font-size: 15px; font-weight: 600; color: #212529; line-height: 1.3;">${data.source_account || 'Source Account'}</span>
              </td>
            </tr>
            <tr style="height: 12px;"><td colspan="3"></td></tr>
            <tr>
              <td style="background-color: white; padding: 18px 15px; border-radius: 10px; border: 1px solid #e9ecef; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05); width: 50%; vertical-align: top;">
                <span style="display: block; font-size: 11px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; font-weight: 500;">To Account</span>
                <span style="display: block; font-size: 15px; font-weight: 600; color: #212529; line-height: 1.3;">${data.destination_account || 'Destination Account'}</span>
              </td>
              <td style="width: 12px;"></td>
              <td style="background-color: white; padding: 18px 15px; border-radius: 10px; border: 1px solid #e9ecef; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05); width: 50%; vertical-align: top;">
                <span style="display: block; font-size: 11px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; font-weight: 500;">Status</span>
                <span style="display: block; font-size: 15px; font-weight: 700; color: #28a745; line-height: 1.3;">${data.status || 'Successfully Processed'}</span>
              </td>
            </tr>
          </table>
        `;
      default:
        return `
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 20px;">
            <tr>
              <td style="background-color: white; padding: 18px 15px; border-radius: 10px; border: 1px solid #e9ecef; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05); width: 50%; vertical-align: top;">
                <span style="display: block; font-size: 11px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; font-weight: 500;">Transaction Type</span>
                <span style="display: block; font-size: 15px; font-weight: 600; color: #212529; line-height: 1.3;">${webhook.webhookName}</span>
              </td>
              <td style="width: 12px;"></td>
              <td style="background-color: white; padding: 18px 15px; border-radius: 10px; border: 1px solid #e9ecef; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05); width: 50%; vertical-align: top;">
                <span style="display: block; font-size: 11px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; font-weight: 500;">Status</span>
                <span style="display: block; font-size: 15px; font-weight: 700; color: #28a745; line-height: 1.3;">Successfully Completed</span>
              </td>
            </tr>
          </table>
        `;
    }
  }

  /**
   * Admin notification email content
   */
  private async generateAdminNotificationContent(webhook: any, company: any, users: any[], emailAddresses: string[]): Promise<string> {
    const receivedTime = new Date(webhook.receivedAt).toLocaleString('en-US');
    const currentTime = new Date().toLocaleString('en-US');
    
    // Webhook custom content for admin
    const webhookCustomContent = await this.generateCustomWebhookContent(webhook);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Admin Notification - Webhook Mail Delivery Report</title>
      </head>
      <body style="font-family: Arial, sans-serif; margin: 20px;">
        <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; border: 1px solid #c3e6cb;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="${this.LOGO_URL}" 
                 alt="Magna Porta" 
                 style="max-width: 200px; height: auto; border-radius: 8px;">
          </div>
          <h2 style="margin: 0 0 15px 0;">✅ Webhook Mail Successfully Delivered</h2>
          <p style="margin: 0;">Webhook notification has been successfully delivered to relevant users</p>
        </div>
        
        <div style="background-color: #d1ecf1; padding: 15px; border-radius: 5px; border: 1px solid #bee5eb; margin: 15px 0;">
          <h3 style="margin: 0 0 15px 0;">📧 Mail Delivery Summary</h3>
          <div style="display: flex; justify-content: space-between; margin: 15px 0;">
            <div style="background-color: #f8f9fa; padding: 10px; border-radius: 5px; text-align: center; flex: 1; margin: 0 5px;">
              <strong>Total Recipients</strong><br>
              <span style="font-size: 24px; color: #28a745;">${emailAddresses.length}</span>
            </div>
            <div style="background-color: #f8f9fa; padding: 10px; border-radius: 5px; text-align: center; flex: 1; margin: 0 5px;">
              <strong>Delivery Time</strong><br>
              <span style="color: #007bff;">${currentTime}</span>
            </div>
            <div style="background-color: #f8f9fa; padding: 10px; border-radius: 5px; text-align: center; flex: 1; margin: 0 5px;">
              <strong>Webhook Type</strong><br>
              <span style="color: #6f42c1;">${webhook.webhookName}</span>
            </div>
          </div>
        </div>
        
        <div style="margin: 20px 0;">
          <div style="margin: 10px 0;">
            <span style="font-weight: bold; color: #495057;">Webhook ID:</span>
            <span style="color: #212529;">${webhook.webhookId}</span>
          </div>
          
          <div style="margin: 10px 0;">
            <span style="font-weight: bold; color: #495057;">Webhook Name:</span>
            <span style="color: #212529;">${webhook.webhookName}</span>
          </div>
          
          <div style="margin: 10px 0;">
            <span style="font-weight: bold; color: #495057;">Account ID:</span>
            <span style="color: #212529;">${webhook.accountId}</span>
          </div>
          
          <div style="margin: 10px 0;">
            <span style="font-weight: bold; color: #495057;">Company:</span>
            <span style="color: #212529;">${company.name} (ID: ${company.id})</span>
          </div>
          
          <div style="margin: 10px 0;">
            <span style="font-weight: bold; color: #495057;">Company Status:</span>
            <span style="color: #212529;">${company.isActive ? '🟢 Active' : '🔴 Inactive'} | ${company.isVerified ? '✅ Verified' : '❌ Not Verified'}</span>
          </div>
          
          <div style="margin: 10px 0;">
            <span style="font-weight: bold; color: #495057;">Received Time:</span>
            <span style="color: #212529;">${receivedTime}</span>
          </div>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #007bff;">
          <h3 style="margin: 0 0 15px 0;">📋 Webhook Content Sent to Users</h3>
          ${webhookCustomContent}
        </div>
        
        <div style="background-color: #e2e3e5; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h3 style="margin: 0 0 15px 0;">👥 Users Who Received the Mail</h3>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px;">
            <h4 style="margin: 0 0 15px 0;">Recipient Details:</h4>
            <ul style="list-style: none; padding: 0; margin: 0;">
              ${users.map((user, index) => `
                <li style="padding: 10px; margin: 5px 0; background-color: white; border-radius: 3px; border-left: 3px solid ${user.isActive ? '#28a745' : '#dc3545'};">
                  <strong>${index + 1}. ${user.firstName} ${user.lastName}</strong><br>
                  <span style="color: #6c757d;">${user.email}</span><br>
                  <span style="color: ${user.isActive ? '#28a745' : '#dc3545'};">
                    ${user.isActive ? '🟢 Active' : '🔴 Inactive'}
                  </span>
                  ${user.role ? ` | Role: ${user.role.name}` : ''}
                </li>
              `).join('')}
            </ul>
          </div>
        </div>
        
        <div style="background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h3 style="margin: 0 0 15px 0;">📊 Full Webhook Data</h3>
          <pre style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; overflow-x: auto; font-size: 12px; margin: 0;">${JSON.stringify(webhook.dataJson, null, 2)}</pre>
        </div>
        
        <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 12px;">
          <p style="margin: 0 0 10px 0;"><strong>Mail Delivery Report Generated:</strong> ${currentTime}</p>
          <p style="margin: 0 0 10px 0;"><strong>Total Recipients:</strong> ${emailAddresses.length} users</p>
          <p style="margin: 0 0 10px 0;"><strong>Company:</strong> ${company.name} (${company.isActive ? 'Active' : 'Inactive'})</p>
          <p style="margin: 0;">Magna Porta API - Webhook Notification Service</p>
        </div>

      </body>
      </html>
    `;
  }

  /**
   * Payout transfer funding funded template - özel payout.transfer.funding.funded webhook için
   */
  private generatePayoutTransferFundingFundedTemplate(data: any): string {
    // PayoutTransferFundingFundedHookData tipinde data bekliyoruz
    const payoutData = data;
    
    // Webhook tipine göre uygun mesajları ve renkleri belirle
    const { title, subtitle, headerColor, statusMessage, statusColor, buttonText, buttonColor } = this.getPayoutTransferEmailConfig(payoutData.message);
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8f9fa; color: #333; line-height: 1.6; margin: 0; padding: 0;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <tr>
            <td style="background: ${headerColor}; padding: 30px; text-align: center; color: white;">
              <h1 style="font-size: 28px; font-weight: 700; margin-bottom: 10px; color: white;">${title}</h1>
              <p style="font-size: 16px; opacity: 0.9; font-weight: 400; margin: 0;">${subtitle}</p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px 30px;">
              <p style="font-size: 18px; margin-bottom: 20px; color: #555;">Hi there,</p>
              <p style="font-size: 16px; margin-bottom: 30px; color: #666; line-height: 1.8;">
                ${this.getPayoutTransferEmailBody(payoutData.message, payoutData)}
              </p>
              
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8f9fa; border-radius: 12px; margin-bottom: 30px; border: 1px solid #e9ecef;">
                <tr>
                  <td style="padding: 30px;">
                    <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 20px; color: #333;">Transfer Summary</h3>
                    
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Airwallex account</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="font-size: 14px; color: #333; font-weight: 600;">${payoutData.payer?.company_name || 'N/A'}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Transfer amount</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="font-size: 14px; color: #333; font-weight: 600;">${payoutData.amount_beneficiary_receives || 0} ${payoutData.transfer_currency || 'USD'}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="font-size: 14px; color: #6c757d; font-weight: 500;">To</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="font-size: 14px; color: #333; font-weight: 600;">${payoutData.beneficiary?.bank_details?.account_name || 'N/A'}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Transfer date</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="font-size: 14px; color: #333; font-weight: 600;">${payoutData.transfer_date || 'N/A'}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Transfer method</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="font-size: 14px; color: #333; font-weight: 600;">${payoutData.transfer_method || 'BANK_TRANSFER'}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Status</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="font-size: 14px; color: ${statusColor}; font-weight: 600;">${statusMessage}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0;">
                          <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Transfer ID</span>
                        </td>
                        <td style="padding: 12px 0; text-align: right;">
                          <span style="font-size: 14px; color: #333; font-weight: 600;">${payoutData.id || 'N/A'}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8f9fa; border-radius: 12px; margin-bottom: 30px; border: 1px solid #e9ecef;">
                <tr>
                  <td style="padding: 30px;">
                    <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 20px; color: #333;">Additional Details</h3>
                    
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Reference</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="font-size: 14px; color: #333; font-weight: 600;">${payoutData.reference || 'N/A'}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="font-size: 14px; color: #6c757d; font-weight: 500;">IBAN</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="font-size: 14px; color: #333; font-weight: 600;">•••• ${payoutData.beneficiary?.bank_details?.iban?.slice(-4) || 'N/A'} - ${payoutData.beneficiary?.bank_details?.swift_code || 'N/A'}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Bank</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="font-size: 14px; color: #333; font-weight: 600;">${payoutData.beneficiary?.bank_details?.bank_name || 'N/A'}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0;">
                          <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Account Currency</span>
                        </td>
                        <td style="padding: 12px 0; text-align: right;">
                          <span style="font-size: 14px; color: #333; font-weight: 600;">${payoutData.beneficiary?.bank_details?.account_currency || 'N/A'}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center;">
                    <a href="#" style="display: inline-block; background: ${buttonColor}; color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; text-align: center; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);">${buttonText}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="font-size: 12px; color: #6c757d; margin: 0;">
                This email was sent by Magna Porta. If you have any questions, please contact our support team.
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  /**
   * Payout transfer email konfigürasyonu - webhook tipine göre uygun mesajları ve renkleri döndürür
   */
  private getPayoutTransferEmailConfig(message: string): any {
    if (message.includes('pending approval')) {
      return {
        title: 'Transfer Approval Required',
        subtitle: 'Your transfer is waiting for approval',
        headerColor: 'linear-gradient(135deg, #ffc107 0%, #ff9800 100%)',
        statusMessage: '⏳ Pending Approval',
        statusColor: '#ff9800',
        buttonText: 'View Transfer Details',
        buttonColor: 'linear-gradient(135deg, #ffc107 0%, #ff9800 100%)'
      };
    } else if (message.includes('approval rejected')) {
      return {
        title: 'Transfer Approval Rejected',
        subtitle: 'Your transfer approval has been denied',
        headerColor: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
        statusMessage: '❌ Approval Rejected',
        statusColor: '#dc3545',
        buttonText: 'View Transfer Details',
        buttonColor: 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)'
      };
    } else if (message.includes('approval blocked')) {
      return {
        title: 'Transfer Approval Blocked',
        subtitle: 'Your transfer approval has been blocked',
        headerColor: 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)',
        statusMessage: '🚫 Approval Blocked',
        statusColor: '#6c757d',
        buttonText: 'View Transfer Details',
        buttonColor: 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)'
      };
    } else if (message.includes('requires funding confirmation')) {
      return {
        title: 'Funding Confirmation Required',
        subtitle: 'Your transfer needs funding confirmation',
        headerColor: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)',
        statusMessage: '🔒 Requires Confirmation',
        statusColor: '#17a2b8',
        buttonText: 'View Transfer Details',
        buttonColor: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)'
      };
    } else if (message.includes('funding failed')) {
      return {
        title: 'Transfer Funding Failed',
        subtitle: 'Your transfer funding was unsuccessful',
        headerColor: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
        statusMessage: '❌ Funding Failed',
        statusColor: '#dc3545',
        buttonText: 'View Transfer Details',
        buttonColor: 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)'
      };
    } else if (message.includes('funding cancelled')) {
      return {
        title: 'Transfer Funding Cancelled',
        subtitle: 'Your transfer funding has been cancelled',
        headerColor: 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)',
        statusMessage: '🚫 Funding Cancelled',
        statusColor: '#6c757d',
        buttonText: 'View Transfer Details',
        buttonColor: 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)'
      };
    } else if (message.includes('successfully funded')) {
      return {
        title: 'Transfer Successfully Funded',
        subtitle: 'Your transfer has been funded and is on its way',
        headerColor: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
        statusMessage: '✅ Successfully Funded',
        statusColor: '#28a745',
        buttonText: 'View Transfer Details',
        buttonColor: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)'
      };
    } else {
      return {
        title: 'Transfer Status Updated',
        subtitle: 'Your transfer status has been updated',
        headerColor: 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)',
        statusMessage: 'ℹ️ Status Updated',
        statusColor: '#6c757d',
        buttonText: 'View Transfer Details',
        buttonColor: 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)'
      };
    }
  }

  /**
   * Payout transfer email body metni - webhook tipine göre uygun açıklama döndürür
   */
  private getPayoutTransferEmailBody(message: string, payoutData: any): string {
    if (message.includes('pending approval')) {
      return `Your transfer to <strong>${payoutData.beneficiary?.bank_details?.account_name || 'Recipient'}</strong> is currently pending approval. We will notify you once the approval process is complete.`;
    } else if (message.includes('approval rejected')) {
      return `Unfortunately, your transfer to <strong>${payoutData.beneficiary?.bank_details?.account_name || 'Recipient'}</strong> has been rejected during the approval process. Please contact our support team for more information.`;
    } else if (message.includes('approval blocked')) {
      return `Your transfer to <strong>${payoutData.beneficiary?.bank_details?.account_name || 'Recipient'}</strong> has been blocked during the approval process. This may be due to compliance or security reasons.`;
    } else if (message.includes('requires funding confirmation')) {
      return `Your transfer to <strong>${payoutData.beneficiary?.bank_details?.account_name || 'Recipient'}</strong> requires funding confirmation before it can proceed. Please confirm the funding details.`;
    } else if (message.includes('funding failed')) {
      return `We were unable to fund your transfer to <strong>${payoutData.beneficiary?.bank_details?.account_name || 'Recipient'}</strong>. This may be due to insufficient funds or other technical issues.`;
    } else if (message.includes('funding cancelled')) {
      return `Your transfer to <strong>${payoutData.beneficiary?.bank_details?.account_name || 'Recipient'}</strong> has been cancelled during the funding process.`;
    } else if (message.includes('successfully funded')) {
      return `Great news! Your transfer to <strong>${payoutData.beneficiary?.bank_details?.account_name || 'Recipient'}</strong> has been successfully funded and should arrive in 0-2 business days from <strong>${payoutData.transfer_date || 'N/A'}</strong>.`;
    } else {
      return `Your transfer to <strong>${payoutData.beneficiary?.bank_details?.account_name || 'Recipient'}</strong> status has been updated. Here's a summary of this transfer:`;
    }
  }

  /**
   * Account active template - özel account.active webhook için
   */
  private generateAccountActiveTemplate(data: any): string {
    // AccountActiveHookData tipinde data bekliyoruz
    const accountData = data as AccountActiveHookData;
    
    // Company name'i primary contact'tan al
    const companyName = accountData.data?.primary_contact?.first_name && accountData.data?.primary_contact?.last_name
      ? `${accountData.data.primary_contact.first_name} ${accountData.data.primary_contact.last_name}`
      : 'Your Company';
    
    // Account type'ı legal entity type'dan al
    const accountType = accountData.data?.account_details?.legal_entity_type === 'INDIVIDUAL' 
      ? 'Individual Account' 
      : 'Business Account';
    
    // Account location'ı address'ten al
    const accountLocation = accountData.data?.account_details?.individual_details?.address?.country_code || 'Unknown';
    
    // Account status
    const accountStatus = accountData.data?.status || 'Unknown';
    
    // Airwallex account name
    const airwallexAccount = companyName;
    
    // Activation date
    const activationDate = new Date(accountData.data?.created_at || Date.now()).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    console.warn("accountData wrong placee")
    console.log("accountData wrong placee")
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your ${accountType} has been activated</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8f9fa; color: #333; line-height: 1.6; margin: 0; padding: 0;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; text-align: center; color: white;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center;">
                    <h1 style="font-size: 28px; font-weight: 700; margin: 20px 0 10px 0; color: white;">Your ${accountType} has been activated!</h1>
                    <p style="font-size: 16px; opacity: 0.9; font-weight: 400; margin: 0;">Your account is now ready to use</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px 30px;">
              <p style="font-size: 18px; margin-bottom: 20px; color: #555;">Hi ${companyName},</p>
              <p style="font-size: 16px; margin-bottom: 30px; color: #666; line-height: 1.8;">
                Thank you for your patience. Your ${accountType} has now been activated and is ready to use. Here's a summary of your account details:
              </p>
              
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8f9fa; border-radius: 12px; margin-bottom: 30px; border: 1px solid #e9ecef;">
                <tr>
                  <td style="padding: 30px;">
                    <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 20px; color: #333;">Account Summary</h3>
                    
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Account Type:</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="font-size: 14px; color: #333; font-weight: 600;">${accountType}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Account Location:</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="font-size: 14px; color: #333; font-weight: 600;">${accountLocation}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Status:</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="font-size: 14px; color: #333; font-weight: 600;">✅ ${accountStatus}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Airwallex Account:</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="font-size: 14px; color: #333; font-weight: 600;">${airwallexAccount}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Account ID:</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="font-size: 14px; color: #333; font-weight: 600;">${accountData.account_id}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0;">
                          <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Activation Date:</span>
                        </td>
                        <td style="padding: 12px 0; text-align: right;">
                          <span style="font-size: 14px; color: #333; font-weight: 600;">${activationDate}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8f9fa; border-radius: 12px; margin-bottom: 30px; border: 1px solid #e9ecef;">
                <tr>
                  <td style="padding: 30px;">
                    <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 20px; color: #333;">Account Usage Information</h3>
                    
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Expected Monthly Volume:</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="font-size: 14px; color: #333; font-weight: 600;">${accountData.data?.account_usage?.expected_monthly_transaction_volume?.amount || '0'} USD</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Collection Countries:</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="font-size: 14px; color: #333; font-weight: 600;">${accountData.data?.account_usage?.collection_country_codes?.join(', ') || 'None'}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0;">
                          <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Payout Countries:</span>
                        </td>
                        <td style="padding: 12px 0; text-align: right;">
                          <span style="font-size: 14px; color: #333; font-weight: 600;">${accountData.data?.account_usage?.payout_country_codes?.join(', ') || 'None'}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center;">
                    <a href="#" style="display: inline-block; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; text-align: center; box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);">Access Your Account</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="font-size: 12px; color: #6c757d; margin: 0;">
                This email was sent by Magna Porta. If you have any questions, please contact our support team.
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  
  private generateGlobalAccountActiveTemplate(data: any): string {
    const accountData = data as GlobalAccountActiveEmailData;
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your ${accountData.accountCurrency} Global Account in ${accountData.accountLocation} has been activated</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8f9fa; color: #333; line-height: 1.6; margin: 0; padding: 0;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; text-align: center; color: white;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center;">
                    <h1 style="font-size: 28px; font-weight: 700; margin: 20px 0 10px 0; color: white;">Your ${accountData.accountCurrency} Global Account in ${accountData.accountLocation} has been activated!</h1>
                    <p style="font-size: 16px; opacity: 0.9; font-weight: 400; margin: 0;">Your account is now ready to use</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px 30px;">
              <p style="font-size: 18px; margin-bottom: 20px; color: #555;">Hi ${accountData.companyName},</p>
              <p style="font-size: 16px; margin-bottom: 30px; color: #666; line-height: 1.8;">
                Thank you for your patience. Your ${accountData.accountCurrency} Global Account in ${accountData.accountLocation} has now been activated and is ready to use. Here's a summary of your account details:
              </p>
              
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8f9fa; border-radius: 12px; margin-bottom: 30px; border: 1px solid #e9ecef;">
                <tr>
                  <td style="padding: 30px;">
                    <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 20px; color: #333;">${accountData.companyName}</h3>
                    
                    <div style="text-align: center; margin-bottom: 20px;">
                      <span style="display: inline-block; background-color: #28a745; color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">${accountData.accountStatus}</span>
                    </div>
                    
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Airwallex Account:</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="font-size: 14px; color: #333; font-weight: 600;">${accountData.airwallexAccount}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="font-size: 14px; color: #6c757d; font-weight: 500;">IBAN:</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="font-size: 14px; color: #333; font-weight: 600;">${accountData.iban}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Account Location:</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="font-size: 14px; color: #333; font-weight: 600;">${accountData.accountLocation}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Bank Name:</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="font-size: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                            <span style="font-size: 14px; color: #333; font-weight: 600;">${accountData.bankName}</span>
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Account Number:</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="font-size: 14px; color: #333; font-weight: 600;">${accountData.accountNumber}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="font-size: 14px; color: #6c757d; font-weight: 500;">SWIFT Code:</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="font-size: 14px; color: #333; font-weight: 600;">${accountData.swiftCode}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Nick Name:</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="font-size: 14px; color: #333; font-weight: 600;">${accountData.nickName}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Activation Date:</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="font-size: 14px; color: #333; font-weight: 600;">${accountData.activationDate}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745;">
                <p style="margin: 0; color: #155724; font-size: 14px;">
                  <strong>✅ Your account is now fully operational.</strong> You can start using it for international transactions and payments.
                </p>
              </div>
            </td>
          </tr>
          
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; color: #6c757d; font-size: 14px;">
              <p style="margin: 0 0 15px 0; line-height: 1.6;">This is an automated notification from Magna Porta</p>
              <p style="margin: 0 0 15px 0; line-height: 1.6;">Please do not reply to this email</p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  /**
   * Manuel olarak webhook mail işlemini tetikler
   */
  async triggerWebhookMailProcess(): Promise<void> {
    this.logger.log('Manuel webhook mail işlemi tetiklendi');
    await this.processUnsentWebhooks();
  }

  /**
   * HTML içeriğinde subtext1 ve subtext2'yi override eder
   * Override null/undefined/boş ise template'deki değerleri kullanır
   */
  private applySubtextOverrides(htmlContent: string, overriddenSubtext1?: string, overriddenSubtext2?: string): string {
    let modifiedContent = htmlContent;

    // Subtext1 override - Template'de style="opacity:.9;margin-top:8px;" ile render ediliyor
    if (overriddenSubtext1 && overriddenSubtext1.trim() !== '') {
      modifiedContent = modifiedContent.replace(
        /<p[^>]*style="[^"]*opacity:\.9[^"]*"[^>]*>.*?<\/p>/gi,
        `<p style="opacity:.9;margin-top:8px;">${overriddenSubtext1}</p>`
      );
    }

    // Subtext2 override - Template'de style="opacity:.8;margin-top:4px;" ile render ediliyor
    if (overriddenSubtext2 && overriddenSubtext2.trim() !== '') {
      modifiedContent = modifiedContent.replace(
        /<p[^>]*style="[^"]*opacity:\.8[^"]*"[^>]*>.*?<\/p>/gi,
        `<p style="opacity:.8;margin-top:4px;">${overriddenSubtext2}</p>`
      );
    }

    return modifiedContent;
  }
}
