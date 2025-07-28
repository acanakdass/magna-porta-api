import { AwTransfer } from './aw-transfer-dto';

export class AwTransfersResponse {
  items: AwTransfer[];
  page_before?: string;
  page_after?: string;
} 