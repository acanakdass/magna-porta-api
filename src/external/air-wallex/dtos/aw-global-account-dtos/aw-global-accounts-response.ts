import { AwGlobalAccount } from "./aw-global-account-dto";

export class AwGlobalAccountsResponse {
    items: AwGlobalAccount[];
    page_after?: string;
    page_before?: string;
} 