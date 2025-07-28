import {AwBalance} from "./aw-balance-dto";

export class AwBalancesResponse {
    items: AwBalance[];
    page_num?: number;
    page_size?: number;
    total_count?: number;
}