
import { Entity, Column } from 'typeorm';
import {BaseEntity} from "../common/entities/base.entity";

@Entity('logs')
export class LogEntity extends BaseEntity {
  @Column()
  level: 'info' | 'warn' | 'error' | 'debug' | 'verbose';

  @Column()
  message: string;

  @Column({ nullable: true })
  method?: string;

  @Column({ nullable: true })
  url?: string;

  @Column({ nullable: true })
  statusCode?: number;

  @Column({ nullable: true })
  errorStack?: string;

  @Column({ nullable: true })
  userId?: number;

  @Column({ nullable: true })
  userRole?: string;

  @Column({ nullable: true })
  ip?: string;

  @Column({ nullable: true })
  userAgent?: string;

  @Column({ type: 'jsonb', nullable: true })
  headers?: Record<string, string>;

  @Column({ type: 'jsonb', nullable: true })
  queryParams?: Record<string, string>;

  @Column()
  serviceName: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  responseBody: Record<string, any>;

  @Column({ nullable: true })
  transactionId?: string;

  @Column({ nullable: true })
  environment?: 'development' | 'production' | 'staging';

  @Column({ nullable: true })
  executionTime?: number;
}