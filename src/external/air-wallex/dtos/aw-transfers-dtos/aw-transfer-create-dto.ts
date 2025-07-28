import { IsString, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BeneficiaryBankDetails {
  @ApiProperty({ description: 'Account currency' })
  @IsString()
  account_currency: string;

  @ApiProperty({ description: 'Account name' })
  @IsString()
  account_name: string;

  @ApiProperty({ description: 'Account number' })
  @IsString()
  account_number: string;

  @ApiProperty({ description: 'Bank country code' })
  @IsString()
  bank_country_code: string;

  @ApiPropertyOptional({ description: 'Account routing type 1' })
  @IsOptional()
  @IsString()
  account_routing_type1?: string;

  @ApiPropertyOptional({ description: 'Account routing value 1' })
  @IsOptional()
  @IsString()
  account_routing_value1?: string;

  @ApiPropertyOptional({ description: 'SWIFT code' })
  @IsOptional()
  @IsString()
  swift_code?: string;
}

export class BeneficiaryAddress {
  @ApiProperty({ description: 'Country code' })
  @IsString()
  country_code: string;

  @ApiProperty({ description: 'Street address' })
  @IsString()
  street_address: string;

  @ApiPropertyOptional({ description: 'City' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'State code' })
  @IsOptional()
  @IsString()
  state_code?: string;

  @ApiPropertyOptional({ description: 'Postcode' })
  @IsOptional()
  @IsString()
  postcode?: string;
}

export class Beneficiary {
  @ApiProperty({ description: 'Beneficiary address' })
  @ValidateNested()
  @Type(() => BeneficiaryAddress)
  address: BeneficiaryAddress;

  @ApiProperty({ description: 'Beneficiary bank details' })
  @ValidateNested()
  @Type(() => BeneficiaryBankDetails)
  bank_details: BeneficiaryBankDetails;

  @ApiPropertyOptional({ description: 'Company name' })
  @IsOptional()
  @IsString()
  company_name?: string;

  @ApiProperty({ description: 'Entity type' })
  @IsString()
  entity_type: string;

  @ApiProperty({ description: 'Type' })
  @IsString()
  type: string;
}

export class PayerAddress {
  @ApiProperty({ description: 'Country code' })
  @IsString()
  country_code: string;
}

export class Payer {
  @ApiProperty({ description: 'Payer address' })
  @ValidateNested()
  @Type(() => PayerAddress)
  address: PayerAddress;

  @ApiProperty({ description: 'Entity type' })
  @IsString()
  entity_type: string;
}

export class AwTransferCreateRequest {
  @ApiPropertyOptional({ description: 'Beneficiary details' })
  @IsOptional()
  @ValidateNested()
  @Type(() => Beneficiary)
  beneficiary?: Beneficiary;

  @ApiPropertyOptional({ description: 'Beneficiary ID' })
  @IsOptional()
  @IsString()
  beneficiary_id?: string;

  @ApiProperty({ description: 'Payer details' })
  @ValidateNested()
  @Type(() => Payer)
  payer: Payer;

  @ApiPropertyOptional({ description: 'Metadata' })
  @IsOptional()
  @IsObject()
  metadata?: {
    order_id?: string;
    [key: string]: any;
  };

  @ApiProperty({ description: 'Transfer reason' })
  @IsString()
  reason: string;

  @ApiProperty({ description: 'Transfer reference' })
  @IsString()
  reference: string;

  @ApiProperty({ description: 'Request ID' })
  @IsString()
  request_id: string;

  @ApiProperty({ description: 'Source currency' })
  @IsString()
  source_currency: string;

  @ApiProperty({ description: 'Source amount' })
  @IsString()
  source_amount: string;

  @ApiPropertyOptional({ description: 'Transfer amount' })
  @IsOptional()
  @IsString()
  transfer_amount?: string;

  @ApiProperty({ description: 'Transfer currency' })
  @IsString()
  transfer_currency: string;

  @ApiProperty({ description: 'Transfer date' })
  @IsString()
  transfer_date: string;

  @ApiProperty({ description: 'Transfer method' })
  @IsString()
  transfer_method: string;

  @ApiPropertyOptional({ description: 'SCA token' })
  @IsOptional()
  @IsString()
  scaToken?: string;
}

export class AwTransferCreateResponse {
  @ApiProperty({ description: 'Transfer ID' })
  id: string;

  @ApiProperty({ description: 'Request ID' })
  request_id: string;

  @ApiProperty({ description: 'Transfer status' })
  status: string;

  @ApiProperty({ description: 'Created at timestamp' })
  created_at: string;

  [key: string]: any; // For other properties that might be returned
} 