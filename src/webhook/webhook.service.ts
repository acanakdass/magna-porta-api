import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Webhook } from '../entities/webhook.entity';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { WebhookDataParserService } from './services/webhook-data-parser.service';
import { WebhookMailSchedulerService } from './services/webhook-mail-scheduler.service';
import { WebhookTemplateService } from './services/webhook-template.service';
import { MailService } from '../mail/mail.service';
import { PaginationDto, PaginatedResponseDto } from '../common/models/pagination-dto';
import { BaseApiResponse } from '../common/dto/api-response-dto';
import { CompaniesService } from '../company/companies.service';

@Injectable()
export class WebhookService {
  constructor(
    @InjectRepository(Webhook)
    private webhookRepository: Repository<Webhook>,
    private webhookDataParserService: WebhookDataParserService,
    private readonly templateService: WebhookTemplateService,
    private readonly mailService: MailService,
    private readonly companiesService: CompaniesService,
  ) {}

  async createWebhook(createWebhookDto: CreateWebhookDto): Promise<Webhook> {
    const webhook = new Webhook();
    webhook.accountId = createWebhookDto.account_id;
    webhook.createdAt = new Date(createWebhookDto.created_at);
    webhook.dataJson = createWebhookDto.data;
    webhook.webhookId = createWebhookDto.id;
    webhook.webhookName = createWebhookDto.name;

    return await this.webhookRepository.save(webhook);
  }

  async findAll(): Promise<Webhook[]> {
    return await this.webhookRepository.find({
      order: { receivedAt: 'DESC' },
    });
  }

  async findAllPaginated(query: PaginationDto & { webhookName?: string; accountId?: string }): Promise<PaginatedResponseDto<Webhook>> {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 10, 100);
    const skip = (page - 1) * limit;
    const orderBy = query.orderBy || 'receivedAt';
    const order = (query.order as any) || 'DESC';

    const qb = this.webhookRepository.createQueryBuilder('wh')
      .orderBy(`wh.${orderBy}`, order)
      .skip(skip)
      .take(limit);

    if (query.webhookName) qb.andWhere('wh.webhookName = :webhookName', { webhookName: query.webhookName });
    if (query.accountId) qb.andWhere('wh.accountId = :accountId', { accountId: query.accountId });

