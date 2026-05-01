/**
 * Types for WhatsApp confirmation flows.
 *
 * When STT-extracted financial data needs user verification before DB commit,
 * a PendingConfirmation is created and the user is shown an interactive
 * confirm/edit/cancel message.
 */

/** Fields the user can edit before confirming a financial transaction. */
export interface ConfirmationFields {
  amount: number;
  category: string;
  vendor: string;
  date: string;               // ISO 8601 date string
  /** Optional line items (for orders). */
  items?: Array<{ name: string; quantity: number; unitPrice: number }>;
  /** Customer identifier (JID or phone). */
  customerPhone?: string;
  customerName?: string;
  notes?: string;
  deliveryAddress?: string;
}

export type ConfirmationAction = 'order' | 'expense' | 'payment';

export type FlowState =
  | 'pending'           // Waiting for user to confirm/edit/cancel
  | 'editing'           // User chose to edit — showing field picker
  | 'editing_field'     // Waiting for user to type a new value for a specific field
  | 'confirmed'         // User confirmed — ready for DB commit
  | 'cancelled';        // User cancelled

export type EditableField = 'amount' | 'category' | 'vendor' | 'date' | 'items' | 'notes';

export interface PendingConfirmation {
  id: string;
  tenantId: string;
  jid: string;
  action: ConfirmationAction;
  fields: ConfirmationFields;
  state: FlowState;
  /** Which field is currently being edited (only set when state === 'editing_field'). */
  editingField?: EditableField;
  /** Original STT transcription for audit. */
  originalTranscription: string;
  /** Whether the source was a voice message. */
  isVoiceMessage: boolean;
  createdAt: number;
  updatedAt: number;
}

/** Button definition for interactive messages. */
export interface ButtonDef {
  id: string;
  text: string;
}

/** Row in a list section for interactive list messages. */
export interface ListRow {
  id: string;
  title: string;
  description?: string;
}

/** Section in a list message. */
export interface ListSection {
  title: string;
  rows: ListRow[];
}
