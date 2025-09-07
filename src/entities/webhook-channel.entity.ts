import { BaseEntity } from 'src/common/entities/base.entity';
import { Entity, Column, Index } from 'typeorm';

@Entity('webhook_channels')
export class WebhookChannel extends BaseEntity {
  @Index({ unique: true })
  @Column({ name: 'key', type: 'varchar', length: 64 })
  key: string; // email | web | slack | internal | custom-*

  @Column({ name: 'name', type: 'varchar', length: 128 })
  name: string;

  @Column({ name: 'description', type: 'varchar', length: 512, nullable: true })
  description?: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}


