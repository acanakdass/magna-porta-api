import { AwContact } from "./aw-contact-dto";

export class AwContactsResponse {
    has_more: boolean;
    items: AwContact[];
    page_num?: number;
    page_size?: number;
} 