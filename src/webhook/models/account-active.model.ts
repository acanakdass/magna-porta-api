export interface AccountActiveHookData {
  account_id: string;
  created_at: string;
  data: {
    account_details: {
      attachments: {
        additional_files: any[];
      };
      individual_details: {
        address: {
          address_line1: string;
          country_code: string;
          postcode: string;
          state: string;
          suburb: string;
        };
        address_english: {
          country_code: string;
          postcode: string;
        };
        attachments: {
          individual_documents: any[];
        };
        date_of_birth: string;
        first_name: string;
        first_name_english: string | null;
        last_name: string;
        last_name_english: string | null;
        middle_name: string | null;
        nationality: string;
        photo_file_id: string | null;
        photo_holding_identification_file_id: string | null;
        primary_identification: {
          drivers_license: {
            expire_at: string;
            issuing_state: string;
            license_number: string;
          };
          identification_type: string;
          issuing_country_code: string;
        };
        secondary_identification: any | null;
        user_id_on_platform: string;
      };
      authorised_person_details: {
        attachments: {
          identity_files: any[];
        };
        filling_as: string;
      };
      beneficial_owners: any[];
      business_details: any | null;
      director_details: any[];
      legal_entity_type: string;
      legal_rep_details: {
        attachments: {
          identity_files: any[];
        };
      };
      trustee_details: any | null;
    };
    account_usage: {
      card_usage: string[];
      collection_country_codes: string[];
      collection_from: string[];
      expected_monthly_transaction_volume: {
        amount: string;
      };
      payout_country_codes: string[];
      payout_to: string[];
    };
    created_at: string;
    customer_agreements: {
      agreed_to_data_usage: boolean;
      agreed_to_terms_and_conditions: boolean;
      opt_in_for_marketing: boolean;
    };
    id: string;
    primary_contact: {
      attachments: {
        identity_files: any[];
      };
      email: string;
      first_name: string;
      last_name: string;
      nationality: string;
      platform_connected_notification: {
        notification_tag: string;
      };
    };
    status: string;
    view_type: string;
  };
  id: string;
  name: string;
}

export interface AccountActiveEmailData {
  companyName: string;
  accountType: string;
  accountLocation: string;
  accountStatus: string;
  airwallexAccount: string;
  iban?: string;
  bankName?: string;
  accountCurrency?: string;
  activationDate: string;
}
