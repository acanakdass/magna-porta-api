import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { WebhookProcessingRule } from '../../entities/webhook-processing-rule.entity';
import { BaseApiResponse } from '../../common/dto/api-response-dto';

@ApiTags('Webhook Processing Rules')
@Controller('webhooks/processing-rules')
export class WebhookProcessingRulesController {
  constructor(
    @InjectRepository(WebhookProcessingRule)
    private readonly ruleRepo: Repository<WebhookProcessingRule>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all rules' })
  async list(): Promise<BaseApiResponse<WebhookProcessingRule[]>> {
    const data = await this.ruleRepo.find({ relations: ['eventType'] });
    return { success: true, message: 'Rules fetched', data };
  }

  @Post()
  @ApiOperation({ summary: 'Create or update a rule' })
  async upsert(@Body() body: Partial<WebhookProcessingRule>): Promise<BaseApiResponse<WebhookProcessingRule>> {
    const created = this.ruleRepo.create(body);
    const data = await this.ruleRepo.save(created);
    return { success: true, message: 'Rule saved', data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a rule' })
  async remove(@Param('id') id: number): Promise<BaseApiResponse<null>> {
    await this.ruleRepo.delete(Number(id));
    return { success: true, message: 'Rule deleted' } as BaseApiResponse<null>;
  }
}


