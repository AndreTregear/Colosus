/**
 * Confirmation flow handler — state machine that processes user responses
 * to pending confirmations.
 *
 * Flow:
 *   Voice/text → AI extracts data → confirmationStore.create() → send confirmation msg
 *   User replies → handleFlowResponse() → state transitions → commit or cancel
 *
 * Returns { handled: true, reply } if the message was consumed by the flow,
 * or { handled: false } if it should pass through to normal AI processing.
 */
import { confirmationStore } from './confirmation-store.js';
import {
  renderConfirmationMessage,
  renderEditPicker,
  renderFieldEditPrompt,
  renderConfirmedMessage,
  renderCancelledMessage,
  renderFieldUpdatedMessage,
  CATEGORY_OPTIONS,
  getEditableFields,
} from './flow-renderer.js';
import { appBus } from '../../shared/events.js';
import { logger } from '../../shared/logger.js';
import type { PendingConfirmation, ConfirmationFields, ConfirmationAction, EditableField } from './types.js';

// ── Public API ──────────────────────────────────────────

export interface FlowResponse {
  handled: boolean;
  reply?: string;
}

/**
 * Check if there's an active flow for this tenant+jid and process the
 * user's message through the flow state machine.
 *
 * Call this BEFORE enqueuing to the AI queue.
 */
export function handleFlowResponse(tenantId: string, jid: string, text: string): FlowResponse {
  if (!confirmationStore.hasPending(tenantId, jid)) {
    return { handled: false };
  }

  const confirmation = confirmationStore.get(tenantId, jid);
  if (!confirmation) return { handled: false };

  const input = text.trim();

  switch (confirmation.state) {
    case 'pending':
      return handlePendingState(confirmation, input);

    case 'editing':
      return handleEditingState(confirmation, input);

    case 'editing_field':
      return handleEditingFieldState(confirmation, input);

    default:
      // Terminal states — flow is done
      return { handled: false };
  }
}

/**
 * Create a new confirmation flow and return the confirmation message to send.
 */
export function createConfirmationFlow(
  tenantId: string,
  jid: string,
  action: ConfirmationAction,
  fields: ConfirmationFields,
  originalTranscription: string,
  isVoiceMessage: boolean,
): { confirmation: PendingConfirmation; message: string } {
  const confirmation = confirmationStore.create(
    tenantId, jid, action, fields, originalTranscription, isVoiceMessage,
  );

  logger.info({ tenantId, jid, action, amount: fields.amount, confirmationId: confirmation.id },
    'Confirmation flow created');

  appBus.emit('confirmation-requested', tenantId, jid, confirmation.id, action);

  const message = renderConfirmationMessage(confirmation);
  return { confirmation, message };
}

/**
 * Check if a given tenant+jid has an active (non-terminal) confirmation flow.
 */
export function hasActiveFlow(tenantId: string, jid: string): boolean {
  return confirmationStore.hasPending(tenantId, jid);
}

/**
 * Get the current pending confirmation for external inspection.
 */
export function getPendingConfirmation(tenantId: string, jid: string): PendingConfirmation | null {
  return confirmationStore.get(tenantId, jid);
}

/**
 * Remove a confirmation after it has been processed.
 */
export function clearConfirmation(tenantId: string, jid: string): void {
  confirmationStore.remove(tenantId, jid);
}

/** Sender interface — for async callers that can send interactive messages. */
export interface FlowSender {
  sendMessage(tenantId: string, jid: string, text: string): Promise<void>;
  sendButtons(
    tenantId: string,
    jid: string,
    body: string,
    buttons: Array<{ id: string; text: string }>,
    footer?: string,
  ): Promise<void>;
  sendList(
    tenantId: string,
    jid: string,
    body: string,
    buttonText: string,
    sections: Array<{ title: string; rows: Array<{ id: string; title: string; description?: string }> }>,
    footer?: string,
  ): Promise<void>;
}

/**
 * Async wrapper: handle a confirmation response and send the reply via FlowSender.
 * Returns true if the message was consumed by the flow.
 */
export async function handleConfirmationResponse(
  sender: FlowSender,
  tenantId: string,
  contactId: string,
  input: string,
): Promise<boolean> {
  const result = handleFlowResponse(tenantId, contactId, input);
  if (!result.handled) return false;

  if (result.reply) {
    const isConfirmScreen = result.reply.includes('Confirmar') && result.reply.includes('CANCELAR');
    try {
      if (isConfirmScreen) {
        await sender.sendButtons(tenantId, contactId, result.reply, [
          { id: 'cf_confirm', text: 'OK Confirmar' },
          { id: 'cf_edit', text: 'Editar' },
          { id: 'cf_cancel', text: 'Cancelar' },
        ]);
      } else {
        await sender.sendMessage(tenantId, contactId, result.reply);
      }
    } catch {
      // Fallback to plain text
      try { await sender.sendMessage(tenantId, contactId, result.reply); } catch { /* give up */ }
    }
  }
  return true;
}

