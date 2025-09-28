import { PartialType } from '@nestjs/swagger';
import { CreatePlanRateDto } from './create-plan-rate.dto';

export class UpdatePlanRateDto extends PartialType(CreatePlanRateDto) {}

