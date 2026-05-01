/**
 * NLU Extractor — deterministic extraction of structured transaction data
 * from transcribed Spanish voice text.
 *
 * All financial field extraction uses regex + validation. No LLM calls.
 *
 * Flow: transcribed text → extractTransaction() → StructuredTransaction
 */

// ── Types ──

export interface ExtractedAmount {
  value: number;
  currency: string;       // ISO 4217: PEN, USD, COP, MXN, BRL
  currencySymbol: string; // S/, $, R$, etc.
  confidence: number;     // 0–1
}

export interface ExtractedDate {
  date: Date;
  original: string;       // the matched text fragment
  isRelative: boolean;
  confidence: number;
}

export type TransactionType = 'sale' | 'expense' | 'payment_received' | 'payment_sent' | 'unknown';

export interface StructuredTransaction {
  type: TransactionType;
  amount: ExtractedAmount | null;
  category: string | null;
  vendor: string | null;
  date: ExtractedDate | null;
  description: string | null;
  confidence: number;     // overall 0–1
  rawText: string;
  extractedFields: string[]; // which fields were found
}

// ── Amount Extraction ──

/** Written Spanish numbers → numeric value */
const SPANISH_NUMBERS: Record<string, number> = {
  cero: 0, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5,
  seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10,
  once: 11, doce: 12, trece: 13, catorce: 14, quince: 15,
  dieciseis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19,
  veinte: 20, veintiuno: 21, veintidos: 22, veintitres: 23,
  veinticuatro: 24, veinticinco: 25, veintiseis: 26, veintisiete: 27,
  veintiocho: 28, veintinueve: 29, treinta: 30, cuarenta: 40,
  cincuenta: 50, sesenta: 60, setenta: 70, ochenta: 80, noventa: 90,
  cien: 100, ciento: 100, doscientos: 200, trescientos: 300,
  cuatrocientos: 400, quinientos: 500, seiscientos: 600,
  setecientos: 700, ochocientos: 800, novecientos: 900,
  mil: 1000,
};

/** Currency indicators → ISO code + symbol */
const CURRENCY_MAP: Array<{ pattern: RegExp; code: string; symbol: string }> = [
  { pattern: /\bsoles?\b/i,                     code: 'PEN', symbol: 'S/' },
  { pattern: /\bs\/\.?\s*/i,                     code: 'PEN', symbol: 'S/' },
  { pattern: /\blucas?\b/i,                      code: 'PEN', symbol: 'S/' },
  { pattern: /\bdolar(?:es)?\b/i,                code: 'USD', symbol: '$' },
  { pattern: /\bpesos?\b/i,                      code: 'MXN', symbol: '$' },  // default peso → MXN
  { pattern: /\bpesos?\s+colombianos?\b/i,       code: 'COP', symbol: '$' },
  { pattern: /\bpesos?\s+mexicanos?\b/i,         code: 'MXN', symbol: '$' },
  { pattern: /\breai?s\b/i,                      code: 'BRL', symbol: 'R$' },
  { pattern: /\br\$\s*/i,                        code: 'BRL', symbol: 'R$' },
  { pattern: /\$\s*/,                            code: 'USD', symbol: '$' },
];

function detectCurrency(text: string): { code: string; symbol: string } {
  for (const entry of CURRENCY_MAP) {
    if (entry.pattern.test(text)) {
      return { code: entry.code, symbol: entry.symbol };
    }
  }
  // Default to PEN for Peru-targeted platform
  return { code: 'PEN', symbol: 'S/' };
}

/**
 * Parse written Spanish number words into a numeric value.
 * Handles compound forms like "treinta y cinco" → 35, "mil quinientos" → 1500.
 */
function parseSpanishNumber(text: string): number | null {
  const cleaned = text.toLowerCase().replace(/\s+y\s+/g, ' ').trim();
  const words = cleaned.split(/\s+/);

  if (words.length === 0) return null;

  let total = 0;
  let current = 0;
  let foundAny = false;

  for (const word of words) {
    const val = SPANISH_NUMBERS[word];
    if (val === undefined) continue;
    foundAny = true;

    if (val === 1000) {
      current = current === 0 ? 1000 : current * 1000;
    } else if (val >= 100) {
      current = current === 0 ? val : current + val;
    } else {
      current += val;
    }
  }

  if (!foundAny) return null;
  total += current;
  return total > 0 ? total : null;
}

/**
 * Extract monetary amounts from text.
 * Handles: "50 soles", "S/ 50.00", "$100", "cincuenta soles", "3.50", etc.
 */