// ── State handlers ──────────────────────────────────────

function handlePendingState(c: PendingConfirmation, input: string): FlowResponse {
  const normalized = input.toUpperCase().replace(/[^A-ZÁÉÍÓÚÑ_]/g, '');

  // Confirm — text keywords OR button response ID
  if (normalized === 'OK' || normalized === 'SI' || normalized === 'CONFIRMAR' || normalized === 'CONFIRMO'
      || normalized === 'CF_CONFIRM' || normalized === 'OKCONFIRMAR') {
    confirmationStore.updateState(c.tenantId, c.jid, { state: 'confirmed' });

    logger.info({ tenantId: c.tenantId, jid: c.jid, confirmationId: c.id, action: c.action, amount: c.fields.amount },
      'Confirmation flow confirmed');

    appBus.emit('confirmation-accepted', c.tenantId, c.jid, c.id, c.action, c.fields);

    const reply = renderConfirmedMessage(c);
    // Remove from store after confirm
    confirmationStore.remove(c.tenantId, c.jid);
    return { handled: true, reply };
  }

  // Cancel — text keywords OR button response ID
  if (normalized === 'CANCELAR' || normalized === 'NO' || normalized === 'CANCEL' || normalized === 'CF_CANCEL') {
    confirmationStore.updateState(c.tenantId, c.jid, { state: 'cancelled' });

    logger.info({ tenantId: c.tenantId, jid: c.jid, confirmationId: c.id },
      'Confirmation flow cancelled');

    appBus.emit('confirmation-cancelled', c.tenantId, c.jid, c.id);

    const reply = renderCancelledMessage(c);
    confirmationStore.remove(c.tenantId, c.jid);
    return { handled: true, reply };
  }

  // Edit — text keywords OR button response ID
  if (normalized === 'EDITAR' || normalized === 'EDIT' || normalized === 'MODIFICAR' || normalized === 'CF_EDIT') {
    confirmationStore.updateState(c.tenantId, c.jid, { state: 'editing' });
    const reply = renderEditPicker(c);
    return { handled: true, reply };
  }

  // Unrecognized — re-show confirmation with hint
  const reply = 'No entendí tu respuesta.\n\n' + renderConfirmationMessage(c);
  return { handled: true, reply };
}

function handleEditingState(c: PendingConfirmation, input: string): FlowResponse {
  const normalized = input.toUpperCase().replace(/[^A-ZÁÉÍÓÚÑ0-9]/g, '');

  // Cancel from edit picker → go back to pending
  if (normalized === 'CANCELAR' || normalized === 'VOLVER' || normalized === 'ATRAS') {
    confirmationStore.updateState(c.tenantId, c.jid, { state: 'pending' });
    const reply = renderConfirmationMessage(c);
    return { handled: true, reply };
  }

  const editableFields = getEditableFields(c);

  // Try parsing as a number (1-based index)
  const fieldIndex = parseInt(input.trim(), 10);
  if (fieldIndex >= 1 && fieldIndex <= editableFields.length) {
    const field = editableFields[fieldIndex - 1];
    confirmationStore.updateState(c.tenantId, c.jid, {
      state: 'editing_field',
      editingField: field,
    });
    const reply = renderFieldEditPrompt(c, field);
    return { handled: true, reply };
  }

  // Try matching field name directly
  const matchedField = editableFields.find(f =>
    normalized.includes(f.toUpperCase()) ||
    normalized.includes(FIELD_LABELS_UPPER[f] || '')
  );

  if (matchedField) {
    confirmationStore.updateState(c.tenantId, c.jid, {
      state: 'editing_field',
      editingField: matchedField,
    });
    const reply = renderFieldEditPrompt(c, matchedField);
    return { handled: true, reply };
  }

  // Unrecognized — re-show picker
  const reply = 'Elige un número de la lista.\n\n' + renderEditPicker(c);
  return { handled: true, reply };
}

