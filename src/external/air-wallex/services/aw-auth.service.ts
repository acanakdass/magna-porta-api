import {Injectable, UnauthorizedException} from '@nestjs/common';
import {AwAuthRequest} from "../dtos/aw-auth-dtos/aw-auth-request";
import {AirwallexClient} from "../client";
import {BaseApiResponse} from "../../../common/dto/api-response-dto";
import {AwAuthorizeResponse} from "../dtos/aw-auth-dtos/aw-authorization-response";
import {generatePKCEPair} from "../../helpers/hashing-helper";


// Server-side token cache
let cachedToken: string | null = null;
let tokenExpiry: Date | null = null;

@Injectable()
export class AwAuthService {

    private client: AirwallexClient;

    constructor() {
        this.client = new AirwallexClient();
    }

    /**
     * Get an authentication token from Airwallex API
     * The token is valid for 30 minutes and can be used for multiple API calls
     */
    async getAuthToken(authRequest: AwAuthRequest): Promise<string> {
        // Check if we have a valid cached token
        if (!authRequest.forceNew && cachedToken && tokenExpiry && new Date() < tokenExpiry) {
            console.log('Using cached token, valid until:', tokenExpiry);
            return cachedToken;
        }

        // Check if cached token is about to expire
        if (!authRequest.forceNew && cachedToken && tokenExpiry) {
            const now = new Date();
            const expiresIn = Math.floor((tokenExpiry.getTime() - now.getTime()) / 1000 / 60);

            if (expiresIn > 5) {
                console.log(`Cached token still valid for ${expiresIn} minutes.`);
                return cachedToken;
            }
            console.log('Token is about to expire, refreshing...');
        }

        console.log('Obtaining new Airwallex token...');
        try {
            const data = await this.client.getToken();

            if (!data || !data.token) {
                throw new Error('Invalid or missing token in Airwallex API response.');
            }

            // Cache the token and expiry date
            cachedToken = data.token;
            tokenExpiry = new Date(data.expires_at);

            console.log('New token obtained, valid until:', tokenExpiry);
            return data.token;
        } catch (error) {
            console.error('Error obtaining Airwallex authentication token:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data,
            });

            // Clear cache in case of failure
            cachedToken = null;
            tokenExpiry = null;

            throw new Error('Failed to authenticate with Airwallex API');
        }
    }


    /**
     * Clear the server-side token cache
     */
    clearTokenCache(): void {
        cachedToken = null;
        tokenExpiry = null;
        console.log('Token cache cleared.');
    }

    /**
     * Check if a specific token or an expiry date string is expired or about to expire
     * @param expiryDateString Expiry date as a string
     */
    isTokenExpiredOrExpiring(expiryDateString: string): boolean {
        const expiryDate = new Date(expiryDateString);
        const now = new Date();

        // Add a 5-minute buffer
        now.setMinutes(now.getMinutes() + 5);

        return now >= expiryDate;
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
            const token = await this.getAuthToken({forceNew: false});
            if (!token) {
                throw new UnauthorizedException('No auth token available');
            }

            // Generate PKCE code_verifier and code_challenge pair
            const {codeVerifier, codeChallenge} = generatePKCEPair();

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
            const response =await this.client.request<AwAuthorizeResponse>('POST', `/api/v1/authentication/authorize`, headers, requestBody as any);
            // url: `${airwallexConfig.baseUrl}/api/v1/authentication/authorize`,
            //     method: 'post',
            //     headers,
            //     data: requestBody,

            console.log('AuthorizeService: Authorization API response status:', response);

            return {
                data: {...response,code_verifier: codeVerifier},
                message: 'Success',
                success: true
            } as BaseApiResponse<AwAuthorizeResponse>;
            // Add code_verifier to the response
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