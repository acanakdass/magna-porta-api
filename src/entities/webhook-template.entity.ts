import { BaseEntity } from 'src/common/entities/base.entity';
import { Entity, Column, ManyToOne, Index } from 'typeorm';
import { WebhookEventType } from './webhook-event-type.entity';

export type TemplateChannel = 'email' | 'web' | 'slack' | 'internal';

@Entity('webhook_templates')
export class WebhookTemplate extends BaseEntity {
  @ManyToOne(() => WebhookEventType, (eventType) => eventType.templates, { eager: true })
  eventType: WebhookEventType;

  @Index()
  @Column({ name: 'channel', type: 'varchar', length: 32 })
  channel: TemplateChannel; // email/web/slack/internal

  @Column({ name: 'locale', type: 'varchar', length: 16, default: 'en' })
  locale: string;

  @Column({ name: 'subject', type: 'varchar', length: 255, nullable: true })
  subject?: string; // email için

  @Column({ name: 'body', type: 'text' })
  body: string; // handlebars/ejs benzeri template metni

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}