    const [rows, total] = await qb.getManyAndCount();
    return {
      data: rows,
      meta: {
        totalItems: total,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  async findById(id: number): Promise<Webhook> {
    return await this.webhookRepository.findOne({ where: { id } });
  }

  async findByWebhookId(webhookId: string): Promise<Webhook> {
    return await this.webhookRepository.findOne({ where: { webhookId } });
  }

  async findByAccountId(accountId: string): Promise<Webhook[]> {
    return await this.webhookRepository.find({
      where: { accountId },
      order: { receivedAt: 'DESC' },
    });
  }

  async findByWebhookName(webhookName: string): Promise<Webhook[]> {
    return await this.webhookRepository.find({
      where: { webhookName },
      order: { receivedAt: 'DESC' },
    });
  }

  /**
   * Webhook'ları parsed data ile birlikte getirir
   */
  async findParsedWebhooks(webhookName?: string): Promise<any[]> {
    let webhooks: Webhook[];
    
    if (webhookName) {
      webhooks = await this.findByWebhookName(webhookName);
    } else {
      webhooks = await this.findAll();
    }

    return webhooks.map(webhook => ({
      id: webhook.id,
      accountId: webhook.accountId,
      createdAt: webhook.createdAt,
      webhookId: webhook.webhookId,
      webhookName: webhook.webhookName,
      receivedAt: webhook.receivedAt,
      updatedAt: webhook.updatedAt,
      parsedData: this.webhookDataParserService.parseWebhookData(
        webhook.webhookName,
        webhook.dataJson
      )
    }));
  }

  async findParsedWebhooksPaginated(query: PaginationDto & { webhookName?: string; accountId?: string }): Promise<PaginatedResponseDto<any>> {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 10, 100);
    const skip = (page - 1) * limit;
    const orderBy = query.orderBy || 'receivedAt';
    const order = (query.order as any) || 'DESC';

    const qb = this.webhookRepository.createQueryBuilder('wh')
      .orderBy(`wh.${orderBy}`, order)
      .skip(skip)
      .take(limit);

    if (query.webhookName) qb.andWhere('wh.webhookName = :webhookName', { webhookName: query.webhookName });
    if (query.accountId) qb.andWhere('wh.accountId = :accountId', { accountId: query.accountId });

    const [rows, total] = await qb.getManyAndCount();
    const parsed = rows.map(webhook => ({
      id: webhook.id,
      accountId: webhook.accountId,
      createdAt: webhook.createdAt,
      webhookId: webhook.webhookId,
      webhookName: webhook.webhookName,
      receivedAt: webhook.receivedAt,
      updatedAt: webhook.updatedAt,
      parsedData: this.webhookDataParserService.parseWebhookData(
        webhook.webhookName,
        webhook.dataJson
      )
    }));

    return {
      data: parsed,
      meta: {
        totalItems: total,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  /**
   * Belirli bir webhook'u parsed data ile birlikte getirir
   */
  async findParsedWebhookById(id: number): Promise<any> {
    const webhook = await this.findById(id);
    if (!webhook) return null;

    return {
      id: webhook.id,
      accountId: webhook.accountId,
      createdAt: webhook.createdAt,
      webhookId: webhook.webhookId,
      webhookName: webhook.webhookName,
      receivedAt: webhook.receivedAt,
      updatedAt: webhook.updatedAt,
      parsedData: this.webhookDataParserService.parseWebhookData(
        webhook.webhookName,
        webhook.dataJson
      )
    };
  }

  /**
   * Belirli bir webhook name için parsed data'ları getirir
   */
  async findParsedWebhooksByName(webhookName: string): Promise<any[]> {
    const webhooks = await this.findByWebhookName(webhookName);
    
    return webhooks.map(webhook => ({
      id: webhook.id,
      accountId: webhook.accountId,
      createdAt: webhook.createdAt,
      webhookId: webhook.webhookId,
      webhookName: webhook.webhookName,
      receivedAt: webhook.receivedAt,
      updatedAt: webhook.updatedAt,
      parsedData: this.webhookDataParserService.parseWebhookData(
        webhook.webhookName,
        webhook.dataJson
      )
    }));
  }

  /**
   * Mail gönderilmemiş webhook'ları getirir
   */
  async findUnsentMailWebhooks(): Promise<Webhook[]> {
    return await this.webhookRepository.find({
      where: { isMailSent: false },
      order: { receivedAt: 'ASC' },
    });
  }

  /**
   * Webhook'un mail gönderildi olarak işaretler
   */
  async markMailAsSent(webhookId: number): Promise<void> {
    await this.webhookRepository.update(webhookId, { isMailSent: true });
  }

  async sendWebhookEmail(webhookId: number, to: string | string[], locale = 'en'): Promise<{ subject: string; html: string; recipients: string[] }> {
    const webhook = await this.findById(webhookId);
    console.log('webhook', webhook);
    if (!webhook) throw new Error('Webhook not found');

    const { subject, html } = await this.templateService.renderTemplateByEvent(
      webhook.webhookName,
      'email',
      locale,
      webhook.dataJson,
    );

    const recipients = Array.isArray(to) ? to : [to];
    await this.mailService.sendHtmlMail(recipients, subject || 'Notification', html);
    return { subject: subject || 'Notification', html, recipients };
  }

  async sendWebhookEmailById(webhookId: number): Promise<BaseApiResponse<{ subject: string; html: string; recipients: string[] }>> {
    try {
      // Webhook'u bul
      const webhook = await this.webhookRepository.findOne({
        where: { id: webhookId }
      });

      if (!webhook) {
        return {
          success: false,
          data: null,
          message: 'Webhook not found',
          loading: false
        };
      }

      // Company'yi bul (account ID ile)
      const company = await this.companiesService.findByAirwallexAccountId(webhook.accountId);
      
      if (!company) {
        return {
          success: false,
          data: null,
          message: 'Company not found for this webhook',
          loading: false
        };
      }

      // Company'nin aktif user'larını al
      const activeUsers = company.users?.filter(user => user.isActive) || [];
      
      if (activeUsers.length === 0) {
        return {
          success: false,
          data: null,
          message: 'No active users found for this company',
          loading: false
        };
      }

      // User email'lerini al
      const recipientEmails = activeUsers.map(user => user.email);

      // Template'i render et
      let subject = this.generateWebhookSubject(webhook.webhookName);
      let htmlContent: string;
      
      try {
        const rendered = await this.templateService.renderTemplateByEvent(
          webhook.webhookName,
          'email',
          'en',
          webhook.dataJson,
        );
        subject = rendered.subject || subject;
        htmlContent = rendered.html;
        
        // Override kontrolü - webhook'ta override varsa kullan, yoksa template'den al
        htmlContent = this.applySubtextOverrides(htmlContent, webhook.overriddenSubtext1, webhook.overriddenSubtext2);
      } catch (error) {
        // Fallback content
        htmlContent = this.generateWebhookEmailContent(webhook, company);
      }

      // Mail gönder
      await this.mailService.sendHtmlMail(recipientEmails, subject, htmlContent);

      // Webhook'u mail gönderildi olarak işaretle
      webhook.isMailSent = true;
      await this.webhookRepository.save(webhook);

      return {
        success: true,
        data: {
          subject: subject,
          html: htmlContent,
          recipients: recipientEmails
        },
        message: `Webhook email sent to ${recipientEmails.length} recipients`,
        loading: false
      };

    } catch (error) {
      console.error('Error in sendWebhookEmailById:', error);
      return {
        success: false,
        data: null,
        message: `Failed to send webhook email: ${error.message}`,
        loading: false
      };
    }
  }

  private generateWebhookSubject(webhookName: string): string {
    const eventMap: { [key: string]: string } = {
      'payout.transfer.funding.funded': 'Transfer Funded',
      'payout.transfer.settled': 'Transfer Settled',
      'payout.transfer.failed': 'Transfer Failed',
      'conversion.settled': 'Conversion Settled',
      'conversion.completed': 'Conversion Completed',
      'account.activated': 'Account Activated',
      'account.deactivated': 'Account Deactivated'
    };
    
    return eventMap[webhookName] || `Webhook: ${webhookName}`;
  }

  async previewWebhookEmail(webhookId: number): Promise<BaseApiResponse<{ subject: string; html: string; company: any; recipients: string[] }>> {
    try {
      // Webhook'u bul
      const webhook = await this.webhookRepository.findOne({
        where: { id: webhookId }
      });

      if (!webhook) {
        return {
          success: false,
          data: null,
          message: 'Webhook not found',
          loading: false
        };
      }

      // Company'yi bul (account ID ile)
      const company = await this.companiesService.findByAirwallexAccountId(webhook.accountId);
      
      if (!company) {
        return {
          success: false,
          data: null,
          message: 'Company not found for this webhook',
          loading: false
        };
      }

      // Template'i render et
      let subject = this.generateWebhookSubject(webhook.webhookName);
      let htmlContent: string;
      
      try {
        const rendered = await this.templateService.renderTemplateByEvent(
          webhook.webhookName,
          'email',
          'en',
          webhook.dataJson,
        );
        subject = rendered.subject || subject;
        htmlContent = rendered.html;
        
        // Override kontrolü - webhook'ta override varsa kullan, yoksa template'den al
        htmlContent = this.applySubtextOverrides(htmlContent, webhook.overriddenSubtext1, webhook.overriddenSubtext2);
      } catch (error) {
        // Fallback content
        htmlContent = this.generateWebhookEmailContent(webhook, company);
      }

      // Company'nin aktif user'larını al
      const activeUsers = company.users?.filter(user => user.isActive) || [];
      const recipientEmails = activeUsers.map(user => user.email);

      return {
        success: true,
        data: {
          subject,
          html: htmlContent,
          company: {
            id: company.id,
            name: company.name,
            airwallex_account_id: company.airwallex_account_id
          },
          recipients: recipientEmails
        },
        message: 'Webhook email preview generated successfully',
        loading: false
      };

    } catch (error) {
      console.error('Error in previewWebhookEmail:', error);
      return {
        success: false,
        data: null,
        message: `Failed to generate webhook email preview: ${error.message}`,
        loading: false
      };
    }
  }

  private generateWebhookEmailContent(webhook: Webhook, company: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Webhook Notification</h2>
        <p><strong>Company:</strong> ${company.name}</p>
        <p><strong>Event:</strong> ${webhook.webhookName}</p>
        <p><strong>Account ID:</strong> ${webhook.accountId}</p>
        <p><strong>Received At:</strong> ${webhook.receivedAt}</p>
        <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0;">
          <h3>Webhook Data:</h3>
          <pre style="white-space: pre-wrap; font-size: 12px;">${JSON.stringify(webhook.dataJson, null, 2)}</pre>
        </div>
      </div>
    `;
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

  /**
   * Webhook'un subtext override'larını günceller
   */
  async updateWebhookOverrides(
    webhookId: number, 
    overriddenSubtext1?: string, 
    overriddenSubtext2?: string
  ): Promise<BaseApiResponse<Webhook>> {
    try {
      const webhook = await this.webhookRepository.findOne({
        where: { id: webhookId }
      });

      if (!webhook) {
        return {
          success: false,
          data: null,
          message: 'Webhook not found',
          loading: false
        };
      }

      // Override'ları güncelle
      webhook.overriddenSubtext1 = overriddenSubtext1;
      webhook.overriddenSubtext2 = overriddenSubtext2;

      const updatedWebhook = await this.webhookRepository.save(webhook);

      return {
        success: true,
        data: updatedWebhook,
        message: 'Webhook overrides updated successfully',
        loading: false
      };

    } catch (error) {
      console.error('Error in updateWebhookOverrides:', error);
      return {
        success: false,
        data: null,
        message: `Failed to update webhook overrides: ${error.message}`,
        loading: false
      };
    }
  }
}
