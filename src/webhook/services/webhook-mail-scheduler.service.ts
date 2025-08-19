import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { WebhookService } from '../webhook.service';
import { MailService } from '../../mail/mail.service';
import { CompaniesService } from '../../company/companies.service';
import { EmailTemplatesService, TransferNotificationData } from '../../mail/email-templates.service';
import { ConversionSettledEmailData } from '../models/conversion-settled.model';
import { WebhookDataParserService } from './webhook-data-parser.service';

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
    private readonly webhookDataParserService: WebhookDataParserService,
  ) {
    // Logo URL'ini environment'dan al, fallback olarak production URL
    this.LOGO_URL = this.configService.get('LOGO_URL', 'http://209.38.223.41:3001/assets/magnaporta-logos/logo_magna_porta.png');
  }

  /**
   * Her dakika çalışır ve mail gönderilmemiş webhook'ları kontrol eder
   */
  @Cron(CronExpression.EVERY_10_SECONDS)
  async processUnsentWebhooks() {
    try {
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
   * Webhook bildirimi gönderir
   */
  private async sendWebhookNotification(webhook: any): Promise<void> {
    try {
      const subject = `Yeni Webhook: ${webhook.webhookName}`;
      
              // Account ID ile company bul
        const company = await this.companiesService.findByAirwallexAccountId(webhook.accountId);
        console.log(company);
        if (company) {
          this.logger.log(`Company bulundu: ${company.name} (ID: ${company.id})`);
          this.logger.log(`Company users count: ${company.users?.length || 0}`);
          if (company.users && company.users.length > 0) {
            this.logger.log(`Users: ${company.users.map(u => `${u.email} (${u.isActive ? 'active' : 'inactive'})`).join(', ')}`);
          }
        }
        
        const htmlContent = this.generateWebhookEmailContent(webhook, company);
      
      if (!company) {
        this.logger.warn(`Company bulunamadı: ${webhook.accountId}`);
        // Company bulunamadıysa admin'e fallback mail gönder
        const fallbackSubject = `[FALLBACK] ${subject} - Company Bulunamadı`;
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
        const fallbackSubject = `[FALLBACK] ${subject} - Users Bulunamadı`;
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
      
      await this.mailService.sendHtmlMail(
        emailAddresses,
        subject,
        htmlContent
      );

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
   * Webhook email içeriği oluşturur
   */
  private generateWebhookEmailContent(webhook: any, company?: any): string {
    // Webhook name'e göre özelleştirilmiş içerik
    const customContent = this.generateCustomWebhookContent(webhook);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Magna Porta Notification</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 50px 20px; text-align: center; color: white; border-radius: 0 0 20px 20px;">
            <img src="${this.LOGO_URL}" 
                 alt="Magna Porta" 
                 style="max-width: 200px; height: auto; margin-bottom: 0; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));">
          </div>
          
          <div style="padding: 40px 30px; background-color: #ffffff;">
            ${this.generateMinimalWebhookContent(webhook)}
            
            <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; border-left: 4px solid #2196f3; margin: 20px 0;">
              <p style="margin: 0 0 15px 0; line-height: 1.6;"><strong>Transaction Time:</strong> ${new Date(webhook.receivedAt).toLocaleString('en-US')}</p>
              <p style="margin: 0 0 15px 0; line-height: 1.6;"><strong>Reference No:</strong> ${webhook.webhookId}</p>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 30px; border-radius: 15px; margin: 25px 0; border: 1px solid #e9ecef; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
              <h3 style="margin: 0 0 20px 0; color: #495057; font-size: 20px; text-align: center;">📋 Transaction Details</h3>
              ${this.generateTransactionDetails(webhook)}
            </div>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 30px; text-align: center; color: #6c757d; font-size: 14px;">
            <p style="margin: 0 0 15px 0; line-height: 1.6;">This is an automated notification from Magna Porta</p>
            <p style="margin: 0 0 15px 0; line-height: 1.6;">Please do not reply to this email</p>
          </div>
        </div>
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
      
      const htmlContent = this.generateAdminNotificationContent(webhook, company, users, emailAddresses);
      
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
  private generateCustomWebhookContent(webhook: any): string {
    const webhookName = webhook.webhookName;
    const data = webhook.dataJson;
    
    switch (webhookName) {
      case 'payout.transfer.funding.funded':
        return this.generatePayoutTransferContent(data);
      
      case 'connected_account_transfer.new':
        return this.generateConnectedAccountTransferContent(data);
      
      case 'conversion.new':
        return this.generateConversionContent(data);
      
      case 'transfer.new':
        return this.generateTransferContent(data);
      
      default:
        return this.generateDefaultContent(webhookName);
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
        
        <div style="background-color: #fff8f0; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h4>📋 Transaction Details</h4>
          <p><strong>Reference:</strong> ${data.reference || 'Unknown'}</p>
          <p><strong>Reason:</strong> ${data.reason || 'Unknown'}</p>
          <p><strong>Fee:</strong> ${data.fee_amount || 0} ${data.fee_currency || 'USD'}</p>
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
   * Normal kullanıcılar için minimal webhook content
   */
  private generateMinimalWebhookContent(webhook: any): string {
    const data = webhook.dataJson;
    
    switch (webhook.webhookName) {
      case 'payout_transfer_funding_funded':
        // Webhook data parser service'i kullanarak data'yı parse et
        const parsedPayoutData = this.webhookDataParserService.parseWebhookData(webhook.webhookName, data);
        return this.generatePayoutTransferFundingFundedTemplate(parsedPayoutData);
      case 'payout.transfer.funding.funded':
        // Webhook data parser service'i kullanarak data'yı parse et
        const parsedPayoutData2 = this.webhookDataParserService.parseWebhookData(webhook.webhookName, data);
        return this.generatePayoutTransferFundingFundedTemplate(parsedPayoutData2);
      case 'connected_account_transfer':
        return this.generateTransferCompletedTemplate(data);
      case 'conversion':
        return this.generateConversionCompletedTemplate(data);
      case 'conversion.settled':
        // Webhook data parser service'i kullanarak data'yı parse et
        const parsedData = this.webhookDataParserService.parseWebhookData(webhook.webhookName, data);
        return this.generateConversionSettledTemplate(parsedData);
      case 'transfer':
        return this.generateTransferProcessedTemplate(data);
      default:
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
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; text-align: center; color: white;">
            <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
              <div style="width: 40px; height: 40px; background-color: #ff6b35; border-radius: 8px; margin-right: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; color: white;">🏠</div>
              <div style="font-size: 24px; font-weight: 700; color: white;">Magna Porta</div>
          </div>
            <h1 style="font-size: 28px; font-weight: 700; margin-bottom: 10px; color: white;">Payment Successfully Received!</h1>
            <p style="font-size: 16px; opacity: 0.9; font-weight: 400; margin: 0;">Your account has been credited</p>
          </div>
          
          <div style="padding: 40px 30px;">
            <p style="font-size: 18px; margin-bottom: 20px; color: #555;">Hello,</p>
            <p style="font-size: 16px; margin-bottom: 30px; color: #666; line-height: 1.8;">
              Great news! Your account has received a payment of <strong>${amount} ${currency}</strong>.<br>
              Here's a summary of this transaction:
            </p>
            
            <div style="background-color: #f8f9fa; border-radius: 12px; padding: 30px; margin-bottom: 30px; border: 1px solid #e9ecef;">
              <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 20px; color: #333;">Transaction Summary</h3>
              
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Transaction Type:</span>
                <span style="font-size: 14px; color: #333; font-weight: 600; text-align: right;">Payment Received</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Amount:</span>
                <span style="font-size: 14px; color: #333; font-weight: 600; text-align: right;">${amount} ${currency}</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Transaction ID:</span>
                <span style="font-size: 14px; color: #333; font-weight: 600; text-align: right;">${transactionId}</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Date:</span>
                <span style="font-size: 14px; color: #333; font-weight: 600; text-align: right;">${date}</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0;">
                <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Status:</span>
                <span style="font-size: 14px; color: #333; font-weight: 600; text-align: right;">✅ Completed</span>
              </div>
            </div>
            
            <div style="text-align: center;">
              <a href="#" style="display: inline-block; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; text-align: center; box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);">View Transaction</a>
            </div>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
            <p style="font-size: 12px; color: #6c757d; margin: 0;">
              This email was sent by Magna Porta. If you have any questions, please contact our support team.
            </p>
          </div>
        </div>
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
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <div style="background: linear-gradient(135deg, #17a2b8 0%, #138496 100%); padding: 30px; text-align: center; color: white;">
            <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
              <div style="width: 40px; height: 40px; background-color: #ff6b35; border-radius: 8px; margin-right: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; color: white;">🏠</div>
              <div style="font-size: 24px; font-weight: 700; color: white;">Magna Porta</div>
          </div>
            <h1 style="font-size: 28px; font-weight: 700; margin-bottom: 10px; color: white;">Transfer Successfully Completed!</h1>
            <p style="font-size: 16px; opacity: 0.9; font-weight: 400; margin: 0;">Your transfer has been processed</p>
          </div>
          
          <div style="padding: 40px 30px;">
            <p style="font-size: 18px; margin-bottom: 20px; color: #555;">Hello,</p>
            <p style="font-size: 16px; margin-bottom: 30px; color: #666; line-height: 1.8;">
              Your transfer of <strong>${amount} ${currency}</strong> has been successfully completed.<br>
              Here's a summary of this transaction:
            </p>
            
            <div style="background-color: #f8f9fa; border-radius: 12px; padding: 30px; margin-bottom: 30px; border: 1px solid #e9ecef;">
              <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 20px; color: #333;">Transfer Summary</h3>
              
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Transfer Type:</span>
                <span style="font-size: 14px; color: #333; font-weight: 600; text-align: right;">Connected Account Transfer</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Amount:</span>
                <span style="font-size: 14px; color: #333; font-weight: 600; text-align: right;">${amount} ${currency}</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Transaction ID:</span>
                <span style="font-size: 14px; color: #333; font-weight: 600; text-align: right;">${transactionId}</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Date:</span>
                <span style="font-size: 14px; color: #333; font-weight: 600; text-align: right;">${date}</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0;">
                <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Status:</span>
                <span style="font-size: 14px; color: #333; font-weight: 600; text-align: right;">✅ Completed</span>
              </div>
            </div>
            
            <div style="text-align: center;">
              <a href="#" style="display: inline-block; background: linear-gradient(135deg, #17a2b8 0%, #138496 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; text-align: center; box-shadow: 0 4px 15px rgba(23, 162, 184, 0.3);">Transferi Görüntüle</a>
            </div>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef; margin-top: 20px;">
            <p style="font-size: 12px; color: #6c757d; margin: 0;">
              Bu e-posta Magna Porta tarafından gönderilmiştir. Sorularınız için destek ekibimizle iletişime geçin.
            </p>
          </div>
        </div>
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
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <div style="background: linear-gradient(135deg, #6f42c1 0%, #5a32a3 100%); padding: 30px; text-align: center; color: white;">
            <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
              <div style="width: 40px; height: 40px; background-color: #ff6b35; border-radius: 8px; margin-right: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; color: white;">🏠</div>
              <div style="font-size: 24px; font-weight: 700; color: white;">Magna Porta</div>
          </div>
            <h1 style="font-size: 28px; font-weight: 700; margin-bottom: 10px; color: white;">Currency Conversion Completed!</h1>
            <p style="font-size: 16px; opacity: 0.9; font-weight: 400; margin: 0;">Your conversion has been processed</p>
          </div>
          
          <div style="padding: 40px 30px;">
            <p style="font-size: 18px; margin-bottom: 20px; color: #555;">Hello,</p>
            <p style="font-size: 16px; margin-bottom: 30px; color: #666; line-height: 1.8;">
              Your currency conversion has been successfully completed.<br>
              Here's a summary of this transaction:
            </p>
            
            <div style="background-color: #f8f9fa; border-radius: 12px; padding: 30px; margin-bottom: 30px; border: 1px solid #e9ecef;">
              <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 20px; color: #333;">Conversion Summary</h3>
              
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e9ecef; margin-bottom: 10px;">
                <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Source Amount:</span>
                <span style="font-size: 14px; color: #333; font-weight: 600; text-align: right;">${sourceAmount} ${sourceCurrency}</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e9ecef; margin-bottom: 10px;">
                <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Target Amount:</span>
                <span style="font-size: 14px; color: #333; font-weight: 600; text-align: right;">${targetAmount} ${targetCurrency}</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e9ecef; margin-bottom: 10px;">
                <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Exchange Rate:</span>
                <span style="font-size: 14px; color: #333; font-weight: 600; text-align: right;">1 ${sourceCurrency} = ${rate} ${targetCurrency}</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e9ecef; margin-bottom: 10px;">
                <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Transaction ID:</span>
                <span style="font-size: 14px; color: #333; font-weight: 600; text-align: right;">${transactionId}</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e9ecef; margin-bottom: 10px;">
                <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Date:</span>
                <span style="font-size: 14px; color: #333; font-weight: 600; text-align: right;">${date}</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0;">
                <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Status:</span>
                <span style="font-size: 14px; color: #333; font-weight: 600; text-align: right;">✅ Completed</span>
              </div>
            </div>
            
            <div style="text-align: center;">
              <a href="#" style="display: inline-block; background: linear-gradient(135deg, #6f42c1 0%, #5a32a3 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; text-align: center; box-shadow: 0 4px 15px rgba(111, 66, 193, 0.3);">View Conversion</a>
            </div>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
            <p style="font-size: 12px; color: #6c757d; margin: 0;">
              Bu e-posta Magna Porta tarafından gönderilmiştir. Sorularınız için destek ekibimizle iletişime geçin.
            </p>
          </div>
        </div>
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
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; text-align: center; color: white;">
            <h1 style="font-size: 28px; font-weight: 700; margin-bottom: 10px; color: white;">Currency Conversion Settled!</h1>
            <p style="font-size: 16px; opacity: 0.9; font-weight: 400; margin: 0;">Your conversion has been successfully processed</p>
          </div>
          
          <div style="padding: 40px 30px;">
            <p style="font-size: 18px; margin-bottom: 20px; color: #555;">Hello,</p>
            <p style="font-size: 16px; margin-bottom: 30px; color: #666; line-height: 1.8;">
              Your currency conversion has been successfully completed and settled.<br>
              Here's a detailed summary of this transaction:
            </p>
            
            <div style="background-color: #f8f9fa; border-radius: 12px; padding: 30px; margin-bottom: 30px; border: 1px solid #e9ecef;">
              <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 20px; color: #333;">Conversion Transaction Summary</h3>
              
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e9ecef; margin-bottom: 10px;">
                <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Reference ID:</span>
                <span style="font-size: 14px; color: #333; font-weight: 600; text-align: right;">${conversionData.shortReferenceId}</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e9ecef; margin-bottom: 10px;">
                <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Currency Pair:</span>
                <span style="font-size: 14px; color: #333; font-weight: 600; text-align: right;">${conversionData.currencyPair}</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e9ecef; margin-bottom: 10px;">
                <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Buy Amount:</span>
                <span style="font-size: 14px; color: #333; font-weight: 600; text-align: right;">${conversionData.buyAmount} ${conversionData.buyCurrency}</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e9ecef; margin-bottom: 10px;">
                <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Sell Amount:</span>
                <span style="font-size: 14px; color: #333; font-weight: 600; text-align: right;">${conversionData.sellAmount} ${conversionData.sellCurrency}</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e9ecef; margin-bottom: 10px;">
                <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Client Rate:</span>
                <span style="font-size: 14px; color: #333; font-weight: 600; text-align: right;">1 ${conversionData.buyCurrency} = ${conversionData.clientRate} ${conversionData.sellCurrency}</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e9ecef; margin-bottom: 10px;">
                <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Conversion Date:</span>
                <span style="font-size: 14px; color: #333; font-weight: 600; text-align: right;">${conversionData.conversionDate}</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0;">
                <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Status:</span>
                <span style="font-size: 14px; color: #333; font-weight: 600; text-align: right;">✅ ${conversionData.status}</span>
              </div>
            </div>
            
            <div style="text-align: center;">
              <a href="#" style="display: inline-block; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; text-align: center; box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);">View Conversion Details</a>
            </div>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
            <p style="font-size: 12px; color: #6c757d; margin: 0;">
              Bu e-posta Magna Porta tarafından gönderilmiştir. Sorularınız için destek ekibimizle iletişime geçin.
            </p>
          </div>
        </div>
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
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <div style="background: linear-gradient(135deg, #fd7e14 0%, #e55a00 100%); padding: 30px; text-align: center; color: white;">
            <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
              <div style="width: 40px; height: 40px; background-color: #ff6b35; border-radius: 8px; margin-right: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; color: white;">🏠</div>
              <div style="font-size: 24px; font-weight: 700; color: white;">Magna Porta</div>
          </div>
            <h1 style="font-size: 28px; font-weight: 700; margin-bottom: 10px; color: white;">Transfer Successfully Processed!</h1>
            <p style="font-size: 16px; opacity: 0.9; font-weight: 400; margin: 0;">Your transfer has been completed</p>
          </div>
          
          <div style="padding: 40px 30px;">
            <p style="font-size: 18px; margin-bottom: 20px; color: #555;">Hello,</p>
            <p style="font-size: 16px; margin-bottom: 30px; color: #666; line-height: 1.8;">
              Your transfer of <strong>${amount} ${currency}</strong> has been successfully processed.<br>
              Here's a summary of this transaction:
            </p>
            
            <div style="background-color: #f8f9fa; border-radius: 12px; padding: 30px; margin-bottom: 30px; border: 1px solid #e9ecef;">
              <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 20px; color: #333;">Transfer Summary</h3>
              
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Transfer Type:</span>
                <span style="font-size: 14px; color: #333; font-weight: 600; text-align: right;">General Transfer</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Amount:</span>
                <span style="font-size: 14px; color: #333; font-weight: 600; text-align: right;">${amount} ${currency}</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Source Account:</span>
                <span style="font-size: 14px; color: #333; font-weight: 600; text-align: right;">${sourceAccount}</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Destination Account:</span>
                <span style="font-size: 14px; color: #333; font-weight: 600; text-align: right;">${destinationAccount}</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Transaction ID:</span>
                <span style="font-size: 14px; color: #333; font-weight: 600; text-align: right;">${transactionId}</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Date:</span>
                <span style="font-size: 14px; color: #333; font-weight: 600; text-align: right;">${date}</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0;">
                <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Status:</span>
                <span style="font-size: 14px; color: #333; font-weight: 600; text-align: right;">✅ Completed</span>
              </div>
            </div>
            
            <div style="text-align: center;">
              <a href="#" style="display: inline-block; background: linear-gradient(135deg, #fd7e14 0%, #e55a00 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; text-align: center; box-shadow: 0 4px 15px rgba(253, 126, 20, 0.3);">Transferi Görüntüle</a>
            </div>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
            <p style="font-size: 12px; color: #6c757d; margin: 0;">
              Bu e-posta Magna Porta tarafından gönderilmiştir. Sorularınız için destek ekibimizle iletişime geçin.
            </p>
          </div>
        </div>
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
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <div style="background: linear-gradient(135deg, #6c757d 0%, #495057 100%); padding: 30px; text-align: center; color: white;">
            <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
              <div style="width: 40px; height: 40px; background-color: #ff6b35; border-radius: 8px; margin-right: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; color: white;">🏠</div>
              <div style="font-size: 24px; font-weight: 700; color: white;">Magna Porta</div>
          </div>
            <h1 style="font-size: 28px; font-weight: 700; margin-bottom: 10px; color: white;">Account Updated</h1>
            <p style="font-size: 16px; opacity: 0.9; font-weight: 400; margin: 0;">Your account has been updated</p>
          </div>
          
          <div style="padding: 40px 30px;">
            <p style="font-size: 18px; margin-bottom: 20px; color: #555;">Hello,</p>
            <p style="font-size: 16px; margin-bottom: 30px; color: #666; line-height: 1.8;">
              Your Magna Porta account has been updated.<br>
              Here's a summary of this update:
            </p>
            
            <div style="background-color: #f8f9fa; border-radius: 12px; padding: 30px; margin-bottom: 30px; border: 1px solid #e9ecef;">
              <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 20px; color: #333;">Update Summary</h3>
              
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Update Type:</span>
                <span style="font-size: 14px; color: #333; font-weight: 600; text-align: right;">${webhookName}</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Date:</span>
                <span style="font-size: 14px; color: #333; font-weight: 600; text-align: right;">${date}</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0;">
                <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Status:</span>
                <span style="font-size: 14px; color: #333; font-weight: 600; text-align: right;">✅ Updated</span>
              </div>
            </div>
            
            <div style="text-align: center;">
              <a href="#" style="display: inline-block; background: linear-gradient(135deg, #6c757d 0%, #495057 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; text-align: center; box-shadow: 0 4px 15px rgba(108, 117, 125, 0.3);">View Details</a>
            </div>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
            <p style="font-size: 12px; color: #6c757d; margin: 0;">
              Bu e-posta Magna Porta tarafından gönderilmiştir. Sorularınız için destek ekibimizle iletişime geçin.
            </p>
          </div>
        </div>
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
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-top: 20px;">
            <div style="background-color: white; padding: 18px 15px; border-radius: 10px; border: 1px solid #e9ecef; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
              <span style="display: block; font-size: 11px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; font-weight: 500;">Transfer Amount</span>
              <span style="display: block; font-size: 15px; font-weight: 600; color: #212529; line-height: 1.3;">${data.amount_beneficiary_receives || 0} ${data.transfer_currency || 'USD'}</span>
            </div>
            <div style="background-color: white; padding: 18px 15px; border-radius: 10px; border: 1px solid #e9ecef; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
              <span style="display: block; font-size: 11px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; font-weight: 500;">To Recipient</span>
              <span style="display: block; font-size: 15px; font-weight: 600; color: #212529; line-height: 1.3;">${data.beneficiary?.bank_details?.account_name || 'N/A'}</span>
            </div>
            <div style="background-color: white; padding: 18px 15px; border-radius: 10px; border: 1px solid #e9ecef; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
              <span style="display: block; font-size: 11px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; font-weight: 500;">Transfer Date</span>
              <span style="display: block; font-size: 15px; font-weight: 600; color: #212529; line-height: 1.3;">${data.transfer_date || 'N/A'}</span>
            </div>
            <div style="background-color: white; padding: 18px 15px; border-radius: 10px; border: 1px solid #e9ecef; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
              <span style="display: block; font-size: 11px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; font-weight: 500;">Reference</span>
              <span style="display: block; font-size: 15px; font-weight: 600; color: #212529; line-height: 1.3;">${data.reference || 'N/A'}</span>
            </div>
            <div style="background-color: white; padding: 18px 15px; border-radius: 10px; border: 1px solid #e9ecef; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
              <span style="display: block; font-size: 11px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; font-weight: 500;">Status</span>
              <span style="display: block; font-size: 15px; font-weight: 700; color: #28a745; line-height: 1.3;">Transfer Completed</span>
            </div>
          </div>
        `;
      case 'connected_account_transfer':
        return `
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-top: 20px;">
            <div style="background-color: white; padding: 18px 15px; border-radius: 10px; border: 1px solid #e9ecef; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
              <span style="display: block; font-size: 11px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; font-weight: 500;">Transfer Amount</span>
              <span style="display: block; font-size: 15px; font-weight: 600; color: #212529; line-height: 1.3;">${data.amount || 0} ${data.currency || 'USD'}</span>
            </div>
            <div style="background-color: white; padding: 18px 15px; border-radius: 10px; border: 1px solid #e9ecef; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
              <span style="display: block; font-size: 11px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; font-weight: 500;">From Account</span>
              <span style="display: block; font-size: 15px; font-weight: 600; color: #212529; line-height: 1.3;">${data.source_account || 'Source Account'}</span>
            </div>
            <div style="background-color: white; padding: 18px 15px; border-radius: 10px; border: 1px solid #e9ecef; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
              <span style="display: block; font-size: 11px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; font-weight: 500;">To Account</span>
              <span style="display: block; font-size: 15px; font-weight: 600; color: #212529; line-height: 1.3;">${data.destination_account || 'Destination Account'}</span>
            </div>
            <div style="background-color: white; padding: 18px 15px; border-radius: 10px; border: 1px solid #e9ecef; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
              <span style="display: block; font-size: 11px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; font-weight: 500;">Status</span>
              <span style="display: block; font-size: 15px; font-weight: 700; color: #28a745; line-height: 1.3;">${data.status || 'Completed'}</span>
            </div>
          </div>
        `;
      case 'conversion':
        return `
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-top: 20px;">
            <div style="background-color: white; padding: 18px 15px; border-radius: 10px; border: 1px solid #e9ecef; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
              <span style="display: block; font-size: 11px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; font-weight: 500;">Converted From</span>
              <span style="display: block; font-size: 15px; font-weight: 600; color: #212529; line-height: 1.3;">${data.source_amount || 0} ${data.source_currency || 'USD'}</span>
            </div>
            <div style="background-color: white; padding: 18px 15px; border-radius: 10px; border: 1px solid #e9ecef; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
              <span style="display: block; font-size: 11px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; font-weight: 500;">Converted To</span>
              <span style="display: block; font-size: 15px; font-weight: 600; color: #212529; line-height: 1.3;">${data.target_amount || 0} ${data.target_currency || 'USD'}</span>
            </div>
            <div style="background-color: white; padding: 18px 15px; border-radius: 10px; border: 1px solid #e9ecef; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
              <span style="display: block; font-size: 11px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; font-weight: 500;">Exchange Rate</span>
              <span style="display: block; font-size: 15px; font-weight: 600; color: #212529; line-height: 1.3;">1 ${data.source_currency || 'USD'} = ${data.rate || 0} ${data.target_currency || 'USD'}</span>
            </div>
            <div style="background-color: white; padding: 18px 15px; border-radius: 10px; border: 1px solid #e9ecef; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
              <span style="display: block; font-size: 11px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; font-weight: 500;">Status</span>
              <span style="display: block; font-size: 15px; font-weight: 700; color: #28a745; line-height: 1.3;">Successfully Converted</span>
            </div>
          </div>
        `;
      case 'transfer':
        return `
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-top: 20px;">
            <div style="background-color: white; padding: 18px 15px; border-radius: 10px; border: 1px solid #e9ecef; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
              <span style="display: block; font-size: 11px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; font-weight: 500;">Transfer Amount</span>
              <span style="display: block; font-size: 15px; font-weight: 600; color: #212529; line-height: 1.3;">${data.amount || 0} ${data.currency || 'USD'}</span>
            </div>
            <div style="background-color: white; padding: 18px 15px; border-radius: 10px; border: 1px solid #e9ecef; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
              <span style="display: block; font-size: 11px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; font-weight: 500;">From Account</span>
              <span style="display: block; font-size: 15px; font-weight: 600; color: #212529; line-height: 1.3;">${data.source_account || 'Source Account'}</span>
            </div>
            <div style="background-color: white; padding: 18px 15px; border-radius: 10px; border: 1px solid #e9ecef; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
              <span style="display: block; font-size: 11px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; font-weight: 500;">To Account</span>
              <span style="display: block; font-size: 15px; font-weight: 600; color: #212529; line-height: 1.3;">${data.destination_account || 'Destination Account'}</span>
            </div>
            <div style="background-color: white; padding: 18px 15px; border-radius: 10px; border: 1px solid #e9ecef; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
              <span style="display: block; font-size: 11px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; font-weight: 500;">Status</span>
              <span style="display: block; font-size: 15px; font-weight: 700; color: #28a745; line-height: 1.3;">${data.status || 'Successfully Processed'}</span>
            </div>
          </div>
        `;
      default:
        return `
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-top: 20px;">
            <div style="background-color: white; padding: 18px 15px; border-radius: 10px; border: 1px solid #e9ecef; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
              <span style="display: block; font-size: 11px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; font-weight: 500;">Transaction Type</span>
              <span style="display: block; font-size: 15px; font-weight: 600; color: #212529; line-height: 1.3;">${webhook.webhookName}</span>
            </div>
            <div style="background-color: white; padding: 18px 15px; border-radius: 10px; border: 1px solid #e9ecef; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
              <span style="display: block; font-size: 11px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; font-weight: 500;">Status</span>
              <span style="display: block; font-size: 15px; font-weight: 700; color: #28a745; line-height: 1.3;">Successfully Completed</span>
            </div>
          </div>
        `;
    }
  }

  /**
   * Admin notification email content
   */
  private generateAdminNotificationContent(webhook: any, company: any, users: any[], emailAddresses: string[]): string {
    const receivedTime = new Date(webhook.receivedAt).toLocaleString('en-US');
    const currentTime = new Date().toLocaleString('en-US');
    
    // Webhook custom content for admin
    const webhookCustomContent = this.generateCustomWebhookContent(webhook);
    
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
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Transfer to ${payoutData.beneficiary?.bank_details?.account_name || 'Recipient'} is on its way</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8f9fa; color: #333; line-height: 1.6; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; text-align: center; color: white;">
            <h1 style="font-size: 28px; font-weight: 700; margin-bottom: 10px; color: white;">Your transfer to ${payoutData.beneficiary?.bank_details?.account_name || 'Recipient'} is on its way</h1>
            <p style="font-size: 16px; opacity: 0.9; font-weight: 400; margin: 0;">Your transfer should arrive in 0-2 business days</p>
          </div>
          
          <div style="padding: 40px 30px;">
            <p style="font-size: 18px; margin-bottom: 20px; color: #555;">Hi there,</p>
            <p style="font-size: 16px; margin-bottom: 30px; color: #666; line-height: 1.8;">
              Your transfer to <strong>${payoutData.beneficiary?.bank_details?.account_name || 'Recipient'}</strong> should arrive in 0-2 business days from <strong>${payoutData.transfer_date || 'N/A'}</strong>. Here's a summary of this transfer:
            </p>
            
            <div style="background-color: #f8f9fa; border-radius: 12px; padding: 30px; margin-bottom: 30px; border: 1px solid #e9ecef;">
              <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 20px; color: #333;">Transfer Summary</h3>
              
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e9ecef; margin-bottom: 10px;">
                <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Airwallex account</span>
                <span style="font-size: 14px; color: #333; font-weight: 600; text-align: right;">${payoutData.payer?.company_name || 'N/A'}</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e9ecef; margin-bottom: 10px;">
                <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Transfer amount</span>
                <span style="font-size: 14px; color: #333; font-weight: 600; text-align: right;">${payoutData.amount_beneficiary_receives || 0} ${payoutData.transfer_currency || 'USD'}</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e9ecef; margin-bottom: 10px;">
                <span style="font-size: 14px; color: #6c757d; font-weight: 500;">To</span>
                <span style="font-size: 14px; color: #333; font-weight: 600; text-align: right;">${payoutData.beneficiary?.bank_details?.account_name || 'N/A'}</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e9ecef; margin-bottom: 10px;">
                <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Transfer date</span>
                <span style="font-size: 14px; color: #333; font-weight: 600; text-align: right;">${payoutData.transfer_date || 'N/A'}</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e9ecef; margin-bottom: 10px;">
                <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Transfer method</span>
                <span style="font-size: 14px; color: #333; font-weight: 600; text-align: right;">${payoutData.transfer_method || 'BANK_TRANSFER'}</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0;">
                <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Transfer ID</span>
                <span style="font-size: 14px; color: #333; font-weight: 600; text-align: right;">${payoutData.id || 'N/A'}</span>
              </div>
            </div>
            
            <div style="background-color: #f8f9fa; border-radius: 12px; padding: 30px; margin-bottom: 30px; border: 1px solid #e9ecef;">
              <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 20px; color: #333;">Additional Details</h3>
              
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e9ecef; margin-bottom: 10px;">
                <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Reference</span>
                <span style="font-size: 14px; color: #333; font-weight: 600; text-align: right;">${payoutData.reference || 'N/A'}</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e9ecef; margin-bottom: 10px;">
                <span style="font-size: 14px; color: #6c757d; font-weight: 500;">IBAN</span>
                <span style="font-size: 14px; color: #333; font-weight: 600; text-align: right;">•••• ${payoutData.beneficiary?.bank_details?.iban?.slice(-4) || 'N/A'} - ${payoutData.beneficiary?.bank_details?.swift_code || 'N/A'}</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e9ecef; margin-bottom: 10px;">
                <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Bank</span>
                <span style="font-size: 14px; color: #333; font-weight: 600; text-align: right;">${payoutData.beneficiary?.bank_details?.bank_name || 'N/A'}</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0;">
                <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Account Currency</span>
                <span style="font-size: 14px; color: #333; font-weight: 600; text-align: right;">${payoutData.beneficiary?.bank_details?.account_currency || 'N/A'}</span>
              </div>
            </div>
            
            <div style="text-align: center;">
              <a href="#" style="display: inline-block; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; text-align: center; box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);">View Transfer Details</a>
            </div>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
            <p style="font-size: 12px; color: #6c757d; margin: 0;">
              This email was sent by Magna Porta. If you have any questions, please contact our support team.
            </p>
          </div>
        </div>
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
}
