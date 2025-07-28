import { Controller, Get, Post, Query, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { AwContactsService } from '../services/aw-contacts.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { BaseApiResponse } from '../../../common/dto/api-response-dto';
import { 
    AwContactsResponse,
    AwContactDetail,
    AwContactsQueryDto,
    AwContactCreateRequest,
    AwContactCreateResponse
} from '../dtos/aw-contacts-dtos';

@ApiTags('Airwallex Contacts')
@Controller('airwallex/contacts')
// @UseGuards(JwtAuthGuard)
export class AwContactsController {

    constructor(private readonly contactsService: AwContactsService) {}

    @Get()
    @ApiOperation({ summary: 'Get contacts (beneficiaries)' })
    @ApiResponse({ 
        status: 200, 
        description: 'Contacts retrieved successfully',
        type: BaseApiResponse<AwContactsResponse>
    })
    @ApiQuery({ name: 'status', required: false, description: 'Contact status filter' })
    @ApiQuery({ name: 'account_name', required: false, description: 'Account name filter' })
    @ApiQuery({ name: 'account_number', required: false, description: 'Account number filter' })
    @ApiQuery({ name: 'email', required: false, description: 'Email filter' })
    @ApiQuery({ name: 'page_num', required: false, description: 'Page number for pagination' })
    @ApiQuery({ name: 'page_size', required: false, description: 'Page size for pagination' })
    @ApiQuery({ name: 'account_id', required: false, description: 'Account ID for the request' })
    async getContacts(
        @Query() queryParams: AwContactsQueryDto,
        @Query('account_id') accountId?: string
    ): Promise<BaseApiResponse<AwContactsResponse>> {
        return await this.contactsService.getContacts(queryParams, accountId);
    }

    @Get(':contactId')
    @ApiOperation({ summary: 'Get contact details by ID' })
    @ApiResponse({ 
        status: 200, 
        description: 'Contact details retrieved successfully',
        type: BaseApiResponse<AwContactDetail>
    })
    @ApiParam({ name: 'contactId', description: 'Contact ID' })
    @ApiQuery({ name: 'account_id', required: false, description: 'Account ID' })
    async getContactById(
        @Param('contactId') contactId: string,
        @Query('account_id') accountId?: string
    ): Promise<BaseApiResponse<AwContactDetail>> {
        return await this.contactsService.getContactById(contactId, accountId);
    }

    @Post('create')
    @ApiOperation({ summary: 'Create a new beneficiary/contact' })
    @ApiResponse({
        status: 201,
        description: 'Beneficiary created successfully',
        type: BaseApiResponse<AwContactCreateResponse>
    })
    @ApiBody({ type: AwContactCreateRequest })
    @ApiQuery({ name: 'account_id', required: false, description: 'Account ID for the beneficiary creation' })
    async createBeneficiary(
        @Body() beneficiaryData: AwContactCreateRequest,
        @Query('account_id') accountId?: string
    ): Promise<BaseApiResponse<AwContactCreateResponse>> {
        return await this.contactsService.createBeneficiary(beneficiaryData, accountId);
    }
} 