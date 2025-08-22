export interface GlobalAccountActiveHookData {
  id: string;
  name: string;
  account_id: string;
  data: {
    account_name: string;
    account_number: string;
    account_type: string;
    alternate_account_identifiers: {
      email: string;
    };
    country_code: string;
    iban: string;
    id: string;
    institution: {
      address: string;
      city: string;
      name: string;
      zip_code: string;
    };
    nick_name: string;
    request_id: string;
    required_features: Array<{
      currency: string;
      transfer_method: string;
    }>;
    status: string;
    supported_features: Array<{
      currency: string;
      local_clearing_system?: string;
      routing_codes?: Array<{
        type: string;
        value: string;
      }>;
      transfer_method: string;
      type: string;
    }>;
    swift_code: string;
  };
  created_at: string;
  version: string;
}

export interface GlobalAccountActiveEmailData {
  companyName: string;
  accountType: string;
  accountLocation: string;
  accountStatus: string;
  airwallexAccount: string;
  iban: string;
  bankName: string;
  accountCurrency: string;
  activationDate: string;
  accountNumber: string;
  swiftCode: string;
  nickName: string;
}
