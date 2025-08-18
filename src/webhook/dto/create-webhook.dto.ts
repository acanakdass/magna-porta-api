import { IsString, IsDateString, IsObject, IsNotEmpty } from 'class-validator';

export class CreateWebhookDto {
  @IsString()
  @IsNotEmpty()
  account_id: string;

  @IsDateString()
  @IsNotEmpty()
  created_at: string;

  @IsObject()
  @IsNotEmpty()
  data: any;

  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}
