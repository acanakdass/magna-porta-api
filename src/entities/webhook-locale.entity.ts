import { BaseEntity } from 'src/common/entities/base.entity';
import { Entity, Column, Index } from 'typeorm';

@Entity('webhook_locales')
export class WebhookLocale extends BaseEntity {
  @Index({ unique: true })
  @Column({ name: 'code', type: 'varchar', length: 16 })
  code: string; // en, tr, de-DE etc.

  @Column({ name: 'name', type: 'varchar', length: 64 })
  name: string; // English, Türkçe

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}


