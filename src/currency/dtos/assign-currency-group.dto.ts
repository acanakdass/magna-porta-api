import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty } from 'class-validator';

export class AssignCurrencyGroupDto {
    @ApiProperty({
        description: 'Currency group ID to assign',
        example: 1
    })
    @IsNumber()
    @IsNotEmpty()
    groupId: number;
}
