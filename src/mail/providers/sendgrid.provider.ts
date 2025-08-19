import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';
import { MailProvider, MailOptions } from '../interfaces/mail-provider.interface';
import { SentMessageInfo } from 'nodemailer';

@Injectable()
export class SendGridProvider implements MailProvider {
  private readonly logger = new Logger(SendGridProvider.name);
  private isInitialized = false;

  constructor(private configService: ConfigService) {
    this.initialize();
  }

  private initialize() {
    try {
      const apiKey = this.configService.get('SENDGRID_API_KEY');
      if (!apiKey) {
        this.logger.warn('SENDGRID_API_KEY bulunamadı, SendGrid provider devre dışı');
        return;
      }

      sgMail.setApiKey(apiKey);
      this.isInitialized = true;
      this.logger.log('SendGrid provider başarıyla başlatıldı');
    } catch (error) {
      this.logger.error('SendGrid provider başlatılamadı:', error.message);
    }
  }

  async sendMail(mailOptions: MailOptions): Promise<SentMessageInfo> {
    if (!this.isInitialized) {
      throw new Error('SendGrid provider başlatılmamış');
    }

    const maxRetries = 3;
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const defaultFrom = this.configService.get('SENDGRID_FROM_EMAIL', 'noreply@magna-porta.com');
        const senderName = this.configService.get('SENDGRID_SENDER_NAME', 'Magna Porta');
        
        const sgMailData = {
          to: mailOptions.to,
          from: {
            email: mailOptions.from || defaultFrom,
            name: senderName
          },
          subject: mailOptions.subject,
          text: mailOptions.text,
          html: mailOptions.html,
          cc: mailOptions.cc,
          bcc: mailOptions.bcc,
          attachments: mailOptions.attachments?.map(att => ({
            filename: att.filename,
            content: att.content.toString('base64'),
            type: att.contentType || 'application/octet-stream',
            disposition: 'attachment'
          })),
          // Spam prevention headers
          headers: {
            'X-Mailer': 'Magna Porta API',
            'X-Priority': '3',
            'X-MSMail-Priority': 'Normal',
            'Importance': 'Normal',
            'X-Campaign': 'transactional'
          }
        };

        this.logger.log(`SendGrid mail gönderim denemesi ${attempt}/${maxRetries}: ${mailOptions.to}`);
        
        const result = await sgMail.send(sgMailData);
        this.logger.log(`SendGrid mail başarıyla gönderildi: ${mailOptions.to}`);
        
        // Nodemailer SentMessageInfo formatına uygun response oluştur
        const sentMessageInfo: SentMessageInfo = {
          messageId: result[0]?.headers['x-message-id'] || `sg_${Date.now()}`,
          response: 'OK',
          accepted: [mailOptions.to].flat(),
          rejected: [],
          pending: [],
          envelope: {
            from: sgMailData.from.email,
            to: [sgMailData.to].flat()
          }
        };
        
        return sentMessageInfo;
      } catch (error) {
        this.logger.log(`SendGrid mail gönderim denemesi ${attempt}/${maxRetries} başarısız: ${error.message}`);
        lastError = error;
        
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          this.logger.log(`${delay}ms sonra tekrar denenecek...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    this.logger.error(`SendGrid mail gönderilemedi (${maxRetries} deneme sonrası): ${lastError.message}`);
    throw new Error(`SendGrid mail gönderilemedi (${maxRetries} deneme sonrası): ${lastError.message}`);
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

  async sendTransactionalEmail(
    to: string | string[],
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
  ): Promise<SentMessageInfo> {
    const subject = `Your transfer to ${transferData.recipientName} is on its way`;
    
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f8f9fa;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            padding: 30px 40px 20px;
            border-bottom: 1px solid #e9ecef;
          }
          .logo {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 24px;
            font-weight: 600;
            color: #333;
          }
          .logo-icon {
            width: 24px;
            height: 24px;
            background-color: #ff6b35;
            border-radius: 4px;
            position: relative;
          }
          .logo-icon::before {
            content: "🏠";
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 16px;
          }
          .content {
            padding: 40px;
          }
          .headline {
            font-size: 28px;
            font-weight: 700;
            color: #1a1a1a;
            margin: 0 0 20px 0;
            line-height: 1.3;
          }
          .greeting {
            font-size: 16px;
            color: #666;
            margin: 0 0 15px 0;
          }
          .description {
            font-size: 16px;
            color: #666;
            margin: 0 0 30px 0;
          }
          .summary-box {
            background-color: #ffffff;
            border: 1px solid #e9ecef;
            border-radius: 12px;
            padding: 30px;
            margin: 30px 0;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          }
          .summary-title {
            font-size: 18px;
            font-weight: 600;
            color: #1a1a1a;
            margin: 0 0 25px 0;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #f1f3f4;
          }
          .summary-row:last-child {
            border-bottom: none;
          }
          .summary-label {
            font-size: 14px;
            color: #666;
            font-weight: 400;
          }
          .summary-value {
            font-size: 14px;
            color: #1a1a1a;
            font-weight: 600;
            text-align: right;
          }
          .amount {
            font-size: 18px;
            font-weight: 700;
            color: #1a1a1a;
          }
          .footer {
            padding: 30px 40px;
            background-color: #f8f9fa;
            text-align: center;
            border-top: 1px solid #e9ecef;
          }
          .footer-text {
            font-size: 12px;
            color: #999;
            margin: 0;
          }
          @media only screen and (max-width: 600px) {
            .container {
              margin: 0;
              box-shadow: none;
            }
            .header, .content, .footer {
              padding: 20px;
            }
            .headline {
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
              <div class="logo-icon"></div>
              Magna Porta
            </div>
          </div>
          
          <div class="content">
            <h1 class="headline">Your transfer to ${transferData.recipientName} is on its way</h1>
            
            <p class="greeting">Hi there,</p>
            
            <p class="description">
              Your transfer to ${transferData.recipientName} should arrive in ${transferData.businessDays} business days from ${transferData.transferDate}.
            </p>
            
            <p class="description">Here's a summary of this transfer:</p>
            
            <div class="summary-box">
              <h2 class="summary-title">Transfer Summary</h2>
              
              <div class="summary-row">
                <span class="summary-label">Airwallex account:</span>
                <span class="summary-value">${transferData.recipientName}</span>
              </div>
              
              <div class="summary-row">
                <span class="summary-label">Transfer amount:</span>
                <span class="summary-value amount">${transferData.transferAmount} ${transferData.currency}</span>
              </div>
              
              <div class="summary-row">
                <span class="summary-label">To:</span>
                <span class="summary-value">${transferData.recipientName}</span>
              </div>
              
              <div class="summary-row">
                <span class="summary-label">Transfer date:</span>
                <span class="summary-value">${transferData.transferDate}</span>
              </div>
              
              <div class="summary-row">
                <span class="summary-label">Transfer method:</span>
                <span class="summary-value">${transferData.transferMethod}</span>
              </div>
              
              <div class="summary-row">
                <span class="summary-label">Transfer ID:</span>
                <span class="summary-value">${transferData.transferId}</span>
              </div>
              
              <div class="summary-row">
                <span class="summary-label">Reference:</span>
                <span class="summary-value">${transferData.reference}</span>
              </div>
              
              <div class="summary-row">
                <span class="summary-label">IBAN:</span>
                <span class="summary-value">.... ${transferData.iban}</span>
              </div>
            </div>
          </div>
          
          <div class="footer">
            <p class="footer-text">Magna Porta - Secure Financial Transfers</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendMail({ to, subject, html });
  }

  async checkStatus(): Promise<{ status: string; message: string; details?: any }> {
    try {
      if (!this.isInitialized) {
        return { status: 'error', message: 'SendGrid provider başlatılmamış' };
      }

      // SendGrid API key'in geçerli olup olmadığını kontrol et
      const apiKey = this.configService.get('SENDGRID_API_KEY');
      if (!apiKey) {
        return { status: 'error', message: 'SENDGRID_API_KEY bulunamadı' };
      }

      return { status: 'success', message: 'SendGrid provider aktif' };
    } catch (error) {
      return { 
        status: 'error', 
        message: 'SendGrid provider durumu kontrol edilemedi',
        details: error.message 
      };
    }
  }
}