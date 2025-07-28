import { Controller, Body, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {AwConnectedAccountsService} from "../services/aw-connected-accounts.service";
import {AwGetConnectedAccountsRequest} from "../dtos/aw-account-dtos/aw-get-connected-accounts-request";

import {AwConnectedAccountsResponse} from "../dtos/aw-account-dtos/aw-connected-accounts-response";
import {BaseApiResponse} from "../../../common/dto/api-response-dto";

@ApiTags('AW Connected Accounts')
@Controller('connected-accounts')
export class AwConnectedAccountsController {
    constructor(private readonly connectedAccountsService: AwConnectedAccountsService) {}

    /**
     * Get all connected accounts with filters
     * Accepts request body for query parameters
     */
    @Post("/list")
    async getConnectedAccounts(@Body() request: AwGetConnectedAccountsRequest):Promise<BaseApiResponse<AwConnectedAccountsResponse>> {
        const res = await this.connectedAccountsService.getConnectedAccounts(request);
        // const result = new BaseApiResponse<AwConnectedAccountsResponse>();
        // result.data=res;
        // result.message="success";
        // result.success=true;
        return res;
    }

    /**
     * Get a single connected account by its ID
     */
    @Get(':id')
    async getConnectedAccountById(@Param('id') accountId: string) {
        return this.connectedAccountsService.getConnectedAccountByID(accountId);
    }
}