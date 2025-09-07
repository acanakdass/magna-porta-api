import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebhookTemplate } from '../../entities/webhook-template.entity';
import { WebhookEventType } from '../../entities/webhook-event-type.entity';
import { PaginationDto, PaginatedResponseDto } from '../../common/models/pagination-dto';

export interface UpsertTemplateDto {
  eventName: string;
  channel: 'email' | 'web' | 'slack' | 'internal';
  locale?: string;
  subject?: string;
  body: string;
  isActive?: boolean;
}

@Injectable()
export class WebhookTemplateService {
  constructor(
    @InjectRepository(WebhookTemplate)
    private readonly templateRepo: Repository<WebhookTemplate>,
    @InjectRepository(WebhookEventType)
    private readonly eventTypeRepo: Repository<WebhookEventType>,
  ) {}

  async ensureEventType(eventName: string, description?: string): Promise<WebhookEventType> {
    let eventType = await this.eventTypeRepo.findOne({ where: { eventName } });
    if (!eventType) {
      eventType = this.eventTypeRepo.create({ eventName, description });
      eventType = await this.eventTypeRepo.save(eventType);
    }
    return eventType;
  }

  async upsertTemplate(dto: UpsertTemplateDto): Promise<WebhookTemplate> {
    const eventType = await this.ensureEventType(dto.eventName);
    const existing = await this.templateRepo.findOne({
      where: { eventType: { id: eventType.id }, channel: dto.channel, locale: dto.locale ?? 'en' },
      relations: ['eventType'],
    });

    const payload: Partial<WebhookTemplate> = {
      eventType,
      channel: dto.channel,
      locale: dto.locale ?? 'en',
      subject: dto.subject,
      body: dto.body,
      isActive: dto.isActive ?? true,
    };

    if (existing) {
      Object.assign(existing, payload);
      return this.templateRepo.save(existing);
    }
    const created = this.templateRepo.create(payload);
    return this.templateRepo.save(created);
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

  async seedDefaults(): Promise<{ created: number; updated: number }> {
    const seeds: UpsertTemplateDto[] = [
      {
        eventName: 'conversion.settled',
        channel: 'email',
        locale: 'en',
        subject: 'Your conversion has settled',
        body: '<h2>Conversion Settled</h2><p>Short Ref: {{shortReferenceId}}</p><p>Status: {{status}}</p>',
        isActive: true,
      },
      {
        eventName: 'global_account.active',
        channel: 'email',
        locale: 'en',
        subject: 'Your global account is active',
        body: '<h2>Account Active</h2><p>Account: {{airwallexAccount}}</p><p>IBAN: {{iban}}</p>',
        isActive: true,
      },
      {
        eventName: 'payout.transfer.funding.funded',
        channel: 'email',
        locale: 'en',
        subject: 'Your payout has been funded',
        body: '<h2>Payout Funded</h2><p>Amount: {{amount_payer_pays.amount}} {{amount_payer_pays.currency}}</p><p>Status: {{status}}</p>',
        isActive: true,
      },
    ];

    let created = 0;
    let updated = 0;
    for (const dto of seeds) {
      const before = await this.findOne(dto.eventName, dto.channel, dto.locale ?? 'en');
      await this.upsertTemplate(dto);
      if (before) updated++; else created++;
    }
    return { created, updated };
  }
}


