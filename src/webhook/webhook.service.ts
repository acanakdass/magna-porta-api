import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Webhook } from '../entities/webhook.entity';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { WebhookDataParserService } from './services/webhook-data-parser.service';

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
}
