/**
 * Validate E.164 phone number format.
 */
export function isE164Phone(phone: string): boolean {
  return /^\+?[1-9]\d{9,14}$/.test(phone.replace(/[\s\-()]/g, ''));
}

/**
 * Convert phone number to WhatsApp JID, returns null if invalid.
 */
export function phoneToJid(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) return null;
  return `${digits}@s.whatsapp.net`;
}

/**
 * Validate a JID string format.
 */
export function isValidJid(jid: string): boolean {
  return /^\d{10,15}@s\.whatsapp\.net$/.test(jid);
}

/**
 * Sanitize and validate a JID from user input.
 * Accepts phone numbers or full JIDs.
 */
export function sanitizeJid(input: string): string | null {
  if (input.includes('@')) {
    return isValidJid(input) ? input : null;
  }
  return phoneToJid(input);
}