export function extractAmount(text: string): ExtractedAmount | null {
  const currency = detectCurrency(text);

  // Pattern 1: Currency symbol + number — "S/ 50", "S/.50.00", "$100", "R$ 30"
  const symbolPatterns = [
    /s\/\.?\s*(\d+(?:[.,]\d{1,2})?)/i,
    /r\$\s*(\d+(?:[.,]\d{1,2})?)/i,
    /\$\s*(\d+(?:[.,]\d{1,2})?)/,
  ];
  for (const pat of symbolPatterns) {
    const m = text.match(pat);
    if (m) {
      const value = parseFloat(m[1].replace(',', '.'));
      if (value > 0 && value < 1_000_000) {
        return { value, currency: currency.code, currencySymbol: currency.symbol, confidence: 0.95 };
      }
    }
  }

  // Pattern 2: Number + currency word — "50 soles", "100 dolares", "30 pesos"
  const numWordPat = /(\d+(?:[.,]\d{1,2})?)\s*(?:soles?|dolares?|pesos?|lucas?|reai?s)\b/i;
  const m2 = text.match(numWordPat);
  if (m2) {
    const value = parseFloat(m2[1].replace(',', '.'));
    if (value > 0 && value < 1_000_000) {
      return { value, currency: currency.code, currencySymbol: currency.symbol, confidence: 0.95 };
    }
  }

  // Pattern 3: Written number + currency word — "cincuenta soles", "mil doscientos pesos"
  const writtenPat = /([a-záéíóúñ]+(?:\s+y\s+[a-záéíóúñ]+)?(?:\s+[a-záéíóúñ]+)*)\s+(?:soles?|dolares?|pesos?|lucas?|reai?s)\b/i;
  const m3 = text.match(writtenPat);
  if (m3) {
    const numVal = parseSpanishNumber(m3[1]);
    if (numVal !== null && numVal > 0 && numVal < 1_000_000) {
      return { value: numVal, currency: currency.code, currencySymbol: currency.symbol, confidence: 0.85 };
    }
  }

  // Pattern 4: Standalone number (last resort, lower confidence) — "pagué 50"
  const standalonePat = new RegExp(`(?:por|de|pagu[eé]|cobr[eé]|gast[eé]|recib[ií]|vend[ií]|cost[oó])\\s+(\\d+(?:[.,]\\d{1,2})?)\\b`, 'i');
  const m4 = text.match(standalonePat);
  if (m4) {
    const value = parseFloat(m4[1].replace(',', '.'));
    if (value > 0 && value < 1_000_000) {
      return { value, currency: currency.code, currencySymbol: currency.symbol, confidence: 0.7 };
    }
  }

  return null;
}

// ── Transaction Type Detection ──

// Note: JS \b treats accented chars (áéíóú) as non-word chars.
// Use (?![a-záéíóúñ]) instead of trailing \b after accented endings.
const ES_BOUNDARY = '(?![a-záéíóúñA-ZÁÉÍÓÚÑ])';
const TYPE_PATTERNS: Array<{ pattern: RegExp; type: TransactionType; confidence: number }> = [
  // Sales
  { pattern: new RegExp(`\\bvend[ií]${ES_BOUNDARY}`, 'i'),              type: 'sale',             confidence: 0.95 },
  { pattern: /\bventa\s+de\b/i,                                         type: 'sale',             confidence: 0.90 },
  { pattern: new RegExp(`\\bcobr[eé]${ES_BOUNDARY}`, 'i'),              type: 'sale',             confidence: 0.90 },
  { pattern: new RegExp(`\\bfactur[eé]${ES_BOUNDARY}`, 'i'),            type: 'sale',             confidence: 0.90 },
  { pattern: /\bse\s+vendieron?\b/i,                                    type: 'sale',             confidence: 0.85 },
  { pattern: /\bingreso\s+de\b/i,                                       type: 'sale',             confidence: 0.80 },
  // Expenses
  { pattern: new RegExp(`\\bcompr[eé]${ES_BOUNDARY}`, 'i'),             type: 'expense',          confidence: 0.95 },
  { pattern: new RegExp(`\\bgast[eé]${ES_BOUNDARY}`, 'i'),              type: 'expense',          confidence: 0.95 },
  { pattern: new RegExp(`\\bpagu[eé]${ES_BOUNDARY}`, 'i'),              type: 'expense',          confidence: 0.90 },
  { pattern: /\bgasto\s+de\b/i,                                         type: 'expense',          confidence: 0.90 },
  { pattern: /\bcompra\s+de\b/i,                                        type: 'expense',          confidence: 0.90 },
  { pattern: new RegExp(`\\binvert[ií]${ES_BOUNDARY}`, 'i'),            type: 'expense',          confidence: 0.85 },
  // Payment received
  { pattern: new RegExp(`\\bme\\s+pag(?:aron|ó)${ES_BOUNDARY}`, 'i'),   type: 'payment_received', confidence: 0.95 },
  { pattern: new RegExp(`\\bme\\s+deposit(?:aron|ó)${ES_BOUNDARY}`, 'i'), type: 'payment_received', confidence: 0.95 },
  { pattern: new RegExp(`\\brecib[ií]\\s+(?:un\\s+)?pago\\b`, 'i'),     type: 'payment_received', confidence: 0.90 },
  { pattern: new RegExp(`\\bme\\s+transfir(?:ieron|ió)${ES_BOUNDARY}`, 'i'), type: 'payment_received', confidence: 0.90 },
  // Payment sent
  { pattern: new RegExp(`\\btransfer[ií]${ES_BOUNDARY}`, 'i'),          type: 'payment_sent',     confidence: 0.85 },
  { pattern: /\bhice\s+(?:un\s+)?pago\b/i,                              type: 'payment_sent',     confidence: 0.85 },
  { pattern: new RegExp(`\\bdeposit[eé]${ES_BOUNDARY}`, 'i'),           type: 'payment_sent',     confidence: 0.85 },
];

