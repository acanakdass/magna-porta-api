import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogsService } from './logs.service';
import { LogsController } from './logs.controller';
import { LogEntity} from './log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LogEntity])],
  controllers: [LogsController],
  providers: [LogsService],
  exports: [LogsService,TypeOrmModule],
})
export class LogsModule {}