function handleEditingFieldState(c: PendingConfirmation, input: string): FlowResponse {
  const field = c.editingField;
  if (!field) {
    // Shouldn't happen — recover by going back to pending
    confirmationStore.updateState(c.tenantId, c.jid, { state: 'pending' });
    return { handled: true, reply: renderConfirmationMessage(c) };
  }

  // Cancel from field edit → go back to edit picker
  const upper = input.trim().toUpperCase();
  if (upper === 'CANCELAR' || upper === 'VOLVER') {
    confirmationStore.updateState(c.tenantId, c.jid, { state: 'editing', editingField: undefined });
    return { handled: true, reply: renderEditPicker(c) };
  }

  // Parse and validate the new value
  const parsed = parseFieldValue(field, input.trim());
  if (parsed.error) {
    return { handled: true, reply: `${parsed.error}\n\nIntenta de nuevo o escribe *CANCELAR* para volver.` };
  }

  // Apply the update
  const updated = confirmationStore.updateField(c.tenantId, c.jid, field, parsed.value);
  if (!updated) {
    return { handled: false }; // Expired during edit — let it pass through
  }

  logger.info({ tenantId: c.tenantId, jid: c.jid, field, newValue: parsed.value },
    'Confirmation field updated');

  const reply = renderFieldUpdatedMessage(updated, field);
  return { handled: true, reply };
}

// ── Field value parsing ─────────────────────────────────

const FIELD_LABELS_UPPER: Partial<Record<EditableField, string>> = {
  amount: 'MONTO',
  category: 'CATEGORÍA',
  vendor: 'PROVEEDOR',
  date: 'FECHA',
  items: 'ARTÍCULOS',
  notes: 'NOTAS',
};

interface ParseResult {
  value?: unknown;
  error?: string;
}

function parseFieldValue(field: EditableField, input: string): ParseResult {
  switch (field) {
    case 'amount': {
      // Accept: "150", "150.50", "S/ 150.50", "S/150", etc.
      const cleaned = input.replace(/[sS]\/?\s*/g, '').replace(/,/g, '.').trim();
      const num = parseFloat(cleaned);
      if (isNaN(num) || num <= 0) {
        return { error: 'El monto debe ser un número positivo. Ejemplo: 150.50' };
      }
      if (num > 999999.99) {
        return { error: 'El monto parece demasiado alto. Verifica e intenta de nuevo.' };
      }
      return { value: Math.round(num * 100) / 100 };
    }

    case 'category': {
      // Accept number index or category name
      const idx = parseInt(input, 10);
      if (idx >= 1 && idx <= CATEGORY_OPTIONS.length) {
        return { value: CATEGORY_OPTIONS[idx - 1] };
      }
      // Fuzzy match category name
      const upper = input.toUpperCase();
      const match = CATEGORY_OPTIONS.find(cat => cat.toUpperCase().startsWith(upper));
      if (match) return { value: match };
      // Accept as free text
      if (input.length > 0 && input.length <= 50) {
        return { value: input };
      }
      return { error: 'Categoría no reconocida. Elige un número o escribe el nombre.' };
    }

    case 'vendor': {
      if (input.length === 0) return { error: 'El proveedor no puede estar vacío.' };
      if (input.length > 100) return { error: 'Nombre demasiado largo (máx. 100 caracteres).' };
      return { value: input };
    }

    case 'date': {
      // Accept DD/MM/YYYY or DD-MM-YYYY or YYYY-MM-DD
      const isoMatch = input.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
      const ddmmMatch = input.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
      const shortMatch = input.match(/^(\d{1,2})[/\-.](\d{1,2})$/);

      let dateStr: string | null = null;

      if (isoMatch) {
        dateStr = input;
      } else if (ddmmMatch) {
        const [, dd, mm, yyyy] = ddmmMatch;
        dateStr = `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
      } else if (shortMatch) {
        // Assume current year
        const [, dd, mm] = shortMatch;
        const year = new Date().getFullYear();
        dateStr = `${year}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
      } else if (input.toUpperCase() === 'HOY') {
        dateStr = new Date().toISOString().split('T')[0];
      } else if (input.toUpperCase() === 'AYER') {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        dateStr = d.toISOString().split('T')[0];
      }

      if (!dateStr) {
        return { error: 'Formato de fecha no reconocido.\nUsa DD/MM/AAAA. Ejemplo: 07/04/2026\nO escribe "hoy" o "ayer".' };
      }

      // Validate the date is real
      const parsed = new Date(dateStr + 'T00:00:00');
      if (isNaN(parsed.getTime())) {
        return { error: 'Fecha inválida. Verifica día y mes.' };
      }

      return { value: dateStr };
    }

    case 'notes': {
      if (input.length > 500) return { error: 'Las notas son demasiado largas (máx. 500 caracteres).' };
      return { value: input || undefined };
    }

    case 'items': {
      // Items editing is complex — for now accept as notes and require
      // the user to create a new flow for item changes.
      return { value: input };
    }

    default:
      return { value: input };
  }
}
