import { BaseEntity } from 'src/common/entities/base.entity';
import { Entity, Column, ManyToOne, Index } from 'typeorm';
import { WebhookEventType } from './webhook-event-type.entity';

export type TemplateChannel = 'email' | 'sms' | 'web' | 'slack' | 'internal';

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

  @Column({ name: 'header', type: 'varchar', length: 255, nullable: true })
  header?: string; // üst başlık (mail başı)

  @Column({ name: 'subtext1', type: 'varchar', length: 500, nullable: true })
  subtext1?: string;

  @Column({ name: 'subtext2', type: 'varchar', length: 500, nullable: true })
  subtext2?: string;

  @Column({ name: 'main_color', type: 'varchar', length: 32, nullable: true })
  mainColor?: string; // #28a745 gibi

  @Column({ name: 'body', type: 'text' })
  body: string; // handlebars/ejs benzeri template metni

  @Column({ name: 'table_rows_json', type: 'json', nullable: true })
  tableRowsJson?: Array<{ key: string; value: string }>;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'auto_send_mail', type: 'boolean', default: false })
  autoSendMail: boolean;
}


