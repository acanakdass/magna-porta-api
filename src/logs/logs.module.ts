import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogsService } from './logs.service';
import { LogEntity} from './log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LogEntity])],
  providers: [LogsService],
  exports: [LogsService,TypeOrmModule],
})
export class LogsModule {}