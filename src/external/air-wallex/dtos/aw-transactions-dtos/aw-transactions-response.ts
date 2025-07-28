import { AwTransaction } from './aw-transaction-dto';

export class AwTransactionsResponse {
  has_more: boolean;
  items: AwTransaction[];
  page_num?: number;
  page_size?: number;
} 