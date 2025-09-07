import { BaseEntity } from 'src/common/entities/base.entity';
import { Entity, Column, Index, OneToMany } from 'typeorm';
import { WebhookTemplate } from './webhook-template.entity';
import { WebhookProcessingRule } from './webhook-processing-rule.entity';

@Entity('webhook_event_types')
export class WebhookEventType extends BaseEntity {
  @Index({ unique: true })
  @Column({ name: 'event_name', type: 'varchar', length: 255 })
  eventName: string; // e.g. 'payout.transfer.funding.funded'

  @Column({ name: 'description', type: 'varchar', length: 500, nullable: true })
  description?: string;

  @OneToMany(() => WebhookTemplate, (template) => template.eventType)
  templates: WebhookTemplate[];

  @OneToMany(() => WebhookProcessingRule, (rule) => rule.eventType)
  processingRules: WebhookProcessingRule[];
}


