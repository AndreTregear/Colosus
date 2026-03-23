/**
 * PII Scrubber — removes personally identifiable information from
 * conversation trajectories before they enter the RL training pipeline.
 *
 * The RL system learns behavioral patterns (how to query, format, respond)
 * NOT customer data (names, phones, amounts).
 */

// ── Peruvian phone numbers ──
// +51 9XX XXX XXX, 51 9XXXXXXXX, 9XXXXXXXX (with optional separators)
const PHONE_RE = /(?:\+?51[\s-]?)?9\d{2}[\s-]?\d{3}[\s-]?\d{3}\b/g;

// ── Email addresses ──
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// ── RUC numbers: 10XXXXXXXXX or 20XXXXXXXXX (11 digits) ──
const RUC_RE = /\b(?:10|20)\d{9}\b/g;

// ── DNI numbers: 8-digit numbers preceded by context clues ──
const DNI_RE = /\b(?:DNI|dni|documento)[:\s]*(\d{8})\b/g;
const DNI_STANDALONE_RE = /\b\d{8}\b/g;

// ── Amounts: S/XXX.XX, S/.XXX, S/ XXX, or bare currency patterns ──
const AMOUNT_RE = /S\/\.?\s?\d{1,3}(?:[,.]?\d{3})*(?:\.\d{1,2})?/g;

// ── Names after common Peruvian/Spanish patterns ──
// 'Cliente:', 'para', 'de', 'a nombre de', 'señor/a', 'sr./sra.'
const NAME_CONTEXT_RE =
  /(?:Cliente|cliente|Para|para|De|de|A nombre de|a nombre de|Señora?|señora?|Sra?\.?|sra?\.?|Sr\.?|sr\.?|Don|don|Doña|doña)[:\s]+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){0,3})/g;

// ── Yape/Plin sender names (typically "de <Name>") ──
const YAPE_SENDER_RE =
  /(?:Yape|yape|Plin|plin)\s+(?:de|De)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){0,2})/g;

/**
 * Scrub PII from a single text string.
 * Order matters: more specific patterns first to avoid partial matches.
 */
export function scrubPII(text: string): string {
  let result = text;

  // 1. Emails (most specific pattern)
  result = result.replace(EMAIL_RE, '[EMAIL]');

  // 2. RUC (11-digit, before DNI to avoid partial overlap)
  result = result.replace(RUC_RE, '[RUC]');

  // 3. DNI with context keyword
  result = result.replace(DNI_RE, (_match, digits: string) => {
    void digits;
    return '[DNI]';
  });

  // 4. Phone numbers (before standalone 8-digit catch)
  result = result.replace(PHONE_RE, '[PHONE]');

  // 5. Amounts
  result = result.replace(AMOUNT_RE, '[AMOUNT]');

  // 6. Yape/Plin sender names
  result = result.replace(YAPE_SENDER_RE, (match, _name: string) =>
    match.replace(_name, '[CUSTOMER_NAME]'),
  );

  // 7. Names after context patterns
  result = result.replace(NAME_CONTEXT_RE, (match, name: string) =>
    match.replace(name, '[CUSTOMER_NAME]'),
  );

  // 8. Standalone 8-digit numbers that survived (potential DNIs)
  // Only replace if preceded by whitespace or start of string to avoid false positives
  result = result.replace(DNI_STANDALONE_RE, (match, offset: number) => {
    // Don't replace if it's part of a larger number or already replaced
    const before = result[offset - 1];
    if (before && /\d/.test(before)) return match;
    return '[DNI]';
  });

  return result;
}

/**
 * Scrub PII from an entire conversation (array of messages).
 * Returns a new array — does not mutate the original.
 */
export function scrubConversation(
  messages: Array<{ role: string; content: string }>,
): Array<{ role: string; content: string }> {
  return messages.map((msg) => ({
    role: msg.role,
    content: scrubPII(msg.content),
  }));
}
