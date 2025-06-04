declare module 'node-telegram-bot-api' {
  // This is a simplified, partial type definition to satisfy the linter.
  // For full type safety, it's highly recommended to install @types/node-telegram-bot-api.

  export interface User {
    id: number;
    is_bot: boolean;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
  }

  export interface Chat {
    id: number;
    type: string; // "private", "group", "supergroup" or "channel"
    title?: string;
    username?: string;
    first_name?: string;
    last_name?: string;
    // ... other chat properties
  }

  export interface Message {
    message_id: number;
    from?: User;
    chat: Chat;
    date: number;
    text?: string;
    successful_payment?: SuccessfulPayment;
    // ... other message properties like photo, audio, document, etc.
  }

  export interface PreCheckoutQuery {
    id: string;
    from: User;
    currency: string;
    total_amount: number;
    invoice_payload: string;
    shipping_option_id?: string;
    order_info?: OrderInfo;
  }

  export interface OrderInfo {
    name?: string;
    phone_number?: string;
    email?: string;
    // ... other order info properties
  }

  export interface SuccessfulPayment {
    currency: string;
    total_amount: number;
    invoice_payload: string;
    shipping_option_id?: string;
    order_info?: OrderInfo;
    telegram_payment_charge_id: string;
    provider_payment_charge_id: string;
  }

  export interface Update {
    update_id: number;
    message?: Message;
    edited_message?: Message;
    channel_post?: Message;
    edited_channel_post?: Message;
    pre_checkout_query?: PreCheckoutQuery;
    // ... other update types like callback_query, inline_query etc.
  }

  export interface SendInvoiceOptions {
    photo_url?: string;
    need_name?: boolean;
    need_email?: boolean;
    send_email_to_provider?: boolean;
    is_flexible?: boolean;
    // ... other options
  }

  export interface LabeledPrice {
    label: string;
    amount: number;
  }

  class TelegramBot {
    constructor(token: string, options?: any);
    sendMessage(chatId: number | string, text: string, options?: any): Promise<Message>;
    sendInvoice(
      chatId: number | string,
      title: string,
      description: string,
      payload: string,
      providerToken: string,
      currency: string, // Changed from startParameter, which is not a direct param for sendInvoice for currency
      prices: LabeledPrice[],
      options?: SendInvoiceOptions
    ): Promise<Message>;
    answerPreCheckoutQuery(preCheckoutQueryId: string, ok: boolean, options?: { error_message?: string }): Promise<boolean>;
    // Add other methods used by your bot here
  }

  export default TelegramBot;
} 