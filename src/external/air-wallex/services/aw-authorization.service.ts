import { Injectable, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { airwallexConfig } from '../config';
import {AwAuthService} from "./aw-auth.service";
import {generatePKCEPair} from "../../helpers/hashing-helper";
import {BaseApiResponse} from "../../../common/dto/api-response-dto";
import {AwAuthorizeResponse} from "../dtos/aw-auth-dtos/aw-authorization-response";



@Injectable()
export class AuthorizeService {
    private client: AxiosInstance;

    constructor(private readonly authService: AwAuthService) {
        this.client = axios.create({
            timeout: 10000, // 10 seconds timeout
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    /**
     * Gets an authorization code from Airwallex API
     * Uses the code_challenge S256 generation method as per RFC 7636 Section 4
     * @param authType Optional authorization type (e.g., 'scaSetup')
     * @param account_id Optional account ID to use (highest priority)
     * @returns Promise with authorization code
     */
    async getAuthorizationCode(authType: string | null = null, account_id?: string): Promise<BaseApiResponse<AwAuthorizeResponse>> {
        try {
            // Get authentication token
            const token = await this.authService.getAuthToken({forceNew: false});
            if (!token) {
                throw new UnauthorizedException('No auth token available');
            }

            // Generate PKCE code_verifier and code_challenge pair
            const { codeVerifier, codeChallenge } = generatePKCEPair();

            // Determine the account ID to use
            const accountId = account_id || null;
            console.log('AuthorizeService: Using explicitly provided account ID:', accountId);

            // Determine scopes based on authType
            const scopes = this.getScopesByAuthType(authType);

            // Prepare request body
            const requestBody = {
                code_challenge: codeChallenge,
                identity: accountId,
                scope: scopes,
            };

            // Set required headers
            const headers = {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                'x-on-behalf-of': accountId,
            };

            // Make the API request
            const response = await this.client.request({
                url: `${airwallexConfig.baseUrl}/api/v1/authentication/authorize`,
                method: 'post',
                headers,
                data: requestBody,
            });

            console.log('AuthorizeService: Authorization API response status:', response.status);

            // Add code_verifier to the response
            return {
                ...response.data,
                code_verifier: codeVerifier,
            };
        } catch (error: any) {
            console.error('AuthorizeService: Error in authorization request:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data,
            });

            return {
                data: null,
                message: error.message,
                success: false
            } as BaseApiResponse<AwAuthorizeResponse>;
            // throw new InternalServerErrorException('Authorization code request failed', error.message);
        }
    }

    /**
     * Determines the appropriate scopes based on the authorization type
     * @param authType The type of authorization (e.g., 'kyc', 'scaSetup', etc.)
     * @returns An array of scopes for the request
     */
    private getScopesByAuthType(authType: string | null): string[] {
        switch (authType) {
            case 'kyc':
                return ['w:awx_action:onboarding']; // For KYC requests
            case 'scaSetup':
                return [
                    'w:awx_action:onboarding',
                    'w:awx_action:transfers_edit',
                    'r:awx_action:sca_view',
                    'w:awx_action:sca_edit',
                ];
            case 'transfer':
                return ['w:awx_action:transfers_edit']; // For transfer requests
            default:
                return ['w:awx_action:onboarding', 'w:awx_action:transfers_edit']; // Default scopes
        }
    }
}