export interface AwTransfer {
  id: string;
  created_at: string;
  updated_at: string;
  status: string;
  transfer_date: string;
  source_amount: number;
  source_currency: string;
  transfer_amount: number;
  transfer_currency: string;
  beneficiary: {
    company_name?: string;
    first_name?: string;
    last_name?: string;
    entity_type?: string;
  };
  payer?: {
    company_name?: string;
    first_name?: string;
    last_name?: string;
    entity_type?: string;
  };
  reference?: string;
  remarks?: string;
  amount_beneficiary_receives?: number;
  amount_payer_pays?: number;
  short_reference_id?: string;
  failure_reason?: string;
  fee_amount?: number;
  fee_currency?: string;
} 