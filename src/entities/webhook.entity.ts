import { BaseEntity } from 'src/common/entities/base.entity';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('webhooks')
export class Webhook extends BaseEntity {
  @Column({ name: 'account_id', type: 'varchar', length: 255 })
  accountId: string;

  @Column({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @Column({ name: 'data_json', type: 'json' })
  dataJson: any;

  @Column({ name: 'webhook_id', type: 'varchar', length: 255 })
  webhookId: string;

  @Column({ name: 'webhook_name', type: 'varchar', length: 255 })
  webhookName: string;

  @CreateDateColumn({ name: 'received_at' })
  receivedAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
