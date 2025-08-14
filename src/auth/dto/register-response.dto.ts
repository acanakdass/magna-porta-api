import {ApiProperty} from "@nestjs/swagger";
import { CompanyEntity } from "src/company/company.entity";

export class RegisterResponseDto {
    @ApiProperty({description: 'Email of the user', example: 'user@example.com'})
    email!: string;

    @ApiProperty({description: 'Role name of the user', example: 'administrator'})
    roleName!: string;
    
    @ApiProperty({description: 'Company of the user', example: 'CompanyEntity'})
    company:CompanyEntity;
}