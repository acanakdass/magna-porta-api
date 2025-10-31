import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { WebhookTemplate } from '../../entities/webhook-template.entity';
import { WebhookEventType } from '../../entities/webhook-event-type.entity';
import { PaginationDto, PaginatedResponseDto } from '../../common/models/pagination-dto';
import { UpsertTemplateDto } from '../dto/upsert-template.dto';

// moved to dto file

@Injectable()
export class WebhookTemplateService {
  private readonly LOGO_URL: string;
  private readonly PROGRESS_BAR_IMAGE_URL: string;
  // Registry for custom, highly-styled renderers by event name
  private readonly customRenderers: Record<string, (data: any, locale?: string) => { subject: string; html: string }> = {};

  constructor(
    @InjectRepository(WebhookTemplate)
    private readonly templateRepo: Repository<WebhookTemplate>,
    @InjectRepository(WebhookEventType)
    private readonly eventTypeRepo: Repository<WebhookEventType>,
    private readonly configService: ConfigService,
  ) {
    this.LOGO_URL = this.configService.get('LOGO_URL', 'http://localhost:3001/assets/magnaporta-logos/logo_magna_porta.png');
    this.PROGRESS_BAR_IMAGE_URL = this.configService.get('PROGRESS_BAR_IMAGE_URL', 'http://localhost:3001/assets/progress-bar-account-active.png');
    // Register custom renderers here
    this.customRenderers['account.active'] = (data: any, locale?: string) => this.renderAccountActiveCustom(data, locale);
  }

  async ensureEventType(eventName: string, description?: string): Promise<WebhookEventType> {
    let eventType = await this.eventTypeRepo.findOne({ where: { eventName } });
    if (!eventType) {
      eventType = this.eventTypeRepo.create({ eventName, description });
      eventType = await this.eventTypeRepo.save(eventType);
    }
    return eventType;
  }

  // upsert removed per request

  async createTemplate(dto: UpsertTemplateDto): Promise<WebhookTemplate> {
    const eventType = await this.ensureEventType(dto.eventName);
    const exists = await this.templateRepo.findOne({ where: { eventType: { id: eventType.id }, channel: dto.channel, locale: dto.locale ?? 'en' }, relations: ['eventType'] });
    if (exists) {
      throw new BadRequestException('Template already exists for this eventName + channel + locale');
    }
    const template = this.templateRepo.create({
      eventType,
      channel: dto.channel,
      locale: dto.locale ?? 'en',
      subject: dto.subject,
      header: dto.header,
      subtext1: dto.subtext1,
      subtext2: dto.subtext2,
      mainColor: dto.mainColor,
      body: dto.body,
      isActive: dto.isActive ?? true,
      autoSendMail: dto.autoSendMail ?? false,
      tableRowsJson: dto.tableRowsJson,
    });
    return this.templateRepo.save(template);
  }

  async updateTemplate(id: number, dto: Partial<UpsertTemplateDto>): Promise<WebhookTemplate> {
    const template = await this.templateRepo.findOne({ where: { id }, relations: ['eventType'] });
    if (!template) throw new NotFoundException('Template not found');

    // Eğer eventName/channel/locale değiştirilecekse, çakışmayı kontrol et
    if (dto.eventName || dto.channel || dto.locale) {
      const eventType = dto.eventName ? await this.ensureEventType(dto.eventName) : template.eventType;
      const channel = dto.channel ?? template.channel;
      const locale = dto.locale ?? template.locale;
      const conflict = await this.templateRepo.findOne({ where: { eventType: { id: eventType.id }, channel, locale } });
      if (conflict && conflict.id !== template.id) {
        throw new BadRequestException('Another template already exists with the same eventName + channel + locale');
      }
      template.eventType = eventType;
      template.channel = channel as any;
      template.locale = locale;
    }

    if (dto.subject !== undefined) template.subject = dto.subject;
    if (dto.header !== undefined) template.header = dto.header;
    if (dto.subtext1 !== undefined) template.subtext1 = dto.subtext1;
    if (dto.subtext2 !== undefined) template.subtext2 = dto.subtext2;
    if (dto.mainColor !== undefined) template.mainColor = dto.mainColor;
    if (dto.body !== undefined) template.body = dto.body;
    if (dto.isActive !== undefined) template.isActive = dto.isActive;
    if (dto.autoSendMail !== undefined) template.autoSendMail = dto.autoSendMail;
    if (dto.tableRowsJson !== undefined) template.tableRowsJson = dto.tableRowsJson as any;

    return this.templateRepo.save(template);
  }

