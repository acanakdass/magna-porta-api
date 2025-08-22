import { Injectable } from '@nestjs/common';
import { PayoutTransferFundingFundedHookData } from '../models/payout-transfer-funding-funded-hook.model';
import { ConversionSettledModel, ConversionSettledEmailData } from '../models/conversion-settled.model';
import { GlobalAccountActiveEmailData } from '../models/global-account-active.model';

@Injectable()
export class WebhookDataParserService {
  
  /**
   * Webhook data'sını webhook name'e göre parse eder
   */
  parseWebhookData(webhookName: string, dataJson: any): any {
    try {
      switch (webhookName) {
        case 'payout.transfer.funding.funded':
          return this.parsePayoutTransferFundingFunded(dataJson);
        
        case 'connected_account_transfer.new':
          return this.parseConnectedAccountTransfer(dataJson);
        
        case 'conversion.new':
          return this.parseConversion(dataJson);
        
        case 'conversion.settled':
          return this.parseConversionSettled(dataJson);
        
        case 'global_account.active':
          return this.parseGlobalAccountActive(dataJson);
        
        case 'transfer.new':
          return this.parseTransfer(dataJson);
        
        default:
          // Bilinmeyen webhook name için raw data döndür
          return {
            raw_data: dataJson,
            parsed: false,
            message: `Unknown webhook name: ${webhookName}`
          };
      }
    } catch (error) {
      return {
        raw_data: dataJson,
        parsed: false,
        error: error.message,
        message: 'Failed to parse webhook data'
      };
    }
  }

  /**
   * Payout transfer funding funded webhook data'sını parse eder
   */
  private parsePayoutTransferFundingFunded(data: any): PayoutTransferFundingFundedHookData {
    return {
      amount_beneficiary_receives: data.amount_beneficiary_receives,
      amount_payer_pays: data.amount_payer_pays,
      beneficiary: {
        additional_info: {
          personal_email: data.beneficiary?.additional_info?.personal_email || ''
        },
        address: {
          city: data.beneficiary?.address?.city || '',
          country_code: data.beneficiary?.address?.country_code || '',
          postcode: data.beneficiary?.address?.postcode || '',
          state: data.beneficiary?.address?.state || '',
          street_address: data.beneficiary?.address?.street_address || ''
        },
        bank_details: {
          account_currency: data.beneficiary?.bank_details?.account_currency || '',
          account_name: data.beneficiary?.bank_details?.account_name || '',
          bank_country_code: data.beneficiary?.bank_details?.bank_country_code || '',
          bank_name: data.beneficiary?.bank_details?.bank_name || '',
          iban: data.beneficiary?.bank_details?.iban || '',
          swift_code: data.beneficiary?.bank_details?.swift_code || ''
        },
        entity_type: data.beneficiary?.entity_type || '',
        type: data.beneficiary?.type || ''
      },
      beneficiary_id: data.beneficiary_id || '',
      created_at: data.created_at || '',
      fee_amount: data.fee_amount || 0,
      fee_currency: data.fee_currency || '',
      fee_paid_by: data.fee_paid_by || '',
      funding: {
        status: data.funding?.status || ''
      },
      id: data.id || '',
      payer: {
        additional_info: {
          business_incorporation_date: data.payer?.additional_info?.business_incorporation_date || '',
          business_registration_number: data.payer?.additional_info?.business_registration_number || '',
          business_registration_type: data.payer?.additional_info?.business_registration_type || ''
        },
        address: {
          city: data.payer?.address?.city || '',
          country_code: data.payer?.address?.country_code || '',
          postcode: data.payer?.address?.postcode || '',
          state: data.payer?.address?.state || '',
          street_address: data.payer?.address?.street_address || ''
        },
        company_name: data.payer?.company_name || '',
        entity_type: data.payer?.entity_type || ''
      },
      reason: data.reason || '',
      reference: data.reference || '',
      remarks: data.remarks || '',
      request_id: data.request_id || '',
      short_reference_id: data.short_reference_id || '',
      source_amount: data.source_amount || 0,
      source_currency: data.source_currency || '',
      status: data.status || '',
      swift_charge_option: data.swift_charge_option || '',
      transfer_currency: data.transfer_currency || '',
      transfer_date: data.transfer_date || '',
      transfer_method: data.transfer_method || '',
      updated_at: data.updated_at || ''
    };
  }

  /**
   * Connected account transfer webhook data'sını parse eder
   */
  private parseConnectedAccountTransfer(data: any): any {
    return {
      request_id: data.request_id || '',
      reason: data.reason || '',
      reference: data.reference || '',
      destination: data.destination || '',
      id: data.id || '',
      status: data.status || '',
      currency: data.currency || '',
      amount: data.amount || 0,
      fee: data.fee || 0,
      created_at: data.created_at || '',
      updated_at: data.updated_at || ''
    };
  }

  /**
   * Conversion webhook data'sını parse eder
   */
  private parseConversion(data: any): any {
    return {
      id: data.id || '',
      status: data.status || '',
      source_currency: data.source_currency || '',
      target_currency: data.target_currency || '',
      source_amount: data.source_amount || 0,
      target_amount: data.target_amount || 0,
      rate: data.rate || 0,
      created_at: data.created_at || '',
      updated_at: data.updated_at || ''
    };
  }

  /**
   * Transfer webhook data'sını parse eder
   */
  private parseTransfer(data: any): any {
    return {
      id: data.id || '',
      status: data.status || '',
      amount: data.amount || 0,
      currency: data.currency || '',
      source_account: data.source_account || '',
      destination_account: data.destination_account || '',
      created_at: data.created_at || '',
      updated_at: data.updated_at || ''
    };
  }

  /**
   * Conversion settled webhook data'sını parse eder
   */
  private parseConversionSettled(data: any): ConversionSettledEmailData {
    return {
      shortReferenceId: data.short_reference_id || '',
      buyCurrency: data.buy_currency || '',
      buyAmount: data.buy_amount || 0,
      sellCurrency: data.sell_currency || '',
      sellAmount: data.sell_amount || 0,
      clientRate: data.client_rate || '',
      conversionDate: data.conversion_date || '',
      status: data.status || '',
      currencyPair: data.currency_pair || ''
    };
  }

  /**
   * Global account active webhook data'sını parse eder
   */
  private parseGlobalAccountActive(data: any): GlobalAccountActiveEmailData {
    return {
      companyName: data.data?.account_name || '',
      accountType: data.data?.account_type || '',
      accountLocation: data.data?.country_code || '',
      accountStatus: data.data?.status || '',
      airwallexAccount: data.account_id || '',
      iban: data.data?.iban || '',
      bankName: data.data?.institution?.name || '',
      accountCurrency: data.data?.required_features?.[0]?.currency || '',
      activationDate: data.created_at || '',
      accountNumber: data.data?.account_number || '',
      swiftCode: data.data?.swift_code || '',
      nickName: data.data?.nick_name || ''
    };
  }
}
