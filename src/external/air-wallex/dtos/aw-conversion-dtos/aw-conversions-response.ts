import { AwConversion } from "./aw-conversion-dto";

export class AwConversionsResponse {
    items: AwConversion[];
    page_num?: number;
    page_size?: number;
    total_count?: number;
} 