  async findOne(eventName: string, channel: WebhookTemplate['channel'], locale = 'en'): Promise<WebhookTemplate | null> {
    const eventType = await this.eventTypeRepo.findOne({ where: { eventName } });
    if (!eventType) return null;
    return this.templateRepo.findOne({ where: { eventType: { id: eventType.id }, channel, locale }, relations: ['eventType'] });
  }

  async listAll(): Promise<WebhookTemplate[]> {
    return this.templateRepo.find({ relations: ['eventType'] });
  }

  async listPaginated(pagination: PaginationDto & { eventName?: string; channel?: 'email' | 'web' | 'slack' | 'internal'; locale?: string }): Promise<PaginatedResponseDto<WebhookTemplate>> {
    const page = Number(pagination.page) || 1;
    const limit = Math.min(Number(pagination.limit) || 10, 100);
    const skip = (page - 1) * limit;

    const qb = this.templateRepo.createQueryBuilder('tpl')
      .leftJoinAndSelect('tpl.eventType', 'eventType')
      .orderBy(`tpl.${pagination.orderBy || 'createdAt'}`, (pagination.order as any) || 'DESC')
      .skip(skip)
      .take(limit);

    if (pagination.eventName) qb.andWhere('eventType.eventName = :eventName', { eventName: pagination.eventName });
    if (pagination.channel) qb.andWhere('tpl.channel = :channel', { channel: pagination.channel });
    if (pagination.locale) qb.andWhere('tpl.locale = :locale', { locale: pagination.locale });

    const [items, total] = await qb.getManyAndCount();
    return {
      data: items,
      meta: {
        totalItems: total,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  async remove(id: number): Promise<void> {
    const template = await this.templateRepo.findOne({ where: { id } });
    if (!template) throw new NotFoundException('Template not found');
    await this.templateRepo.remove(template);
  }

  async findById(id: number): Promise<WebhookTemplate | null> {
    return this.templateRepo.findOne({ where: { id }, relations: ['eventType'] });
  }

  async seedDefaults(): Promise<{ created: number; updated: number }> {
    const seeds: UpsertTemplateDto[] = [
      {
        eventName: 'conversion.settled',
        channel: 'email',
        locale: 'en',
        subject: 'Your conversion has settled',
        body: '<h2>Conversion Settled</h2><p>Short Ref: {{shortReferenceId}}</p><p>Status: {{status}}</p>',
        isActive: true,
        autoSendMail: false,
      },
      {
        eventName: 'global_account.active',
        channel: 'email',
        locale: 'en',
        subject: 'Your global account is active',
        body: '<h2>Account Active</h2><p>Account: {{airwallexAccount}}</p><p>IBAN: {{iban}}</p>',
        isActive: true,
        autoSendMail: false,
      },
      {
        eventName: 'payout.transfer.funding.funded',
        channel: 'email',
        locale: 'en',
        subject: 'Your payout has been funded',
        body: '<h2>Payout Funded</h2><p>Amount: {{amount_payer_pays.amount}} {{amount_payer_pays.currency}}</p><p>Status: {{status}}</p>',
        isActive: true,
        autoSendMail: false,
      },
    ];

    let created = 0;
    let updated = 0;
    for (const dto of seeds) {
      const before = await this.findOne(dto.eventName, dto.channel, dto.locale ?? 'en');
      await this.createTemplate(dto).catch(async (e) => {
        if (e?.message?.includes('already exists')) {
          // try update by fetching existing and updating
          const existing = await this.findOne(dto.eventName, dto.channel, dto.locale ?? 'en');
          if (existing) {
            await this.updateTemplate(existing.id, dto);
          }
        } else {
          throw e;
        }
      });
      if (before) updated++; else created++;
    }
    return { created, updated };
  }

  private formatMoneyAmount(value: any): string {
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    
    // European format: thousand separator dot, decimal separator comma
    return num.toLocaleString('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  private resolvePlaceholders(input: string, data: any): string {
    if (!input) return '';
    
    // Handle money_amount format: {{field_name:money_amount}}
    return input.replace(/\{\{\s*([\w\.]+):money_amount\s*\}\}/g, (_m, path) => {
      const parts = String(path).split('.');
      let value: any = data;
      for (const p of parts) {
        if (value && Object.prototype.hasOwnProperty.call(value, p)) {
          value = value[p];
        } else {
          value = '';
          break;
        }
      }
      return this.formatMoneyAmount(value ?? '');
    }).replace(/\{\{\s*([\w\.]+)\s*\}\}/g, (_m, path) => {
      const parts = String(path).split('.');
      let value: any = data;
      for (const p of parts) {
        if (value && Object.prototype.hasOwnProperty.call(value, p)) {
          value = value[p];
        } else {
          value = '';
          break;
        }
      }
      return value ?? '';
    });
  }

  async renderTemplateById(id: number, data: any = {}, overriddenSubtext1?: string, overriddenSubtext2?: string): Promise<{ subject: string; html: string }> {
    const tpl = await this.templateRepo.findOne({ where: { id }, relations: ['eventType'] });
    if (!tpl) throw new NotFoundException('Template not found');

    const subject = this.resolvePlaceholders(tpl.subject || '', data);
    const header = this.resolvePlaceholders(tpl.header || '', data);
    // Use override if provided, otherwise use template's subtext1
    const sub1 = (overriddenSubtext1 && overriddenSubtext1.trim()) 
      ? this.resolvePlaceholders(overriddenSubtext1, data)
      : this.resolvePlaceholders(tpl.subtext1 || '', data);
    // Use override if provided, otherwise use template's subtext2
    const sub2 = (overriddenSubtext2 && overriddenSubtext2.trim()) 
      ? this.resolvePlaceholders(overriddenSubtext2, data)
      : this.resolvePlaceholders(tpl.subtext2 || '', data);
    const bodyHtml = this.resolvePlaceholders(tpl.body || '', data);
    const mainColor = (tpl.mainColor && tpl.mainColor.trim()) || '#667eea';

    const rows = (tpl.tableRowsJson || []).map(r => ({
      key: this.resolvePlaceholders(r.key, data),
      value: this.resolvePlaceholders(r.value, data),
    }));

    // Table-based structure to prevent Gmail clipping
    const rowsHtml = rows.map(r => `<tr><td style="padding:12px 0;border-bottom:1px solid #e9ecef;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="font-size:13px;color:#6c757d;font-weight:500;padding-bottom:4px;">${r.key}</td></tr><tr><td style="font-size:15px;color:#333;font-weight:600;">${r.value}</td></tr></table></td></tr>`).join('');
    
    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>${subject || 'Preview'}</title></head><body style="margin:0;padding:0;background-color:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#333;line-height:1.6;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8f9fa;"><tr><td align="center" style="padding:20px 0;"><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#fff;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,.1);max-width:600px;"><tr><td style="padding:30px;background-color:#fff;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="text-align:left;padding-bottom:16px;"><img src="${this.LOGO_URL}" alt="Magna Porta" style="max-width:220px;height:auto;border:0;display:block;"/></td></tr><tr><td style="text-align:left;"><h1 style="color:${mainColor};text-align:left;font-size:26px;font-weight:600;line-height:1.3;margin:0 0 20px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">${header}</h1>${sub1?`<p style="color:#6c757d;margin:0 0 16px 0;text-align:left;font-size:16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">${sub1}</p>`:''}${sub2?`<p style="color:#6c757d;margin:0;text-align:left;font-size:15px;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">${sub2}</p>`:''}</td></tr></table></td></tr><tr><td style="padding:0 30px 30px 30px;background-color:#fff;">${bodyHtml?`<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">${bodyHtml}</div>`:''}${rows.length?`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:transparent;border-radius:8px;padding:15px;border:1px solid #e9ecef;margin-top:15px;"><tbody>${rowsHtml}</tbody></table>`:''}</td></tr><tr><td style="padding:20px 30px;background-color:#f8f9fa;text-align:center;border-top:1px solid #e9ecef;"><p style="font-size:12px;color:#6c757d;margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">This email was sent by Magna Porta. Please do not reply.</p></td></tr></table></td></tr></table></body></html>`;

    return { subject, html };
  }

  async renderTemplateByEvent(eventName: string, channel: WebhookTemplate['channel'] = 'email', locale = 'en', rawData: any = {}, overriddenSubtext1?: string, overriddenSubtext2?: string): Promise<{ subject: string; html: string }> {
    // 1) Try custom hook first
    const custom = this.renderCustomIfAvailable(eventName, rawData, locale);
    if (custom) return custom;

    const eventType = await this.eventTypeRepo.findOne({ where: { eventName } });
    if (!eventType) {
      // Fallback: Event type not found, use default template
      return this.generateDefaultFallbackTemplate(eventName, rawData);
    }
    
    const tpl = await this.templateRepo.findOne({ where: { eventType: { id: eventType.id }, channel, locale }, relations: ['eventType'] });
    if (!tpl) {
      // Fallback: Template not found, use default template
      return this.generateDefaultFallbackTemplate(eventName, rawData);
    }

    // Raw data'yı direkt kullan, parse etme
    const parsed = rawData;

    // reuse rendering by id logic by faking template fetch path
    // Duplicate minimal part to avoid extra query
    const subject = this.resolvePlaceholders(tpl.subject || '', parsed);
    const header = this.resolvePlaceholders(tpl.header || '', parsed);
    // Use override if provided, otherwise use template's subtext1
    const sub1 = (overriddenSubtext1 && overriddenSubtext1.trim()) 
      ? this.resolvePlaceholders(overriddenSubtext1, parsed)
      : this.resolvePlaceholders(tpl.subtext1 || '', parsed);
    // Use override if provided, otherwise use template's subtext2
    const sub2 = (overriddenSubtext2 && overriddenSubtext2.trim()) 
      ? this.resolvePlaceholders(overriddenSubtext2, parsed)
      : this.resolvePlaceholders(tpl.subtext2 || '', parsed);
    const bodyHtml = this.resolvePlaceholders(tpl.body || '', parsed);
    const mainColor = (tpl.mainColor && tpl.mainColor.trim()) || '#667eea';
    const rows = (tpl.tableRowsJson || []).map(r => ({
      key: this.resolvePlaceholders(r.key, parsed),
      value: this.resolvePlaceholders(r.value, parsed),
    }));
    // Table-based structure to prevent Gmail clipping
    const rowsHtml = rows.map(r => `<tr><td style="padding:12px 0;border-bottom:1px solid #e9ecef;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="font-size:13px;color:#6c757d;font-weight:500;padding-bottom:4px;">${r.key}</td></tr><tr><td style="font-size:15px;color:#333;font-weight:600;">${r.value}</td></tr></table></td></tr>`).join('');
    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>${subject || 'Preview'}</title></head><body style="margin:0;padding:0;background-color:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#333;line-height:1.6;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8f9fa;"><tr><td align="center" style="padding:20px 0;"><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#fff;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,.1);max-width:600px;"><tr><td style="padding:30px;background-color:#fff;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="text-align:left;padding-bottom:16px;"><img src="${this.LOGO_URL}" alt="Magna Porta" style="max-width:220px;height:auto;border:0;display:block;"/></td></tr><tr><td style="text-align:left;"><h1 style="color:${mainColor};text-align:left;font-size:26px;font-weight:600;line-height:1.3;margin:0 0 20px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">${header}</h1>${sub1?`<p style="color:#6c757d;margin:0 0 16px 0;text-align:left;font-size:16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">${sub1}</p>`:''}${sub2?`<p style="color:#6c757d;margin:0;text-align:left;font-size:15px;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">${sub2}</p>`:''}</td></tr></table></td></tr><tr><td style="padding:0 30px 30px 30px;background-color:#fff;">${bodyHtml?`<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">${bodyHtml}</div>`:''}${rows.length?`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:transparent;border-radius:8px;padding:15px;border:1px solid #e9ecef;margin-top:15px;"><tbody>${rowsHtml}</tbody></table>`:''}</td></tr><tr><td style="padding:20px 30px;background-color:#f8f9fa;text-align:center;border-top:1px solid #e9ecef;"><p style="font-size:12px;color:#6c757d;margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">This email was sent by Magna Porta. Please do not reply.</p></td></tr></table></td></tr></table></body></html>`;
    return { subject, html };
  }

  // Return custom-rendered email if a custom hook exists for the event
  private renderCustomIfAvailable(eventName: string, data: any, locale = 'en'): { subject: string; html: string } | null {
    const renderer = this.customRenderers[eventName];
    if (!renderer) return null;
    try {
      return renderer(data, locale);
    } catch (_e) {
      // Fall back gracefully if custom renderer fails
      return null;
    }
  }

  // Custom, highly-styled template for account.active
  private renderAccountActiveCustom(data: any, _locale = 'en'): { subject: string; html: string } {
    const subject = 'Welcome to borderless business. Your Magna Porta account is now active';
    const fundingUrl = this.configService.get<string>('FUNDING_URL') || 'https://app.magna-porta.com';

    // Prevent email clipping with Gmail clip - Single table structure, no nested divs
    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>${subject}</title></head><body style="margin:0;padding:0;background-color:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#333;line-height:1.6;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8f9fa;"><tr><td align="center" style="padding:20px 0;"><table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" style="background-color:#fff;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,.1);max-width:640px;"><tr><td style="padding:28px 32px 20px 32px;background-color:#fff;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="text-align:left;"><img src="${this.LOGO_URL}" alt="Magna Porta" style="height:48px;object-fit:contain;border:0;display:block;"/></td></tr></table></td></tr><tr><td style="padding:20px 32px;background-color:#fff;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td><h1 style="font-size:22px;font-weight:800;color:#1f2937;margin:0 0 12px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">${subject}</h1><p style="color:#6b7280;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;margin:0;line-height:1.6;">Congratulations, you're in. Your business is now verified and your account is ready to use.</p></td></tr></table></td></tr><tr><td style="padding:20px 32px;background-color:#fff;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e5e7eb;border-radius:10px;background-color:#ffffff;"><tr><td style="padding:24px 20px;text-align:center;"><img src="${this.PROGRESS_BAR_IMAGE_URL}" alt="Progress steps" style="max-width:100%;height:auto;border:0;display:block;margin:0 auto;"/></td></tr></table></td></tr><tr><td style="padding:20px 32px 28px 32px;background-color:#fff;text-align:center;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="text-align:center;"><div style="font-weight:700;color:#374151;margin-bottom:12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">Get started by depositing funds</div><a href="${fundingUrl}" style="display:inline-block;background:#fe793f;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:700;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;border:0;">Add funds</a><div style="font-size:12px;color:#6b7280;margin-top:12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">Funds are typically available same business day.</div></td></tr></table></td></tr></table></td></tr></table></body></html>`;
    return { subject, html };
  }

  /**
   * Generate a beautiful default template when no template exists for the webhook
   */
  private generateDefaultFallbackTemplate(eventName: string, rawData: any): { subject: string; html: string } {
    const mainColor = '#667eea';
    const eventDisplayName = eventName.replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    // Extract common fields from data
    const rows: Array<{ key: string; value: string }> = [];
    
    // Extract key information from rawData
    if (rawData) {
      // Status
      if (rawData.status) {
        rows.push({ key: 'Status', value: String(rawData.status) });
      }
      
      // Amounts and currencies
      if (rawData.amount_beneficiary_receives || rawData.amount_payer_pays) {
        const amount = rawData.amount_beneficiary_receives || rawData.amount_payer_pays;
        const currency = rawData.transfer_currency || rawData.currency || rawData.buy_currency || rawData.sell_currency || 'USD';
        rows.push({ 
          key: 'Amount', 
          value: `${this.formatMoneyAmount(amount)} ${currency}` 
        });
      }
      
      // Reference IDs
      if (rawData.short_reference_id) {
        rows.push({ key: 'Reference ID', value: String(rawData.short_reference_id) });
      }
      if (rawData.request_id) {
        rows.push({ key: 'Request ID', value: String(rawData.request_id) });
      }
      if (rawData.id) {
        rows.push({ key: 'Transaction ID', value: String(rawData.id) });
      }
      
      // Dates
      if (rawData.transfer_date) {
        rows.push({ key: 'Transfer Date', value: String(rawData.transfer_date) });
      }
      if (rawData.conversion_date) {
        rows.push({ key: 'Conversion Date', value: String(rawData.conversion_date) });
      }
      if (rawData.created_at) {
        const date = new Date(rawData.created_at);
        rows.push({ key: 'Created At', value: date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) });
      }
      
      // Account information
      if (rawData.account_name) {
        rows.push({ key: 'Account Name', value: String(rawData.account_name) });
      }
      if (rawData.accountId || rawData.account_id) {
        rows.push({ key: 'Account ID', value: String(rawData.accountId || rawData.account_id) });
      }
      
      // Beneficiary information
      if (rawData.beneficiary) {
        if (rawData.beneficiary.bank_details?.account_name) {
          rows.push({ key: 'Beneficiary', value: String(rawData.beneficiary.bank_details.account_name) });
        }
        if (rawData.beneficiary.bank_details?.iban) {
          rows.push({ key: 'IBAN', value: String(rawData.beneficiary.bank_details.iban) });
        }
      }
      
      // Payer information
      if (rawData.payer?.company_name) {
        rows.push({ key: 'From Company', value: String(rawData.payer.company_name) });
      }
      
      // Currency pair for conversions
      if (rawData.currency_pair) {
        rows.push({ key: 'Currency Pair', value: String(rawData.currency_pair) });
      }
      if (rawData.client_rate) {
        rows.push({ key: 'Rate', value: String(rawData.client_rate) });
      }
      
      // Connected account info
      if (rawData.connected_account_id) {
        rows.push({ key: 'Connected Account ID', value: String(rawData.connected_account_id) });
      }
      if (rawData.connected_account_name) {
        rows.push({ key: 'Connected Account Name', value: String(rawData.connected_account_name) });
      }
    }
    
    // If no rows found, add basic info
    if (rows.length === 0) {
      rows.push({ key: 'Event Type', value: eventDisplayName });
      if (rawData && typeof rawData === 'object') {
        rows.push({ key: 'Data', value: 'Webhook data received successfully' });
      }
    }
    
    const rowsHtml = rows.map(r => `<tr><td style="padding:12px 0;border-bottom:1px solid #e9ecef;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="font-size:13px;color:#6c757d;font-weight:500;padding-bottom:4px;">${r.key}</td></tr><tr><td style="font-size:15px;color:#333;font-weight:600;">${r.value}</td></tr></table></td></tr>`).join('');
    
    const subject = `Webhook Notification: ${eventDisplayName}`;
    const header = `Webhook Notification: ${eventDisplayName}`;
    const subtext = 'A new webhook event has been received. Please review the details below.';
    
    // Table-based structure to prevent Gmail clipping
    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>${subject}</title></head><body style="margin:0;padding:0;background-color:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#333;line-height:1.6;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8f9fa;"><tr><td align="center" style="padding:20px 0;"><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#fff;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,.1);max-width:600px;"><tr><td style="padding:30px;background-color:#fff;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="text-align:left;padding-bottom:16px;"><img src="${this.LOGO_URL}" alt="Magna Porta" style="max-width:220px;height:auto;border:0;display:block;"/></td></tr><tr><td style="text-align:left;"><h1 style="color:${mainColor};text-align:left;font-size:26px;font-weight:600;line-height:1.3;margin:0 0 20px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">${header}</h1><p style="color:#6c757d;margin:0;text-align:left;font-size:16px;margin-bottom:16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">${subtext}</p></td></tr></table></td></tr><tr><td style="padding:0 30px 30px 30px;background-color:#fff;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:transparent;border-radius:8px;padding:15px;border:1px solid #e9ecef;"><tbody>${rowsHtml}</tbody></table></td></tr><tr><td style="padding:20px 30px;background-color:#f8f9fa;text-align:center;border-top:1px solid #e9ecef;"><p style="font-size:12px;color:#6c757d;margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">This email was sent by Magna Porta. Please do not reply.</p></td></tr></table></td></tr></table></body></html>`;
    
    return { subject, html };
  }
}


