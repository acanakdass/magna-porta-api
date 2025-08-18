export interface PayoutTransferFundingFundedHookData {
  amount_beneficiary_receives: number;
  amount_payer_pays: number;
  beneficiary: {
    additional_info: {
      personal_email: string;
    };
    address: {
      city: string;
      country_code: string;
      postcode: string;
      state: string;
      street_address: string;
    };
    bank_details: {
      account_currency: string;
      account_name: string;
      bank_country_code: string;
      bank_name: string;
      iban: string;
      swift_code: string;
    };
    entity_type: string;
    type: string;
  };
  beneficiary_id: string;
  created_at: string;
  fee_amount: number;
  fee_currency: string;
  fee_paid_by: string;
  funding: {
    status: string;
  };
  id: string;
  payer: {
    additional_info: {
      business_incorporation_date: string;
      business_registration_number: string;
      business_registration_type: string;
    };
    address: {
      city: string;
      country_code: string;
      postcode: string;
      state: string;
      street_address: string;
    };
    company_name: string;
    entity_type: string;
  };
  reason: string;
  reference: string;
  remarks: string;
  request_id: string;
  short_reference_id: string;
  source_amount: number;
  source_currency: string;
  status: string;
  swift_charge_option: string;
  transfer_currency: string;
  transfer_date: string;
  transfer_method: string;
  updated_at: string;
}