function detectTransactionType(text: string): { type: TransactionType; confidence: number } {
  for (const entry of TYPE_PATTERNS) {
    if (entry.pattern.test(text)) {
      return { type: entry.type, confidence: entry.confidence };
    }
  }
  return { type: 'unknown', confidence: 0.3 };
}

// ── Category Classification ──

const CATEGORY_KEYWORDS: Array<{ keywords: string[]; category: string }> = [
  { keywords: ['arroz', 'azucar', 'aceite', 'fideos', 'leche', 'huevos', 'pan', 'harina', 'pollo', 'carne', 'pescado', 'verdura', 'fruta', 'comida', 'alimento', 'abarrotes'], category: 'food' },
  { keywords: ['agua', 'luz', 'gas', 'internet', 'telefono', 'celular', 'cable', 'electricidad', 'recibo'], category: 'utilities' },
  { keywords: ['taxi', 'moto', 'uber', 'gasolina', 'pasaje', 'bus', 'transporte', 'flete', 'envio', 'delivery'], category: 'transport' },
  { keywords: ['alquiler', 'renta', 'local', 'tienda', 'almacen'], category: 'rent' },
  { keywords: ['sueldo', 'salario', 'pago empleado', 'nomina', 'planilla', 'jornal'], category: 'salary' },
  { keywords: ['material', 'materiales', 'herramienta', 'herramientas', 'equipo', 'equipos', 'maquina', 'repuesto', 'repuestos', 'insumo', 'insumos'], category: 'supplies' },
  { keywords: ['inventario', 'mercaderia', 'stock', 'producto', 'mercancia'], category: 'inventory' },
  { keywords: ['servicio', 'reparacion', 'mantenimiento', 'limpieza', 'instalacion'], category: 'services' },
  { keywords: ['impuesto', 'sunat', 'tributo', 'igv', 'renta'], category: 'taxes' },
  { keywords: ['publicidad', 'anuncio', 'marketing', 'promocion', 'volante', 'banner'], category: 'marketing' },
  { keywords: ['medicina', 'farmacia', 'salud', 'medico', 'doctor', 'clinica', 'hospital'], category: 'health' },
  { keywords: ['seguro', 'poliza', 'cobertura'], category: 'insurance' },
  { keywords: ['papel', 'tinta', 'oficina', 'cuaderno', 'lapicero', 'impresora'], category: 'office' },
  { keywords: ['prestamo', 'credito', 'deuda', 'cuota', 'interes', 'fiado'], category: 'finance' },
];

/** Cache compiled keyword regexes for performance */
const _kwRegexCache = new Map<string, RegExp>();
function kwRegex(keyword: string): RegExp {
  let re = _kwRegexCache.get(keyword);
  if (!re) {
    // Multi-word keywords: flexible whitespace matching
    // Single words: \b start + allow Spanish plural suffixes (es/s) at end
    re = keyword.includes(' ')
      ? new RegExp(`\\b${keyword.replace(/\s+/g, '\\s+')}`, 'i')
      : new RegExp(`\\b${keyword}(?:es|s)?\\b`, 'i');
    _kwRegexCache.set(keyword, re);
  }
  return re;
}

