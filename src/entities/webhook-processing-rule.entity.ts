import { BaseEntity } from 'src/common/entities/base.entity';
import { Entity, Column, ManyToOne } from 'typeorm';
import { WebhookEventType } from './webhook-event-type.entity';

@Entity('webhook_processing_rules')
export class WebhookProcessingRule extends BaseEntity {
  @ManyToOne(() => WebhookEventType, (eventType) => eventType.processingRules, { eager: true })
  eventType: WebhookEventType;

  @Column({ name: 'is_enabled', type: 'boolean', default: true })
  isEnabled: boolean;

  @Column({ name: 'priority', type: 'int', default: 100 })
  priority: number;

  @Column({ name: 'conditions_json', type: 'json', nullable: true })
  conditionsJson?: any; // örn: { minAmount: 1000, currency: 'USD' }

  @Column({ name: 'actions_json', type: 'json', nullable: true })
  actionsJson?: any; // örn: { sendEmail: true, to: ['ops@x.com'] }
}


