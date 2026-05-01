/**
 * Renders PendingConfirmation state into WhatsApp messages.
 *
 * Two rendering modes:
 * 1. Interactive (buttons/lists) — uses Baileys interactive messages when available
 * 2. Text fallback — numbered-option text that works universally
 *
 * All messages are in Spanish for Peru MYPE audience.
 */
import type { PendingConfirmation, ConfirmationAction, EditableField } from './types.js';

// ── Label maps ──────────────────────────────────────────

const ACTION_LABELS: Record<ConfirmationAction, string> = {
  order: 'Pedido',
  expense: 'Gasto',
  payment: 'Pago',
};

const FIELD_LABELS: Record<EditableField, string> = {
  amount: 'Monto',
  category: 'Categoría',
  vendor: 'Proveedor',
  date: 'Fecha',
  items: 'Artículos',
  notes: 'Notas',
};

const CATEGORY_OPTIONS = [
  'Insumos', 'Alquiler', 'Personal', 'Servicios', 'Transporte', 'Otros',
];

// ── Formatters ──────────────────────────────────────────

function formatMoney(amount: number): string {
  return `S/ ${amount.toFixed(2)}`;
}

function formatDate(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return isoDate;
  }
}

// ── Confirmation screen ─────────────────────────────────

/**
 * Renders the main confirmation message showing extracted data
 * with Confirm / Edit / Cancel options.
 */
export function renderConfirmationMessage(c: PendingConfirmation): string {
  const label = ACTION_LABELS[c.action];
  const f = c.fields;

  const lines: string[] = [
    `*Confirmar ${label}*`,
    '━━━━━━━━━━━━━━━━',
  ];

  lines.push(`*Monto:* ${formatMoney(f.amount)}`);
  lines.push(`*Categoría:* ${f.category}`);
  if (f.vendor) lines.push(`*Proveedor:* ${f.vendor}`);
  lines.push(`*Fecha:* ${formatDate(f.date)}`);

  if (f.items && f.items.length > 0) {
    lines.push('');
    lines.push('*Artículos:*');
    for (const item of f.items) {
      lines.push(`  • ${item.quantity}x ${item.name} (${formatMoney(item.unitPrice)})`);
    }
  }

  if (f.customerName) lines.push(`*Cliente:* ${f.customerName}`);
  if (f.notes) lines.push(`*Notas:* ${f.notes}`);

  lines.push('━━━━━━━━━━━━━━━━');
  lines.push('');
  lines.push('Responde:');
  lines.push('*OK* - Confirmar');
  lines.push('*EDITAR* - Modificar datos');
  lines.push('*CANCELAR* - Descartar');

  return lines.join('\n');
}

/**
 * Renders the edit field picker — shows numbered list of editable fields.
 */
export function renderEditPicker(c: PendingConfirmation): string {
  const editableFields = getEditableFields(c);

  const lines: string[] = [
    '*¿Qué deseas editar?*',
    '',
  ];

  editableFields.forEach((field, i) => {
    const currentValue = getCurrentFieldValue(c, field);
    lines.push(`*${i + 1}.* ${FIELD_LABELS[field]} _(${currentValue})_`);
  });

  lines.push('');
  lines.push('Responde con el número.');
  lines.push('O escribe *CANCELAR* para volver.');

  return lines.join('\n');
}

/**
 * Renders the prompt for editing a specific field.
 */
export function renderFieldEditPrompt(c: PendingConfirmation, field: EditableField): string {
  const fieldLabel = FIELD_LABELS[field];
  const currentValue = getCurrentFieldValue(c, field);

  switch (field) {
    case 'amount':
      return `*Editar ${fieldLabel}*\nValor actual: ${currentValue}\n\nEscribe el nuevo monto (solo números).\nEjemplo: 150.50`;

    case 'category':
      return [
        `*Editar ${fieldLabel}*`,
        `Actual: ${currentValue}`,
        '',
        'Elige una categoría:',
        ...CATEGORY_OPTIONS.map((cat, i) => `*${i + 1}.* ${cat}`),
        '',
        'Responde con el número o escribe la categoría.',
      ].join('\n');

    case 'vendor':
      return `*Editar ${fieldLabel}*\nActual: ${currentValue}\n\nEscribe el nuevo nombre del proveedor.`;

    case 'date':
      return `*Editar ${fieldLabel}*\nActual: ${currentValue}\n\nEscribe la fecha en formato DD/MM/AAAA.\nEjemplo: 07/04/2026`;

    case 'items':
      return `*Editar ${fieldLabel}*\nDescribe los artículos de nuevo.\nEjemplo: 3 ceviche a 25 soles, 2 arroz con pollo a 18`;

    case 'notes':
      return `*Editar ${fieldLabel}*\nActual: ${currentValue || '(sin notas)'}\n\nEscribe las nuevas notas.`;

    default:
      return `Escribe el nuevo valor para ${fieldLabel}:`;
  }
}

/**
 * Renders the confirmation success message.
 */
export function renderConfirmedMessage(c: PendingConfirmation): string {
  const label = ACTION_LABELS[c.action];
  return `${label} confirmado por ${formatMoney(c.fields.amount)}. Registrado.`;
}

/**
 * Renders the cancellation message.
 */
export function renderCancelledMessage(_c: PendingConfirmation): string {
  return 'Descartado. No se registró nada.';
}

/**
 * Renders the timeout/expiry message.
 */
export function renderExpiredMessage(): string {
  return 'La confirmación expiró. Envía el dato de nuevo si deseas registrarlo.';
}

/**
 * Renders an update confirmation after a field was edited,
 * then re-shows the confirmation message.
 */
export function renderFieldUpdatedMessage(c: PendingConfirmation, field: EditableField): string {
  const fieldLabel = FIELD_LABELS[field];
  const newValue = getCurrentFieldValue(c, field);
  return `${fieldLabel} actualizado a: *${newValue}*\n\n${renderConfirmationMessage(c)}`;
}

// ── Helpers ─────────────────────────────────────────────

function getEditableFields(c: PendingConfirmation): EditableField[] {
  const fields: EditableField[] = ['amount', 'category', 'vendor', 'date'];
  if (c.fields.items && c.fields.items.length > 0) {
    fields.push('items');
  }
  fields.push('notes');
  return fields;
}

function getCurrentFieldValue(c: PendingConfirmation, field: EditableField): string {
  switch (field) {
    case 'amount': return formatMoney(c.fields.amount);
    case 'category': return c.fields.category || '-';
    case 'vendor': return c.fields.vendor || '-';
    case 'date': return formatDate(c.fields.date);
    case 'notes': return c.fields.notes || '(sin notas)';
    case 'items':
      if (!c.fields.items?.length) return '(sin artículos)';
      return c.fields.items.map(i => `${i.quantity}x ${i.name}`).join(', ');
    default: return '-';
  }
}

export { CATEGORY_OPTIONS, FIELD_LABELS, getEditableFields, formatMoney, formatDate };
