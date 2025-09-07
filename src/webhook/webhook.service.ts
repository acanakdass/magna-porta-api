import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Webhook } from '../entities/webhook.entity';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { WebhookDataParserService } from './services/webhook-data-parser.service';
import { WebhookMailSchedulerService } from './services/webhook-mail-scheduler.service';
import { PaginationDto, PaginatedResponseDto } from '../common/models/pagination-dto';

@Injectable()
export class WebhookService {
  constructor(
    @InjectRepository(Webhook)
    private webhookRepository: Repository<Webhook>,
    private webhookDataParserService: WebhookDataParserService,
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
}
