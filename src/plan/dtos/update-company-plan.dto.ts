import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class UpdateCompanyPlanDto {
  @ApiProperty({
    description: 'Plan ID to assign to the company',
    example: 3
  })
  @IsNotEmpty()
  @IsNumber()
  planId!: number;
}
