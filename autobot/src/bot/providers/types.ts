/** Supported messaging channels. Extend this union when adding new providers. */
export type Channel = 'whatsapp';

/**
 * Channel-agnostic incoming message — the single normalized format
 * that the rest of the system (handler, queue, AI) consumes.
 * Provider implementations translate their native types into this.
 */
export interface IncomingMessage {
  id: string;
  channel: Channel;
  contactId: string;        // channel-specific contact identifier (WhatsApp JID, Telegram chatId, etc.)
  contactName: string | null; // display name provided by the channel
  fromMe: boolean;
  isGroup: boolean;
  text: string | null;
  location: {
    lat: number;
    lng: number;
    name: string | null;
    address: string | null;
  } | null;
  image: {
    buffer: Buffer;
    mimetype: string;
    caption: string | null;
  } | null;
  audio: {
    buffer: Buffer;
    mimetype: string;
    seconds: number | null;
  } | null;
}

export interface ProviderState {
  connection: 'open' | 'connecting' | 'close';
  phoneNumber: string | null;
  running: boolean;
}

/**
 * Contract that every messaging provider must implement.
 * The handler and tenant manager interact exclusively through this interface.
 */
export interface MessagingProvider {
  readonly name: string;
  readonly channel: Channel;
  start(): Promise<void>;
  stop(): Promise<void>;
  reset(): Promise<void>;
  getState(): ProviderState;
  sendText(contactId: string, text: string): Promise<void>;
  sendImage(contactId: string, imagePath: string, caption?: string): Promise<void>;
}
