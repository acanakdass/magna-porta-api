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
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 0; 
            padding: 0; 
            background-color: #f8f9fa; 
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff; 
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); 
          }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            padding: 50px 20px; 
            text-align: center; 
            color: white; 
            border-radius: 0 0 20px 20px;
          }
          .logo { 
            max-width: 200px; 
            height: auto; 
            margin-bottom: 0; 
            filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
          }
          .content { 
            padding: 40px 30px; 
            background-color: #ffffff; 
          }
          .notification-card { 
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); 
            color: white; 
            padding: 25px; 
            border-radius: 12px; 
            margin: 20px 0; 
            text-align: center; 
          }
          .footer { 
            background-color: #f8f9fa; 
            padding: 30px; 
            text-align: center; 
            color: #6c757d; 
            font-size: 14px; 
          }
          h1 { margin: 0; font-size: 28px; font-weight: 600; }
          h2 { margin: 0 0 15px 0; font-size: 24px; font-weight: 600; }
          p { margin: 0 0 15px 0; line-height: 1.6; }
          .highlight { 
            background-color: #e3f2fd; 
            padding: 20px; 
            border-radius: 8px; 
            border-left: 4px solid #2196f3; 
            margin: 20px 0; 
          }
          .transaction-details {
            background-color: #f8f9fa;
            padding: 30px;
            border-radius: 15px;
            margin: 25px 0;
            border: 1px solid #e9ecef;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          }
          .transaction-details h3 {
            margin: 0 0 20px 0;
            color: #495057;
            font-size: 20px;
            text-align: center;
          }
          .detail-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 12px;
            margin-top: 20px;
          }
          .detail-item {
            background-color: white;
            padding: 18px 15px;
            border-radius: 10px;
            border: 1px solid #e9ecef;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            transition: all 0.2s ease;
          }
          .detail-item:hover {
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            transform: translateY(-2px);
          }
          .detail-label {
            display: block;
            font-size: 11px;
            color: #6c757d;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-bottom: 8px;
            font-weight: 500;
          }
          .detail-value {
            display: block;
            font-size: 15px;
            font-weight: 600;
            color: #212529;
            line-height: 1.3;
          }
          .detail-value.success {
            color: #28a745;
            font-weight: 700;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="${this.LOGO_URL}" 
                 alt="Magna Porta" 
                 class="logo">
          </div>
          
          <div class="content">
            ${this.generateMinimalWebhookContent(webhook)}
            
            <div class="highlight">
              <p><strong>Transaction Time:</strong> ${new Date(webhook.receivedAt).toLocaleString('en-US')}</p>
              <p><strong>Reference No:</strong> ${webhook.webhookId}</p>
            </div>
            
            <div class="transaction-details">
              <h3>📋 Transaction Details</h3>
              ${this.generateTransactionDetails(webhook)}
            </div>
          </div>
          
          <div class="footer">
            <p>This is an automated notification from Magna Porta</p>
            <p>Please do not reply to this email</p>
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
          <div class="field">
            <span class="label">Company:</span>
            <span class="value">${company.name}</span>
          </div>
          <div class="field">
            <span class="label">Company ID:</span>
            <span class="value">${company.id}</span>
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
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { background-color: #fff3cd; padding: 15px; border-radius: 5px; border: 1px solid #ffeaa7; }
          .warning { background-color: #f8d7da; padding: 15px; border-radius: 5px; border: 1px solid #f5c6cb; margin: 15px 0; }
          .content { margin: 20px 0; }
          .field { margin: 10px 0; }
          .label { font-weight: bold; color: #495057; }
          .value { color: #212529; }
          .data-section { background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="${this.LOGO_URL}" 
                 alt="Magna Porta" 
                 style="max-width: 200px; height: auto; border-radius: 8px;">
          </div>
          <h2>⚠️ Fallback Webhook Notification</h2>
          <p>This email has been sent to admin as fallback</p>
        </div>
        
        <div class="warning">
          <h3>🚨 Mail Asıl Alıcıya Gönderilemedi!</h3>
          <p><strong>Sebep:</strong> ${reasonText}</p>
          <p><strong>Account ID:</strong> ${webhook.accountId}</p>
        </div>
        
        <div class="content">
          <div class="field">
            <span class="label">Webhook ID:</span>
            <span class="value">${webhook.webhookId}</span>
          </div>
          
          <div class="field">
            <span class="label">Webhook Name:</span>
            <span class="value">${webhook.webhookName}</span>
          </div>
          
          <div class="field">
            <span class="label">Account ID:</span>
            <span class="value">${webhook.accountId}</span>
          </div>
          
          ${companyInfo}
          
          <div class="field">
            <span class="label">Alınma Zamanı:</span>
            <span class="value">${receivedTime}</span>
          </div>
          
          <div class="field">
            <span class="label">Oluşturulma Zamanı:</span>
            <span class="value">${new Date(webhook.createdAt).toLocaleString('tr-TR')}</span>
          </div>
        </div>
        
        <div class="data-section">
          <h3>📊 Webhook Data</h3>
          <pre style="background-color: #f8f9fa; padding: 10px; border-radius: 3px; overflow-x: auto;">${JSON.stringify(webhook.dataJson, null, 2)}</pre>
        </div>
        
        <div class="footer">
          <p>Bu mail fallback olarak admin'e gönderilmiştir.</p>
          <p>Asıl alıcıya gönderilememe sebebi: ${reasonText}</p>
          <p>Magna Porta API - Webhook Notification Service</p>
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
        return this.generatePaymentReceivedTemplate(data);
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
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f8f9fa;
            color: #333;
            line-height: 1.6;
          }
          
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          
          .header {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            padding: 30px;
            text-align: center;
            color: white;
          }
          
          .logo {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
          }
          
          .logo-icon {
            width: 40px;
            height: 40px;
            background-color: #ff6b35;
            border-radius: 8px;
            margin-right: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            color: white;
          }
          
          .logo-text {
            font-size: 24px;
            font-weight: 700;
            color: white;
          }
          
          .main-heading {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 10px;
            color: white;
          }
          
          .sub-heading {
            font-size: 16px;
            opacity: 0.9;
            font-weight: 400;
          }
          
          .content {
            padding: 40px 30px;
          }
          
          .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: #555;
          }
          
          .description {
            font-size: 16px;
            margin-bottom: 30px;
            color: #666;
            line-height: 1.8;
          }
          
          .summary-box {
            background-color: #f8f9fa;
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 30px;
            border: 1px solid #e9ecef;
          }
          
          .summary-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #333;
          }
          
          .summary-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #e9ecef;
          }
          
          .summary-item:last-child {
            border-bottom: none;
          }
          
          .summary-label {
            font-size: 14px;
            color: #6c757d;
            font-weight: 500;
          }
          
          .summary-value {
            font-size: 14px;
            color: #333;
            font-weight: 600;
            text-align: right;
          }
          
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
          }
          
          .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4);
          }
          
          .footer {
            background-color: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
          }
          
          .footer-text {
            font-size: 12px;
            color: #6c757d;
          }
          
          @media (max-width: 600px) {
            .container {
              margin: 10px;
              border-radius: 8px;
            }
            
            .header, .content {
              padding: 20px;
            }
            
            .main-heading {
              font-size: 24px;
            }
            
            .summary-box {
              padding: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">
              <div class="logo-icon">🏠</div>
              <div class="logo-text">Magna Porta</div>
          </div>
            <h1 class="main-heading">Payment Successfully Received!</h1>
            <p class="sub-heading">Your account has been credited</p>
          </div>
          
          <div class="content">
            <p class="greeting">Hello,</p>
            <p class="description">
              Great news! Your account has received a payment of <strong>${amount} ${currency}</strong>.<br>
              Here's a summary of this transaction:
            </p>
            
            <div class="summary-box">
              <h3 class="summary-title">Transaction Summary</h3>
              
              <div class="summary-item">
                <span class="summary-label">Transaction Type:</span>
                <span class="summary-value">Payment Received</span>
              </div>
              
              <div class="summary-item">
                <span class="summary-label">Amount:</span>
                <span class="summary-value">${amount} ${currency}</span>
              </div>
              
              <div class="summary-item">
                <span class="summary-label">Transaction ID:</span>
                <span class="summary-value">${transactionId}</span>
              </div>
              
              <div class="summary-item">
                <span class="summary-label">Date:</span>
                <span class="summary-value">${date}</span>
              </div>
              
              <div class="summary-item">
                <span class="summary-label">Status:</span>
                <span class="summary-value">✅ Completed</span>
              </div>
            </div>
            
            <div style="text-align: center;">
              <a href="#" class="cta-button">View Transaction</a>
            </div>
          </div>
          
          <div class="footer">
            <p class="footer-text">
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
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f8f9fa;
            color: #333;
            line-height: 1.6;
          }
          
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          
          .header {
            background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
            padding: 30px;
            text-align: center;
            color: white;
          }
          
          .logo {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
          }
          
          .logo-icon {
            width: 40px;
            height: 40px;
            background-color: #ff6b35;
            border-radius: 8px;
            margin-right: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            color: white;
          }
          
          .logo-text {
            font-size: 24px;
            font-weight: 700;
            color: white;
          }
          
          .main-heading {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 10px;
            color: white;
          }
          
          .sub-heading {
            font-size: 16px;
            opacity: 0.9;
            font-weight: 400;
          }
          
          .content {
            padding: 40px 30px;
          }
          
          .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: #555;
          }
          
          .description {
            font-size: 16px;
            margin-bottom: 30px;
            color: #666;
            line-height: 1.8;
          }
          
          .summary-box {
            background-color: #f8f9fa;
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 30px;
            border: 1px solid #e9ecef;
          }
          
          .summary-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #333;
          }
          
          .summary-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #e9ecef;
          }
          
          .summary-item:last-child {
            border-bottom: none;
          }
          
          .summary-label {
            font-size: 14px;
            color: #6c757d;
            font-weight: 500;
          }
          
          .summary-value {
            font-size: 14px;
            color: #333;
            font-weight: 600;
            text-align: right;
          }
          
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(23, 162, 184, 0.3);
          }
          
          .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(23, 162, 184, 0.4);
          }
          
          .footer {
            background-color: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
            margin-top: 20px;
          }
          
          .footer-text {
            font-size: 12px;
            color: #6c757d;
          }
          
          @media (max-width: 600px) {
            .container {
              margin: 10px;
              border-radius: 8px;
            }
            
            .header, .content {
              padding: 20px;
            }
            
            .main-heading {
              font-size: 24px;
            }
            
            .summary-box {
              padding: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">
              <div class="logo-icon">🏠</div>
              <div class="logo-text">Magna Porta</div>
          </div>
            <h1 class="main-heading">Transfer Successfully Completed!</h1>
            <p class="sub-heading">Your transfer has been processed</p>
          </div>
          
          <div class="content">
            <p class="greeting">Hello,</p>
            <p class="description">
              Your transfer of <strong>${amount} ${currency}</strong> has been successfully completed.<br>
              Here's a summary of this transaction:
            </p>
            
            <div class="summary-box">
              <h3 class="summary-title">Transfer Summary</h3>
              
              <div class="summary-item">
                <span class="summary-label">Transfer Type:</span>
                <span class="summary-value">Connected Account Transfer</span>
              </div>
              
              <div class="summary-item">
                <span class="summary-label">Amount:</span>
                <span class="summary-value">${amount} ${currency}</span>
              </div>
              
              <div class="summary-item">
                <span class="summary-label">Transaction ID:</span>
                <span class="summary-value">${transactionId}</span>
              </div>
              
              <div class="summary-item">
                <span class="summary-label">Date:</span>
                <span class="summary-value">${date}</span>
              </div>
              
              <div class="summary-item">
                <span class="summary-label">Status:</span>
                <span class="summary-value">✅ Completed</span>
              </div>
            </div>
            
            <div style="text-align: center;">
              <a href="#" class="cta-button">Transferi Görüntüle</a>
            </div>
          </div>
          
          <div class="footer">
            <p class="footer-text">
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
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f8f9fa;
            color: #333;
            line-height: 1.6;
          }
          
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          
          .header {
            background: linear-gradient(135deg, #6f42c1 0%, #5a32a3 100%);
            padding: 30px;
            text-align: center;
            color: white;
          }
          
          .logo {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
          }
          
          .logo-icon {
            width: 40px;
            height: 40px;
            background-color: #ff6b35;
            border-radius: 8px;
            margin-right: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            color: white;
          }
          
          .logo-text {
            font-size: 24px;
            font-weight: 700;
            color: white;
          }
          
          .main-heading {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 10px;
            color: white;
          }
          
          .sub-heading {
            font-size: 16px;
            opacity: 0.9;
            font-weight: 400;
          }
          
          .content {
            padding: 40px 30px;
          }
          
          .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: #555;
          }
          
          .description {
            font-size: 16px;
            margin-bottom: 30px;
            color: #666;
            line-height: 1.8;
          }
          
          .summary-box {
            background-color: #f8f9fa;
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 30px;
            border: 1px solid #e9ecef;
          }
          
          .summary-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #333;
          }
          
          .summary-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #e9ecef;
            margin-bottom: 10px;
          }
          
          .summary-item:last-child {
            border-bottom: none;
            margin-bottom: 0;
          }
          
          .summary-label {
            font-size: 14px;
            color: #6c757d;
            font-weight: 500;
          }
          
          .summary-value {
            font-size: 14px;
            color: #333;
            font-weight: 600;
            text-align: right;
          }
          
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #6f42c1 0%, #5a32a3 100%);
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(111, 66, 193, 0.3);
          }
          
          .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(111, 66, 193, 0.4);
          }
          
          .footer {
            background-color: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
          }
          
          .footer-text {
            font-size: 12px;
            color: #6c757d;
          }
          
          @media (max-width: 600px) {
            .container {
              margin: 10px;
              border-radius: 8px;
            }
            
            .header, .content {
              padding: 20px;
            }
            
            .main-heading {
              font-size: 24px;
            }
            
            .summary-box {
              padding: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">
              <div class="logo-icon">🏠</div>
              <div class="logo-text">Magna Porta</div>
          </div>
            <h1 class="main-heading">Currency Conversion Completed!</h1>
            <p class="sub-heading">Your conversion has been processed</p>
          </div>
          
          <div class="content">
            <p class="greeting">Hello,</p>
            <p class="description">
              Your currency conversion has been successfully completed.<br>
              Here's a summary of this transaction:
            </p>
            
            <div class="summary-box">
              <h3 class="summary-title">Conversion Summary</h3>
              
              <div class="summary-item">
                <span class="summary-label">Source Amount:</span>
                <span class="summary-value">${sourceAmount} ${sourceCurrency}</span>
              </div>
              
              <div class="summary-item">
                <span class="summary-label">Target Amount:</span>
                <span class="summary-value">${targetAmount} ${targetCurrency}</span>
              </div>
              
              <div class="summary-item">
                <span class="summary-label">Exchange Rate:</span>
                <span class="summary-value">1 ${sourceCurrency} = ${rate} ${targetCurrency}</span>
              </div>
              
              <div class="summary-item">
                <span class="summary-label">Transaction ID:</span>
                <span class="summary-value">${transactionId}</span>
              </div>
              
              <div class="summary-item">
                <span class="summary-label">Date:</span>
                <span class="summary-value">${date}</span>
              </div>
              
              <div class="summary-item">
                <span class="summary-label">Status:</span>
                <span class="summary-value">✅ Completed</span>
              </div>
            </div>
            
            <div style="text-align: center;">
              <a href="#" class="cta-button">View Conversion</a>
            </div>
          </div>
          
          <div class="footer">
            <p class="footer-text">
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
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f8f9fa;
            color: #333;
            line-height: 1.6;
          }
          
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          
          .header {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            padding: 30px;
            text-align: center;
            color: white;
          }
          
          .logo {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
          }
          
          .logo-icon {
            width: 40px;
            height: 40px;
            background-color: #ff6b35;
            border-radius: 8px;
            margin-right: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            color: white;
          }
          
          .logo-text {
            font-size: 24px;
            font-weight: 700;
            color: white;
          }
          
          .main-heading {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 10px;
            color: white;
          }
          
          .sub-heading {
            font-size: 16px;
            opacity: 0.9;
            font-weight: 400;
          }
          
          .content {
            padding: 40px 30px;
          }
          
          .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: #555;
          }
          
          .description {
            font-size: 16px;
            margin-bottom: 30px;
            color: #666;
            line-height: 1.8;
          }
          
          .summary-box {
            background-color: #f8f9fa;
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 30px;
            border: 1px solid #e9ecef;
          }
          
          .summary-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #333;
          }
          
          .summary-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #e9ecef;
            margin-bottom: 10px;
          }
          
          .summary-item:last-child {
            border-bottom: none;
            margin-bottom: 0;
          }
          
          .summary-label {
            font-size: 14px;
            color: #6c757d;
            font-weight: 500;
          }
          
          .summary-value {
            font-size: 14px;
            color: #333;
            font-weight: 600;
            text-align: right;
          }
          
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
          }
          
          .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4);
          }
          
          .footer {
            background-color: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
          }
          
          .footer-text {
            font-size: 12px;
            color: #6c757d;
          }
          
          @media (max-width: 600px) {
            .container {
              margin: 10px;
              border-radius: 8px;
            }
            
            .header, .content {
              padding: 20px;
            }
            
            .main-heading {
              font-size: 24px;
            }
            
            .summary-box {
              padding: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">
              <div class="logo-icon">🏠</div>
              <div class="logo-text">Magna Porta</div>
            </div>
            <h1 class="main-heading">Currency Conversion Settled!</h1>
            <p class="sub-heading">Your conversion has been successfully processed</p>
          </div>
          
          <div class="content">
            <p class="greeting">Hello,</p>
            <p class="description">
              Your currency conversion has been successfully completed and settled.<br>
              Here's a detailed summary of this transaction:
            </p>
            
            <div class="summary-box">
              <h3 class="summary-title">Conversion Transaction Summary</h3>
              
              <div class="summary-item">
                <span class="summary-label">Reference ID:</span>
                <span class="summary-value">${conversionData.shortReferenceId}</span>
              </div>
              
              <div class="summary-item">
                <span class="summary-label">Currency Pair:</span>
                <span class="summary-value">${conversionData.currencyPair}</span>
              </div>
              
              <div class="summary-item">
                <span class="summary-label">Buy Amount:</span>
                <span class="summary-value">${conversionData.buyAmount} ${conversionData.buyCurrency}</span>
              </div>
              
              <div class="summary-item">
                <span class="summary-label">Sell Amount:</span>
                <span class="summary-value">${conversionData.sellAmount} ${conversionData.sellCurrency}</span>
              </div>
              
              <div class="summary-item">
                <span class="summary-label">Client Rate:</span>
                <span class="summary-value">1 ${conversionData.buyCurrency} = ${conversionData.clientRate} ${conversionData.sellCurrency}</span>
              </div>
              
              <div class="summary-item">
                <span class="summary-label">Conversion Date:</span>
                <span class="summary-value">${conversionData.conversionDate}</span>
              </div>
              
              <div class="summary-item">
                <span class="summary-label">Status:</span>
                <span class="summary-value">✅ ${conversionData.status}</span>
              </div>
            </div>
            
            <div style="text-align: center;">
              <a href="#" class="cta-button">View Conversion Details</a>
            </div>
          </div>
          
          <div class="footer">
            <p class="footer-text">
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
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f8f9fa;
            color: #333;
            line-height: 1.6;
          }
          
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          
          .header {
            background: linear-gradient(135deg, #fd7e14 0%, #e55a00 100%);
            padding: 30px;
            text-align: center;
            color: white;
          }
          
          .logo {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
          }
          
          .logo-icon {
            width: 40px;
            height: 40px;
            background-color: #ff6b35;
            border-radius: 8px;
            margin-right: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            color: white;
          }
          
          .logo-text {
            font-size: 24px;
            font-weight: 700;
            color: white;
          }
          
          .main-heading {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 10px;
            color: white;
          }
          
          .sub-heading {
            font-size: 16px;
            opacity: 0.9;
            font-weight: 400;
          }
          
          .content {
            padding: 40px 30px;
          }
          
          .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: #555;
          }
          
          .description {
            font-size: 16px;
            margin-bottom: 30px;
            color: #666;
            line-height: 1.8;
          }
          
          .summary-box {
            background-color: #f8f9fa;
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 30px;
            border: 1px solid #e9ecef;
          }
          
          .summary-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #333;
          }
          
          .summary-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #e9ecef;
          }
          
          .summary-item:last-child {
            border-bottom: none;
          }
          
          .summary-label {
            font-size: 14px;
            color: #6c757d;
            font-weight: 500;
          }
          
          .summary-value {
            font-size: 14px;
            color: #333;
            font-weight: 600;
            text-align: right;
          }
          
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #fd7e14 0%, #e55a00 100%);
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(253, 126, 20, 0.3);
          }
          
          .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(253, 126, 20, 0.4);
          }
          
          .footer {
            background-color: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
          }
          
          .footer-text {
            font-size: 12px;
            color: #6c757d;
          }
          
          @media (max-width: 600px) {
            .container {
              margin: 10px;
              border-radius: 8px;
            }
            
            .header, .content {
              padding: 20px;
            }
            
            .main-heading {
              font-size: 24px;
            }
            
            .summary-box {
              padding: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">
              <div class="logo-icon">🏠</div>
              <div class="logo-text">Magna Porta</div>
          </div>
            <h1 class="main-heading">Transfer Successfully Processed!</h1>
            <p class="sub-heading">Your transfer has been completed</p>
          </div>
          
          <div class="content">
            <p class="greeting">Hello,</p>
            <p class="description">
              Your transfer of <strong>${amount} ${currency}</strong> has been successfully processed.<br>
              Here's a summary of this transaction:
            </p>
            
            <div class="summary-box">
              <h3 class="summary-title">Transfer Summary</h3>
              
              <div class="summary-item">
                <span class="summary-label">Transfer Type:</span>
                <span class="summary-value">General Transfer</span>
              </div>
              
              <div class="summary-item">
                <span class="summary-label">Amount:</span>
                <span class="summary-value">${amount} ${currency}</span>
              </div>
              
              <div class="summary-item">
                <span class="summary-label">Source Account:</span>
                <span class="summary-value">${sourceAccount}</span>
              </div>
              
              <div class="summary-item">
                <span class="summary-label">Destination Account:</span>
                <span class="summary-value">${destinationAccount}</span>
              </div>
              
              <div class="summary-item">
                <span class="summary-label">Transaction ID:</span>
                <span class="summary-value">${transactionId}</span>
              </div>
              
              <div class="summary-item">
                <span class="summary-label">Date:</span>
                <span class="summary-value">${date}</span>
              </div>
              
              <div class="summary-item">
                <span class="summary-label">Status:</span>
                <span class="summary-value">✅ Completed</span>
              </div>
            </div>
            
            <div style="text-align: center;">
              <a href="#" class="cta-button">Transferi Görüntüle</a>
            </div>
          </div>
          
          <div class="footer">
            <p class="footer-text">
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
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f8f9fa;
            color: #333;
            line-height: 1.6;
          }
          
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          
          .header {
            background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
            padding: 30px;
            text-align: center;
            color: white;
          }
          
          .logo {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
          }
          
          .logo-icon {
            width: 40px;
            webhook-mail-scheduler.service.ts
            background-color: #ff6b35;
            border-radius: 8px;
            margin-right: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            color: white;
          }
          
          .logo-text {
            font-size: 24px;
            font-weight: 700;
            color: white;
          }
          
          .main-heading {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 10px;
            color: white;
          }
          
          .sub-heading {
            font-size: 16px;
            opacity: 0.9;
            font-weight: 400;
          }
          
          .content {
            padding: 40px 30px;
          }
          
          .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: #555;
          }
          
          .description {
            font-size: 16px;
            margin-bottom: 30px;
            color: #666;
            line-height: 1.8;
          }
          
          .summary-box {
            background-color: #f8f9fa;
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 30px;
            border: 1px solid #e9ecef;
          }
          
          .summary-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #333;
          }
          
          .summary-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #e9ecef;
          }
          
          .summary-item:last-child {
            border-bottom: none;
          }
          
          .summary-label {
            font-size: 14px;
            color: #6c757d;
            font-weight: 500;
          }
          
          .summary-value {
            font-size: 14px;
            color: #333;
            font-weight: 600;
            text-align: right;
          }
          
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(108, 117, 125, 0.3);
          }
          
          .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(108, 117, 125, 0.4);
          }
          
          .footer {
            background-color: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
          }
          
          .footer-text {
            font-size: 12px;
            color: #6c757d;
          }
          
          @media (max-width: 600px) {
            .container {
              margin: 10px;
              border-radius: 8px;
            }
            
            .header, .content {
              padding: 20px;
            }
            
            .main-heading {
              font-size: 24px;
            }
            
            .summary-box {
              padding: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">
              <div class="logo-icon">🏠</div>
              <div class="logo-text">Magna Porta</div>
          </div>
            <h1 class="main-heading">Account Updated</h1>
            <p class="sub-heading">Your account has been updated</p>
          </div>
          
          <div class="content">
            <p class="greeting">Hello,</p>
            <p class="description">
              Your Magna Porta account has been updated.<br>
              Here's a summary of this update:
            </p>
            
            <div class="summary-box">
              <h3 class="summary-title">Update Summary</h3>
              
              <div class="summary-item">
                <span class="summary-label">Update Type:</span>
                <span class="summary-value">${webhookName}</span>
              </div>
              
              <div class="summary-item">
                <span class="summary-label">Date:</span>
                <span class="summary-value">${date}</span>
              </div>
              
              <div class="summary-item">
                <span class="summary-label">Status:</span>
                <span class="summary-value">✅ Updated</span>
              </div>
            </div>
            
            <div style="text-align: center;">
              <a href="#" class="cta-button">View Details</a>
            </div>
          </div>
          
          <div class="footer">
            <p class="footer-text">
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
        return `
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Amount Received</span>
              <span class="detail-value">${data.amount || 0} ${data.currency || 'USD'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">From Account</span>
              <span class="detail-value">${data.source_account || 'External Source'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">To Account</span>
              <span class="detail-value">Your Main Account</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Reference</span>
              <span class="detail-value">${data.reference || 'N/A'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Status</span>
              <span class="detail-value success">Successfully Received</span>
            </div>
          </div>
        `;
      case 'connected_account_transfer':
        return `
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Transfer Amount</span>
              <span class="detail-value">${data.amount || 0} ${data.currency || 'USD'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">From Account</span>
              <span class="detail-value">${data.source_account || 'Source Account'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">To Account</span>
              <span class="detail-value">${data.destination_account || 'Destination Account'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Status</span>
              <span class="detail-value success">${data.status || 'Completed'}</span>
            </div>
          </div>
        `;
      case 'conversion':
        return `
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Converted From</span>
              <span class="detail-value">${data.source_amount || 0} ${data.source_currency || 'USD'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Converted To</span>
              <span class="detail-value">${data.target_amount || 0} ${data.target_currency || 'USD'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Exchange Rate</span>
              <span class="detail-value">1 ${data.source_currency || 'USD'} = ${data.rate || 0} ${data.target_currency || 'USD'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Status</span>
              <span class="detail-value success">Successfully Converted</span>
            </div>
          </div>
        `;
      case 'transfer':
        return `
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Transfer Amount</span>
              <span class="detail-value">${data.amount || 0} ${data.currency || 'USD'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">From Account</span>
              <span class="detail-value">${data.source_account || 'Source Account'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">To Account</span>
              <span class="detail-value">${data.destination_account || 'Destination Account'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Status</span>
              <span class="detail-value success">${data.status || 'Successfully Processed'}</span>
            </div>
          </div>
        `;
      default:
        return `
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Transaction Type</span>
              <span class="detail-value">${webhook.webhookName}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Status</span>
              <span class="detail-value success">Successfully Completed</span>
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
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { background-color: #d4edda; padding: 15px; border-radius: 5px; border: 1px solid #c3e6cb; }
          .success { background-color: #d1ecf1; padding: 15px; border-radius: 5px; border: 1px solid #bee5eb; margin: 15px 0; }
          .content { margin: 20px 0; }
          .field { margin: 10px 0; }
          .label { font-weight: bold; color: #495057; }
          .value { color: #212529; }
          .users-section { background-color: #e2e3e5; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .webhook-content { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #007bff; }
          .data-section { background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 12px; }
          .stats { display: flex; justify-content: space-between; margin: 15px 0; }
          .stat-box { background-color: #f8f9fa; padding: 10px; border-radius: 5px; text-align: center; flex: 1; margin: 0 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="${this.LOGO_URL}" 
                 alt="Magna Porta" 
                 style="max-width: 200px; height: auto; border-radius: 8px;">
          </div>
          <h2>✅ Webhook Mail Successfully Delivered</h2>
          <p>Webhook notification has been successfully delivered to relevant users</p>
        </div>
        
        <div class="success">
          <h3>📧 Mail Delivery Summary</h3>
          <div class="stats">
            <div class="stat-box">
              <strong>Total Recipients</strong><br>
              <span style="font-size: 24px; color: #28a745;">${emailAddresses.length}</span>
            </div>
            <div class="stat-box">
              <strong>Delivery Time</strong><br>
              <span style="color: #007bff;">${currentTime}</span>
            </div>
            <div class="stat-box">
              <strong>Webhook Type</strong><br>
              <span style="color: #6f42c1;">${webhook.webhookName}</span>
            </div>
          </div>
        </div>
        
        <div class="content">
          <div class="field">
            <span class="label">Webhook ID:</span>
            <span class="value">${webhook.webhookId}</span>
          </div>
          
          <div class="field">
            <span class="label">Webhook Name:</span>
            <span class="value">${webhook.webhookName}</span>
          </div>
          
          <div class="field">
            <span class="label">Account ID:</span>
            <span class="value">${webhook.accountId}</span>
          </div>
          
          <div class="field">
            <span class="label">Company:</span>
            <span class="value">${company.name} (ID: ${company.id})</span>
          </div>
          
          <div class="field">
            <span class="label">Company Status:</span>
            <span class="value">${company.isActive ? '🟢 Active' : '🔴 Inactive'} | ${company.isVerified ? '✅ Verified' : '❌ Not Verified'}</span>
          </div>
          
          <div class="field">
            <span class="label">Received Time:</span>
            <span class="value">${receivedTime}</span>
          </div>
        </div>
        
        <div class="webhook-content">
          <h3>📋 Webhook Content Sent to Users</h3>
          ${webhookCustomContent}
        </div>
        
        <div class="users-section">
          <h3>👥 Users Who Received the Mail</h3>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px;">
            <h4>Recipient Details:</h4>
            <ul style="list-style: none; padding: 0;">
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
        
        <div class="data-section">
          <h3>📊 Full Webhook Data</h3>
          <pre style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; overflow-x: auto; font-size: 12px;">${JSON.stringify(webhook.dataJson, null, 2)}</pre>
        </div>
        
        <div class="footer">
          <p><strong>Mail Delivery Report Generated:</strong> ${currentTime}</p>
          <p><strong>Total Recipients:</strong> ${emailAddresses.length} users</p>
          <p><strong>Company:</strong> ${company.name} (${company.isActive ? 'Active' : 'Inactive'})</p>
          <p>Magna Porta API - Webhook Notification Service</p>
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
