import {AwConnectedAccountModel} from "./aw-connected-account-model";

export class AwConnectedAccountsResponse {
    items: AwConnectedAccountModel[];
    page_num?: number;
    page_size?: number;
    total_count?: number;
}

