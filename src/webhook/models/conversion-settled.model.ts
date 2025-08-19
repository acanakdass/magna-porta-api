export interface ConversionSettledModel {
  request_id: string;
  conversion_id: string;
  short_reference_id: string;
  status: string;
  currency_pair: string;
  client_rate: number;
  awx_rate: number;
  mid_rate: number;
  buy_currency: string;
  buy_amount: number;
  sell_currency: string;
  sell_amount: number;
  dealt_currency: string;
  conversion_date: string;
  settlement_cutoff_time: string;
  created_at: string;
  metadata: any;
  client_data: any;
  batch_id: string | null;
  quote_id: string;
  rate_details: RateDetail[];
  funding_source: any;
  funding: any;
  application_fee_options: any;
  application_fees: any;
  collateral: any;
  updated_at: string;
}

export interface RateDetail {
  level: string;
  rate: number;
  buy_amount: number;
  sell_amount: number;
}

export interface ConversionSettledEmailData {
  shortReferenceId: string;
  buyCurrency: string;
  buyAmount: number;
  sellCurrency: string;
  sellAmount: number;
  clientRate: number;
  conversionDate: string;
  status: string;
  currencyPair: string;
}
