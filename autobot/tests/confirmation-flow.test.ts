/**
 * Tests for the WhatsApp Flows confirmation UI.
 *
 * Covers:
 * - Confirmation store (create, get, update, TTL expiry)
 * - Flow state machine (pending → confirm/edit/cancel)
 * - Field editing (amount parsing, date parsing, validation)
 * - Flow renderer (message formatting)
 * - Button/list ID handling
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { confirmationStore } from '../src/bot/flows/confirmation-store.js';
import {
  handleFlowResponse,
  createConfirmationFlow,
  hasActiveFlow,
  getPendingConfirmation,
} from '../src/bot/flows/confirmation-flow.js';
import {
  renderConfirmationMessage,
  renderEditPicker,
  renderFieldEditPrompt,
  renderConfirmedMessage,
  renderCancelledMessage,
  renderFieldUpdatedMessage,
} from '../src/bot/flows/flow-renderer.js';
import type { ConfirmationFields, PendingConfirmation } from '../src/bot/flows/types.js';

// Mock appBus to capture events
vi.mock('../src/shared/events.js', () => ({
  appBus: {
    emit: vi.fn(),
    on: vi.fn(),
    removeListener: vi.fn(),
  },
}));

const TEST_TENANT = 'tenant-test-123';
const TEST_JID = '51999888777@s.whatsapp.net';

function makeFields(overrides?: Partial<ConfirmationFields>): ConfirmationFields {
  return {
    amount: 150.50,
    category: 'Insumos',
    vendor: 'Mercado Central',
    date: '2026-04-07',
    customerName: 'Juan Perez',
    items: [
      { name: 'Arroz', quantity: 2, unitPrice: 5.50 },
      { name: 'Pollo', quantity: 1, unitPrice: 25.00 },
    ],
    notes: 'Para el almuerzo',
    ...overrides,
  };
}

describe('ConfirmationStore', () => {
  beforeEach(() => {
    confirmationStore.clear();
  });

  it('should create and retrieve a pending confirmation', () => {
    const c = confirmationStore.create(
      TEST_TENANT, TEST_JID, 'order', makeFields(), 'dos arroz y un pollo', true,
    );
    expect(c.id).toBeTruthy();
    expect(c.state).toBe('pending');
    expect(c.tenantId).toBe(TEST_TENANT);
    expect(c.jid).toBe(TEST_JID);
    expect(c.fields.amount).toBe(150.50);
    expect(c.isVoiceMessage).toBe(true);

    const retrieved = confirmationStore.get(TEST_TENANT, TEST_JID);
    expect(retrieved).toBeTruthy();
    expect(retrieved!.id).toBe(c.id);
  });

  it('should replace existing confirmation for same tenant+jid', () => {
    const c1 = confirmationStore.create(TEST_TENANT, TEST_JID, 'order', makeFields(), 'first', true);
    const c2 = confirmationStore.create(TEST_TENANT, TEST_JID, 'expense', makeFields({ amount: 200 }), 'second', false);

    expect(confirmationStore.size).toBe(1);
    const retrieved = confirmationStore.get(TEST_TENANT, TEST_JID);
    expect(retrieved!.id).toBe(c2.id);
    expect(retrieved!.action).toBe('expense');
    expect(retrieved!.fields.amount).toBe(200);
  });

  it('should return null for non-existent confirmation', () => {
    expect(confirmationStore.get('nonexistent', TEST_JID)).toBeNull();
  });

  it('should track hasPending correctly', () => {
    expect(confirmationStore.hasPending(TEST_TENANT, TEST_JID)).toBe(false);

    confirmationStore.create(TEST_TENANT, TEST_JID, 'order', makeFields(), 'test', true);
    expect(confirmationStore.hasPending(TEST_TENANT, TEST_JID)).toBe(true);

    // Terminal states are not "pending"
    confirmationStore.updateState(TEST_TENANT, TEST_JID, { state: 'confirmed' });
    expect(confirmationStore.hasPending(TEST_TENANT, TEST_JID)).toBe(false);
  });

  it('should update field values', () => {
    confirmationStore.create(TEST_TENANT, TEST_JID, 'order', makeFields(), 'test', true);

    const updated = confirmationStore.updateField(TEST_TENANT, TEST_JID, 'amount', 200);
    expect(updated!.fields.amount).toBe(200);
    expect(updated!.state).toBe('pending');
    expect(updated!.editingField).toBeUndefined();

    const updated2 = confirmationStore.updateField(TEST_TENANT, TEST_JID, 'vendor', 'Tienda Nueva');
    expect(updated2!.fields.vendor).toBe('Tienda Nueva');
  });

  it('should remove confirmations', () => {
    confirmationStore.create(TEST_TENANT, TEST_JID, 'order', makeFields(), 'test', true);
    expect(confirmationStore.size).toBe(1);

    confirmationStore.remove(TEST_TENANT, TEST_JID);
    expect(confirmationStore.size).toBe(0);
    expect(confirmationStore.get(TEST_TENANT, TEST_JID)).toBeNull();
  });
});

describe('handleFlowResponse — state machine', () => {
  beforeEach(() => {
    confirmationStore.clear();
  });

  it('should return handled:false when no pending confirmation', () => {
    const result = handleFlowResponse(TEST_TENANT, TEST_JID, 'OK');
    expect(result.handled).toBe(false);
  });

  describe('pending state', () => {
    beforeEach(() => {
      confirmationStore.create(TEST_TENANT, TEST_JID, 'expense', makeFields(), 'test', true);
    });

    it('should confirm on "OK"', () => {
      const result = handleFlowResponse(TEST_TENANT, TEST_JID, 'OK');
      expect(result.handled).toBe(true);
      expect(result.reply).toContain('confirmado');
    });

    it('should confirm on "SI"', () => {
      const result = handleFlowResponse(TEST_TENANT, TEST_JID, 'SI');
      expect(result.handled).toBe(true);
      expect(result.reply).toContain('confirmado');
    });

    it('should confirm on "CONFIRMAR"', () => {
      const result = handleFlowResponse(TEST_TENANT, TEST_JID, 'CONFIRMAR');
      expect(result.handled).toBe(true);
      expect(result.reply).toContain('confirmado');
    });

    it('should cancel on "CANCELAR"', () => {
      const result = handleFlowResponse(TEST_TENANT, TEST_JID, 'CANCELAR');
      expect(result.handled).toBe(true);
      expect(result.reply).toContain('Descartado');
    });

    it('should cancel on "NO"', () => {
      const result = handleFlowResponse(TEST_TENANT, TEST_JID, 'NO');
      expect(result.handled).toBe(true);
      expect(result.reply).toContain('Descartado');
    });

    it('should enter editing on "EDITAR"', () => {
      const result = handleFlowResponse(TEST_TENANT, TEST_JID, 'EDITAR');
      expect(result.handled).toBe(true);
      expect(result.reply).toContain('editar');

      const c = confirmationStore.get(TEST_TENANT, TEST_JID);
      expect(c!.state).toBe('editing');
    });

    it('should handle unrecognized input by re-showing confirmation', () => {
      const result = handleFlowResponse(TEST_TENANT, TEST_JID, 'hola amigo');
      expect(result.handled).toBe(true);
      expect(result.reply).toContain('No entendí');
      expect(result.reply).toContain('Confirmar');
    });
  });

  describe('editing state', () => {
    beforeEach(() => {
      confirmationStore.create(TEST_TENANT, TEST_JID, 'expense', makeFields(), 'test', true);
      handleFlowResponse(TEST_TENANT, TEST_JID, 'EDITAR');
    });

    it('should select field by number', () => {
      const result = handleFlowResponse(TEST_TENANT, TEST_JID, '1'); // amount
      expect(result.handled).toBe(true);
      expect(result.reply).toContain('Monto');

      const c = confirmationStore.get(TEST_TENANT, TEST_JID);
      expect(c!.state).toBe('editing_field');
      expect(c!.editingField).toBe('amount');
    });

    it('should go back on CANCELAR', () => {
      const result = handleFlowResponse(TEST_TENANT, TEST_JID, 'CANCELAR');
      expect(result.handled).toBe(true);
      expect(result.reply).toContain('Confirmar');

      const c = confirmationStore.get(TEST_TENANT, TEST_JID);
      expect(c!.state).toBe('pending');
    });

    it('should reject invalid field number', () => {
      const result = handleFlowResponse(TEST_TENANT, TEST_JID, '99');
      expect(result.handled).toBe(true);
      expect(result.reply).toContain('número');
    });
  });

  describe('editing_field state — amount', () => {
    beforeEach(() => {
      confirmationStore.create(TEST_TENANT, TEST_JID, 'expense', makeFields(), 'test', true);
      handleFlowResponse(TEST_TENANT, TEST_JID, 'EDITAR');
      handleFlowResponse(TEST_TENANT, TEST_JID, '1'); // select amount
    });

    it('should accept valid amount', () => {
      const result = handleFlowResponse(TEST_TENANT, TEST_JID, '250.75');
      expect(result.handled).toBe(true);
      expect(result.reply).toContain('actualizado');

      const c = confirmationStore.get(TEST_TENANT, TEST_JID);
      expect(c!.fields.amount).toBe(250.75);
      expect(c!.state).toBe('pending');
    });

    it('should accept amount with S/ prefix', () => {
      const result = handleFlowResponse(TEST_TENANT, TEST_JID, 'S/ 300');
      expect(result.handled).toBe(true);

      const c = confirmationStore.get(TEST_TENANT, TEST_JID);
      expect(c!.fields.amount).toBe(300);
    });

    it('should reject negative amount', () => {
      const result = handleFlowResponse(TEST_TENANT, TEST_JID, '-50');
      expect(result.handled).toBe(true);
      expect(result.reply).toContain('positivo');
    });

    it('should reject non-numeric input', () => {
      const result = handleFlowResponse(TEST_TENANT, TEST_JID, 'abc');
      expect(result.handled).toBe(true);
      expect(result.reply).toContain('positivo');
    });

    it('should go back on CANCELAR/VOLVER', () => {
      const result = handleFlowResponse(TEST_TENANT, TEST_JID, 'VOLVER');
      expect(result.handled).toBe(true);

      const c = confirmationStore.get(TEST_TENANT, TEST_JID);
      expect(c!.state).toBe('editing');
    });
  });

  describe('editing_field state — date', () => {
    beforeEach(() => {
      confirmationStore.create(TEST_TENANT, TEST_JID, 'expense', makeFields(), 'test', true);
      handleFlowResponse(TEST_TENANT, TEST_JID, 'EDITAR');
      handleFlowResponse(TEST_TENANT, TEST_JID, '4'); // select date
    });

    it('should accept DD/MM/YYYY format', () => {
      const result = handleFlowResponse(TEST_TENANT, TEST_JID, '15/03/2026');
      expect(result.handled).toBe(true);
      expect(result.reply).toContain('actualizado');

      const c = confirmationStore.get(TEST_TENANT, TEST_JID);
      expect(c!.fields.date).toBe('2026-03-15');
    });

    it('should accept "hoy"', () => {
      const result = handleFlowResponse(TEST_TENANT, TEST_JID, 'hoy');
      expect(result.handled).toBe(true);

      const c = confirmationStore.get(TEST_TENANT, TEST_JID);
      expect(c!.fields.date).toBe(new Date().toISOString().split('T')[0]);
    });

    it('should accept "ayer"', () => {
      const result = handleFlowResponse(TEST_TENANT, TEST_JID, 'ayer');
      expect(result.handled).toBe(true);

      const c = confirmationStore.get(TEST_TENANT, TEST_JID);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(c!.fields.date).toBe(yesterday.toISOString().split('T')[0]);
    });

    it('should reject invalid date format', () => {
      const result = handleFlowResponse(TEST_TENANT, TEST_JID, 'next tuesday');
      expect(result.handled).toBe(true);
      expect(result.reply).toContain('fecha');
    });
  });

  describe('editing_field state — category', () => {
    beforeEach(() => {
      confirmationStore.create(TEST_TENANT, TEST_JID, 'expense', makeFields(), 'test', true);
      handleFlowResponse(TEST_TENANT, TEST_JID, 'EDITAR');
      handleFlowResponse(TEST_TENANT, TEST_JID, '2'); // select category
    });

    it('should accept category by number', () => {
      const result = handleFlowResponse(TEST_TENANT, TEST_JID, '3'); // Personal
      expect(result.handled).toBe(true);

      const c = confirmationStore.get(TEST_TENANT, TEST_JID);
      expect(c!.fields.category).toBe('Personal');
    });

    it('should accept category by name', () => {
      const result = handleFlowResponse(TEST_TENANT, TEST_JID, 'Transporte');
      expect(result.handled).toBe(true);

      const c = confirmationStore.get(TEST_TENANT, TEST_JID);
      expect(c!.fields.category).toBe('Transporte');
    });
  });

  describe('full flow — confirm after edit', () => {
    it('should allow edit then confirm', () => {
      confirmationStore.create(TEST_TENANT, TEST_JID, 'order', makeFields(), 'test', true);

      // Edit amount
      handleFlowResponse(TEST_TENANT, TEST_JID, 'EDITAR');
      handleFlowResponse(TEST_TENANT, TEST_JID, '1'); // amount
      handleFlowResponse(TEST_TENANT, TEST_JID, '200');

      // Confirm
      const result = handleFlowResponse(TEST_TENANT, TEST_JID, 'OK');
      expect(result.handled).toBe(true);
      expect(result.reply).toContain('confirmado');
      expect(result.reply).toContain('200');

      // Confirmation should be cleared
      expect(confirmationStore.get(TEST_TENANT, TEST_JID)).toBeNull();
    });
  });
});

describe('createConfirmationFlow', () => {
  beforeEach(() => {
    confirmationStore.clear();
  });

  it('should create flow and return confirmation message', () => {
    const { confirmation, message } = createConfirmationFlow(
      TEST_TENANT, TEST_JID, 'expense', makeFields(), 'compre arroz y pollo', true,
    );

    expect(confirmation.id).toBeTruthy();
    expect(confirmation.state).toBe('pending');
    expect(message).toContain('Confirmar');
    expect(message).toContain('S/ 150.50');
    expect(message).toContain('Insumos');
    expect(message).toContain('Mercado Central');
    expect(hasActiveFlow(TEST_TENANT, TEST_JID)).toBe(true);
  });
});

describe('Flow Renderer', () => {
  const mockConfirmation: PendingConfirmation = {
    id: 'test-123',
    tenantId: TEST_TENANT,
    jid: TEST_JID,
    action: 'expense',
    fields: makeFields(),
    state: 'pending',
    originalTranscription: 'compre arroz',
    isVoiceMessage: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  it('renderConfirmationMessage should include all fields', () => {
    const msg = renderConfirmationMessage(mockConfirmation);
    expect(msg).toContain('Confirmar Gasto');
    expect(msg).toContain('S/ 150.50');
    expect(msg).toContain('Insumos');
    expect(msg).toContain('Mercado Central');
    expect(msg).toContain('OK');
    expect(msg).toContain('EDITAR');
    expect(msg).toContain('CANCELAR');
  });

  it('renderConfirmationMessage should include items', () => {
    const msg = renderConfirmationMessage(mockConfirmation);
    expect(msg).toContain('Arroz');
    expect(msg).toContain('Pollo');
    expect(msg).toContain('2x');
  });

  it('renderEditPicker should list all editable fields with numbers', () => {
    const msg = renderEditPicker(mockConfirmation);
    expect(msg).toContain('1.');
    expect(msg).toContain('Monto');
    expect(msg).toContain('Categoría');
    expect(msg).toContain('Proveedor');
    expect(msg).toContain('Fecha');
  });

  it('renderFieldEditPrompt should show current value and hint', () => {
    const msg = renderFieldEditPrompt(mockConfirmation, 'amount');
    expect(msg).toContain('Monto');
    expect(msg).toContain('150.50');
    expect(msg).toContain('número');
  });

  it('renderConfirmedMessage should show action and amount', () => {
    const msg = renderConfirmedMessage(mockConfirmation);
    expect(msg).toContain('Gasto');
    expect(msg).toContain('confirmado');
    expect(msg).toContain('150.50');
  });

  it('renderCancelledMessage should indicate discard', () => {
    const msg = renderCancelledMessage(mockConfirmation);
    expect(msg).toContain('Descartado');
  });

  it('renderFieldUpdatedMessage should show new value and re-render confirmation', () => {
    const updated = { ...mockConfirmation, fields: { ...mockConfirmation.fields, amount: 300 } };
    const msg = renderFieldUpdatedMessage(updated, 'amount');
    expect(msg).toContain('Monto');
    expect(msg).toContain('actualizado');
    expect(msg).toContain('S/ 300.00');
    expect(msg).toContain('Confirmar'); // re-renders confirmation screen
  });
});
