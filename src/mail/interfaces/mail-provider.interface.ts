import { SentMessageInfo } from 'nodemailer';

export interface MailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

export interface MailProvider {
  sendMail(mailOptions: MailOptions): Promise<SentMessageInfo>;
  sendTextMail(to: string | string[], subject: string, text: string): Promise<SentMessageInfo>;
  sendHtmlMail(to: string | string[], subject: string, html: string): Promise<SentMessageInfo>;
  sendTemplateMail(
    to: string | string[],  
    subject: string,
    template: string,
    variables: Record<string, any>
  ): Promise<SentMessageInfo>;
  checkStatus(): Promise<{ status: string; message: string; details?: any }>;
}

