import {ApiProperty} from '@nestjs/swagger';
import {IsString} from 'class-validator';

export class CreateCompanyDto {
    @ApiProperty({
        description: 'Company name',
        example: 'Tech Corp',
    })
    @IsString()
    name: string;

    @ApiProperty({
        description: "Company's Airwallex Account ID",
        example: '1231231321',
    })
    @IsString()
    airwallex_account_id!: string;
}