function classifyCategory(text: string): { category: string; confidence: number } | null {
  let bestMatch: { category: string; matchCount: number } | null = null;

  for (const entry of CATEGORY_KEYWORDS) {
    let matchCount = 0;
    for (const kw of entry.keywords) {
      if (kwRegex(kw).test(text)) matchCount++;
    }
    if (matchCount > 0 && (!bestMatch || matchCount > bestMatch.matchCount)) {
      bestMatch = { category: entry.category, matchCount };
    }
  }

  if (!bestMatch) return null;
  // Confidence scales with match count
  const confidence = Math.min(0.95, 0.7 + bestMatch.matchCount * 0.1);
  return { category: bestMatch.category, confidence };
}

// ── Vendor/Merchant Extraction ──

/**
 * Extract vendor/merchant name using preposition patterns common in spoken Spanish.
 * "compré arroz en la tienda Don José" → "tienda Don José"
 * "le pagué a María" → "María"
 * "de Mercado Central" → "Mercado Central"
 */
export function extractVendor(text: string): { vendor: string; confidence: number } | null {
  const patterns: Array<{ pattern: RegExp; group: number; confidence: number }> = [
    // "en [la/el] <vendor>" — "en la tienda Don José", "en el mercado"
    { pattern: /\ben\s+(?:la|el)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+(?:de\s+)?[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)*)/,  group: 1, confidence: 0.85 },
    // "a Don/Doña <name>" — "a Don Pedro", "a Doña María"
    { pattern: /\ba\s+(Do[nñ]a?\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)?)/,             group: 1, confidence: 0.90 },
    // "a <Name>" (capitalized) — "le pagué a Carlos"
    { pattern: /\ba\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)?)\b/,                       group: 1, confidence: 0.75 },
    // "de <Name>" — "compré de Mercado Central"
    { pattern: /\bde\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)*)\b/,                      group: 1, confidence: 0.70 },
    // "con <Name>" — "con el proveedor Juan"
    { pattern: /\bcon\s+(?:el\s+)?(?:proveedor|señor|señora)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)?)/i, group: 1, confidence: 0.85 },
  ];

  // Ignore these common words that match vendor patterns but aren't vendors
  const STOP_WORDS = new Set([
    'Hoy', 'Ayer', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes',
    'Sabado', 'Domingo', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo',
    'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    'Que', 'Como', 'Cuando', 'Donde', 'Para', 'Por', 'Con', 'Sin',
  ]);

  for (const { pattern, group, confidence } of patterns) {
    const match = text.match(pattern);
    if (match && match[group]) {
      const vendor = match[group].trim();
      if (vendor.length >= 2 && !STOP_WORDS.has(vendor)) {
        return { vendor, confidence };
      }
    }
  }

  return null;
}

// ── Date Parsing ──

const DAY_NAMES: Record<string, number> = {
  domingo: 0, lunes: 1, martes: 2, miercoles: 3, miércoles: 3,
  jueves: 4, viernes: 5, sabado: 6, sábado: 6,
};

const MONTH_NAMES: Record<string, number> = {
  enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
  julio: 6, agosto: 7, septiembre: 8, setiembre: 8, octubre: 9,
  noviembre: 10, diciembre: 11,
};

/**
 * Parse dates from Spanish text — both relative ("ayer", "el lunes") and absolute ("15 de marzo").
 * All relative dates resolve against `referenceDate` (defaults to now).
 */
