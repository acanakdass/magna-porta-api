export interface AwTransaction {
  billing_amount: number;
  billing_currency: string;
  card_id: string;
  created_at: string;
  digital_wallet_token_id?: string;
  lifecycle_id: string;
  merchant_city?: string;
  merchant_country?: string;
  merchant_name?: string;
  settlement_amount?: number;
  settlement_currency?: string;
  transaction_id: string;
  transaction_status: string;
  transaction_type: string;
  updated_at: string;
} 