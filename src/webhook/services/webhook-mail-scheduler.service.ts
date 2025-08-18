import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { WebhookService } from '../webhook.service';
import { MailService } from '../../mail/mail.service';
import { CompaniesService } from '../../company/companies.service';

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
  ) {
    // Logo URL'ini environment'dan al, fallback olarak production URL
    this.LOGO_URL = this.configService.get('LOGO_URL', 'http://209.38.223.41:3001/assets/magnaporta-logos/logo_magna_porta.png');
  }

  /**
   * Her dakika çalışır ve mail gönderilmemiş webhook'ları kontrol eder
   */
  @Cron(CronExpression.EVERY_5_SECONDS)
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

    // Webhook name'e göre özelleştirilmiş içerik
    const customContent = this.generateCustomWebhookContent(webhook);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Webhook Bildirimi</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { background-color: #f8f9fa; padding: 15px; border-radius: 5px; }
          .custom-content { background-color: #e3f2fd; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2196f3; }
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
            <img src="http://localhost:3001/assets/magnaporta-logos/logo_magna_porta.png" 
                 alt="Magna Porta" 
                 style="max-width: 200px; height: auto; border-radius: 8px;">
          </div>
          <h2>🚀 New Webhook Notification</h2>
          <p>New webhook received at Magna Porta API</p>
        </div>
        
        ${customContent}
        
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
          <p>Bu mail otomatik olarak gönderilmiştir.</p>
          <p>Magna Porta API - Webhook Notification Service</p>
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
                  <span style="color: #6c757d;">📧 ${user.email}</span><br>
                  <span style="color: ${user.isActive ? '#28a745' : '#dc3545'};">
                    ${user.isActive ? '🟢 Active User' : '🔴 Inactive User'}
                  </span>
                  ${user.phoneNumber ? `<br><span style="color: #6c757d;">📱 ${user.phoneNumber}</span>` : ''}
                </li>
              `).join('')}
            </ul>
          </div>
          <p><strong>Email Addresses:</strong> ${emailAddresses.join(', ')}</p>
        </div>
        
        <div class="data-section">
          <h3>📊 Complete Webhook Data</h3>
          <pre style="background-color: #f8f9fa; padding: 10px; border-radius: 3px; overflow-x: auto; font-size: 12px;">${JSON.stringify(webhook.dataJson, null, 2)}</pre>
        </div>
        
        <div class="footer">
          <p>This email is sent for admin notification purposes.</p>
          <p>Webhook notification has been successfully delivered to ${emailAddresses.length} user(s).</p>
          <p><strong>Delivery Report Generated:</strong> ${currentTime}</p>
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