export function extractDate(text: string, referenceDate?: Date): ExtractedDate | null {
  const now = referenceDate ?? new Date();
  const lower = text.toLowerCase();

  // Relative: hoy
  if (/\bhoy\b/.test(lower)) {
    return { date: startOfDay(now), original: 'hoy', isRelative: true, confidence: 0.95 };
  }

  // Relative: ayer
  if (/\bayer\b/.test(lower)) {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    return { date: startOfDay(d), original: 'ayer', isRelative: true, confidence: 0.95 };
  }

  // Relative: anteayer / antes de ayer
  if (/\b(?:anteayer|antes\s+de\s+ayer)\b/.test(lower)) {
    const d = new Date(now);
    d.setDate(d.getDate() - 2);
    return { date: startOfDay(d), original: 'anteayer', isRelative: true, confidence: 0.95 };
  }

  // Relative: la semana pasada
  if (/\bla\s+semana\s+pasada\b/.test(lower)) {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return { date: startOfDay(d), original: 'la semana pasada', isRelative: true, confidence: 0.75 };
  }

  // Relative: hace N días
  const haceMatch = lower.match(/\bhace\s+(\d+)\s+d[ií]as?\b/);
  if (haceMatch) {
    const d = new Date(now);
    d.setDate(d.getDate() - parseInt(haceMatch[1]));
    return { date: startOfDay(d), original: haceMatch[0], isRelative: true, confidence: 0.90 };
  }

  // Relative: el <day name> — resolves to most recent occurrence
  const dayMatch = lower.match(/\b(?:el\s+)?(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\b/);
  if (dayMatch) {
    const targetDay = DAY_NAMES[dayMatch[1].replace('é', 'e').replace('á', 'a')];
    if (targetDay !== undefined) {
      const d = new Date(now);
      const currentDay = d.getDay();
      let diff = currentDay - targetDay;
      if (diff <= 0) diff += 7; // go back to last occurrence
      d.setDate(d.getDate() - diff);
      return { date: startOfDay(d), original: dayMatch[0], isRelative: true, confidence: 0.85 };
    }
  }

  // Relative: este mes / el mes pasado
  if (/\bel\s+mes\s+pasado\b/.test(lower)) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - 1, 1);
    return { date: startOfDay(d), original: 'el mes pasado', isRelative: true, confidence: 0.65 };
  }

  // Absolute: "15 de marzo", "3 de enero del 2025"
  const absMatch = lower.match(/(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)(?:\s+(?:del?\s+)?(\d{4}))?/);
  if (absMatch) {
    const day = parseInt(absMatch[1]);
    const month = MONTH_NAMES[absMatch[2]];
    const year = absMatch[3] ? parseInt(absMatch[3]) : now.getFullYear();
    if (month !== undefined && day >= 1 && day <= 31) {
      const d = new Date(year, month, day);
      // Validate the date is real (e.g. not Feb 31)
      if (d.getMonth() === month && d.getDate() === day) {
        return { date: d, original: absMatch[0], isRelative: false, confidence: 0.95 };
      }
    }
  }

  // Absolute: DD/MM or DD/MM/YYYY
  const slashMatch = text.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (slashMatch) {
    const day = parseInt(slashMatch[1]);
    const month = parseInt(slashMatch[2]) - 1; // 0-indexed
    let year = slashMatch[3] ? parseInt(slashMatch[3]) : now.getFullYear();
    if (year < 100) year += 2000;
    if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
      const d = new Date(year, month, day);
      if (d.getMonth() === month && d.getDate() === day) {
        return { date: d, original: slashMatch[0], isRelative: false, confidence: 0.90 };
      }
    }
  }

  return null;
}

function startOfDay(d: Date): Date {
  const result = new Date(d);
  result.setHours(0, 0, 0, 0);
  return result;
}

// ── Main Extraction ──

/**
 * Extract a structured transaction from transcribed voice text.
 * Purely deterministic — no LLM calls. Suitable for financial data.
 */
export function extractTransaction(text: string, referenceDate?: Date): StructuredTransaction {
  const extractedFields: string[] = [];

  // 1. Transaction type
  const { type, confidence: typeConf } = detectTransactionType(text);
  if (type !== 'unknown') extractedFields.push('type');

  // 2. Amount
  const amount = extractAmount(text);
  if (amount) extractedFields.push('amount');

  // 3. Category
  const categoryResult = classifyCategory(text);
  if (categoryResult) extractedFields.push('category');

  // 4. Vendor
  const vendorResult = extractVendor(text);
  if (vendorResult) extractedFields.push('vendor');

  // 5. Date
  const dateResult = extractDate(text, referenceDate);
  if (dateResult) extractedFields.push('date');

  // 6. Description — use the raw text, stripped of extracted entities, as a fallback description
  const description = text.trim() || null;

  // 7. Overall confidence — weighted average of extracted fields
  const confidences: number[] = [typeConf];
  if (amount) confidences.push(amount.confidence);
  if (categoryResult) confidences.push(categoryResult.confidence);
  if (vendorResult) confidences.push(vendorResult.confidence);
  if (dateResult) confidences.push(dateResult.confidence);

  const overallConfidence = confidences.length > 0
    ? confidences.reduce((a, b) => a + b, 0) / confidences.length
    : 0;

  return {
    type,
    amount,
    category: categoryResult?.category ?? null,
    vendor: vendorResult?.vendor ?? null,
    date: dateResult,
    description,
    confidence: Math.round(overallConfidence * 100) / 100,
    rawText: text,
    extractedFields,
  };
}
