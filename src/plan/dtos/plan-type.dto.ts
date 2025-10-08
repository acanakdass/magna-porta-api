import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class CreatePlanTypeDto {
  @ApiProperty({
    description: 'Plan type name',
    example: 'main'
  })
  @IsString()
  name!: string;

  @ApiProperty({
    description: 'Plan type display name',
    example: 'Main Plans',
    required: false
  })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiProperty({
    description: 'Plan type description',
    example: 'Standard plans provided by the system',
    required: false
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Whether this plan type is active',
    example: true,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePlanTypeDto {
  @ApiProperty({
    description: 'Plan type name',
    example: 'main',
    required: false
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Plan type display name',
    example: 'Main Plans',
    required: false
  })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiProperty({
    description: 'Plan type description',
    example: 'Standard plans provided by the system',
    required: false
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Whether this plan type is active',
    example: true,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class PlanTypeResponseDto {
  @ApiProperty({ description: 'Plan type ID', example: 1 })
  id!: number;

  @ApiProperty({ description: 'Plan type name', example: 'main' })
  name!: string;

  @ApiProperty({ description: 'Plan type display name', example: 'Main Plans', required: false })
  displayName?: string;

  @ApiProperty({ description: 'Plan type description', example: 'Standard plans', required: false })
  description?: string;

  @ApiProperty({ description: 'Whether this plan type is active', example: true })
  isActive!: boolean;

  @ApiProperty({ description: 'Creation date', example: '2024-01-01T00:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update date', example: '2024-01-01T00:00:00.000Z' })
  updatedAt!: Date;

  static fromEntity(entity: any): PlanTypeResponseDto {
    const dto = new PlanTypeResponseDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.displayName = entity.displayName;
    dto.description = entity.description;
    dto.isActive = entity.isActive;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}



