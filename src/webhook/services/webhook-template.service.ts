import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { WebhookTemplate } from '../../entities/webhook-template.entity';
import { WebhookEventType } from '../../entities/webhook-event-type.entity';
import { PaginationDto, PaginatedResponseDto } from '../../common/models/pagination-dto';
import { UpsertTemplateDto } from '../dto/upsert-template.dto';
import { WebhookDataParserService } from '../services/webhook-data-parser.service';

// moved to dto file

@Injectable()
export class WebhookTemplateService {
  private readonly LOGO_URL: string;

  constructor(
    @InjectRepository(WebhookTemplate)
    private readonly templateRepo: Repository<WebhookTemplate>,
    @InjectRepository(WebhookEventType)
    private readonly eventTypeRepo: Repository<WebhookEventType>,
    private readonly parser: WebhookDataParserService,
    private readonly configService: ConfigService,
  ) {
    this.LOGO_URL = this.configService.get('LOGO_URL', 'http://localhost:3001/assets/magnaporta-logos/logo_magna_porta.png');
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

  private resolvePlaceholders(input: string, data: any): string {
    if (!input) return '';
    return input.replace(/\{\{\s*([\w\.]+)\s*\}\}/g, (_m, path) => {
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

  async renderTemplateById(id: number, data: any = {}): Promise<{ subject: string; html: string }> {
    const tpl = await this.templateRepo.findOne({ where: { id }, relations: ['eventType'] });
    if (!tpl) throw new NotFoundException('Template not found');

    const subject = this.resolvePlaceholders(tpl.subject || '', data);
    const header = this.resolvePlaceholders(tpl.header || '', data);
    const sub1 = this.resolvePlaceholders(tpl.subtext1 || '', data);
    const sub2 = this.resolvePlaceholders(tpl.subtext2 || '', data);
    const bodyHtml = this.resolvePlaceholders(tpl.body || '', data);
    const mainColor = (tpl.mainColor && tpl.mainColor.trim()) || '#667eea';

    const rows = (tpl.tableRowsJson || []).map(r => ({
      key: this.resolvePlaceholders(r.key, data),
      value: this.resolvePlaceholders(r.value, data),
    }));

    const baseCss = `*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#f8f9fa;color:#333;line-height:1.6}.container{max-width:600px;margin:0 auto;background-color:#fff;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,.1);overflow:hidden}.header{padding:30px;text-align:left;background:transparent}.content{padding:20px 30px 30px 30px}.footer{background-color:#f8f9fa;padding:20px 30px;text-align:center;border-top:1px solid #e9ecef}.footer-text{font-size:12px;color:#6c757d}.summary-box{background:transparent;border-radius:8px;padding:15px;border:1px solid #e9ecef;margin-top:0}.table{width:100%;border-collapse:collapse;margin-top:10px}.table td{padding:10px 12px;border-bottom:1px solid #e9ecef;font-size:14px}.kv-label{font-size:13px;color:#6c757d;font-weight:500}.kv-value{font-size:14px;color:#333;font-weight:600;text-align:right}`;

    const rowsHtml = rows.map(r => `
      <div style="margin-bottom: 16px;">
        <div style="font-size: 13px; color: #6c757d; font-weight: 500; margin-bottom: 2px;">${r.key}</div>
        <div style="font-size: 15px; color: #333; font-weight: 600;">${r.value}</div>
      </div>
    `).join('');

    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>${subject || 'Preview'}</title><style>${baseCss}</style></head><body><div class="container"><div class="header"><div style="margin-bottom:16px;text-align:center;"><img src="${this.LOGO_URL}" alt="Magna Porta" style="max-width:150px;height:auto;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.12));"/></div><h1 style="color:${mainColor};text-align:left;font-size:16px;font-weight:600;line-height:1.3;margin-bottom:20px;">${header}</h1>${sub1?`<p style="color:#6c757d;margin-top:0;text-align:left;font-size:13px;margin-bottom:16px;">${sub1}</p>`:''}${sub2?`<p style="color:#6c757d;margin-top:0;font-size:12px;text-align:left;line-height:1.8;">${sub2}</p>`:''}</div><div class="content">${bodyHtml}${rows.length?`<div class="summary-box">${rowsHtml}</div>`:''}</div><div class="footer"><p class="footer-text">This email was sent by Magna Porta. Please do not reply.</p></div></div></body></html>`;

    return { subject, html };
  }

  async renderTemplateByEvent(eventName: string, channel: WebhookTemplate['channel'] = 'email', locale = 'en', rawData: any = {}): Promise<{ subject: string; html: string }> {
    const eventType = await this.eventTypeRepo.findOne({ where: { eventName } });
    if (!eventType) throw new NotFoundException('Event type not found');
    const tpl = await this.templateRepo.findOne({ where: { eventType: { id: eventType.id }, channel, locale }, relations: ['eventType'] });
    if (!tpl) throw new NotFoundException('Template not found for given eventName/channel/locale');

    const parsed = this.parser.parseWebhookData(eventName, rawData);

    // reuse rendering by id logic by faking template fetch path
    // Duplicate minimal part to avoid extra query
    const subject = this.resolvePlaceholders(tpl.subject || '', parsed);
    const header = this.resolvePlaceholders(tpl.header || '', parsed);
    const sub1 = this.resolvePlaceholders(tpl.subtext1 || '', parsed);
    const sub2 = this.resolvePlaceholders(tpl.subtext2 || '', parsed);
    const bodyHtml = this.resolvePlaceholders(tpl.body || '', parsed);
    const mainColor = (tpl.mainColor && tpl.mainColor.trim()) || '#667eea';
    const rows = (tpl.tableRowsJson || []).map(r => ({
      key: this.resolvePlaceholders(r.key, parsed),
      value: this.resolvePlaceholders(r.value, parsed),
    }));
    const baseCss = `*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#f8f9fa;color:#333;line-height:1.6}.container{max-width:600px;margin:0 auto;background-color:#fff;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,.1);overflow:hidden}.header{padding:30px;text-align:left;background:transparent}.content{padding:20px 30px 30px 30px}.footer{background-color:#f8f9fa;padding:20px 30px;text-align:center;border-top:1px solid #e9ecef}.footer-text{font-size:12px;color:#6c757d}.summary-box{background:transparent;border-radius:8px;padding:15px;border:1px solid #e9ecef;margin-top:0}.table{width:100%;border-collapse:collapse;margin-top:10px}.table td{padding:10px 12px;border-bottom:1px solid #e9ecef;font-size:14px}.kv-label{font-size:13px;color:#6c757d;font-weight:500}.kv-value{font-size:14px;color:#333;font-weight:600;text-align:right}`;
    const rowsHtml = rows.map(r => `
      <div style=\"margin-bottom: 16px;\">
        <div style=\"font-size: 13px; color: #6c757d; font-weight: 500; margin-bottom: 2px;\">${r.key}</div>
        <div style=\"font-size: 15px; color: #333; font-weight: 600;\">${r.value}</div>
      </div>
    `).join('');
    const html = `<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"UTF-8\"/><title>${subject || 'Preview'}</title><style>${baseCss}</style></head><body><div class=\"container\"><div class=\"header\"><div style=\"margin-bottom:16px;text-align:center;\"><img src=\"${this.LOGO_URL}\" alt=\"Magna Porta\" style=\"max-width:150px;height:auto;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.12));\"/></div><h1 style=\"color:${mainColor};text-align:left;font-size:26px;font-weight:600;line-height:1.3;margin-bottom:20px;\">${header}</h1>${sub1?`<p style=\"color:#6c757d;margin-top:0;text-align:left;font-size:16px;margin-bottom:16px;\">${sub1}</p>`:''}${sub2?`<p style=\"color:#6c757d;margin-top:0;font-size:15px;text-align:left;line-height:1.6;\">${sub2}</p>`:''}</div><div class=\"content\">${bodyHtml}${rows.length?`<div class=\"summary-box\">${rowsHtml}</div>`:''}</div><div class=\"footer\"><p class=\"footer-text\">This email was sent by Magna Porta. Please do not reply.</p></div></div></body></html>`;
    return { subject, html };
  }
}


