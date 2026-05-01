/**
 * Issue a Peruvian boleta (SUNAT doc type 03) for a confirmed payment.
 *
 * Called from the yayapay webhook handler after the payment intent flips
 * to 'confirmed'. Idempotent end-to-end: we persist the result keyed on
 * the intent id, and Nubefact rejects duplicate (serie, numero) anyway.
 */

import { sendInvoice } from '@/lib/sunat/nubefact';
import { buildItemFromTotal, sumItems } from '@/lib/sunat/igv';
import type { SunatInvoice, Customer } from '@/lib/sunat/types';
import {
  nubefactConfig,
  issuerSupplier,
  deriveBoletaNumero,
  BOLETA_SERIE,
} from './config';
import { attachBoleta } from '@/lib/subscriptions';

export interface IssueBoletaInput {
  userId: string;
  userName: string;
  intentId: string;
  amountCents: number; // total with IGV
  description: string;
}

export interface IssueBoletaResult {
  ok: boolean;
  serie: string;
  numero: number;
  pdfUrl: string | null;
  aceptada: boolean | null;
  message?: string;
}

/**
 * Build and send the boleta. Safe to retry — serie+numero are derived
 * deterministically from intentId, and our DB write is ON CONFLICT DO NOTHING.
 */
export async function issueBoletaForIntent(
  input: IssueBoletaInput,
): Promise<IssueBoletaResult> {
  const config = nubefactConfig();
  const emisor = issuerSupplier();

  const numero = deriveBoletaNumero(input.intentId);
  const amountSoles = input.amountCents / 100;

  // For a boleta to end consumers without a DNI on file, SUNAT permits
  // "Sin documento" (tipoDocumento '0') and a descriptive razonSocial.
  const receptor: Customer = {
    tipoDocumento: '0',
    numDocumento: '0',
    razonSocial: input.userName.slice(0, 100) || 'CLIENTE VARIOS',
  };

  // Single line item with IGV-inclusive price. buildItemFromTotal handles
  // the 18% extraction.
  const item = buildItemFromTotal(
    1,
    input.description.slice(0, 250),
    amountSoles,
    'ZZ', // Servicio (unidad ZZ = servicios en general)
  );
  const totals = sumItems([item]);

  const now = new Date();
  const isoDate = now.toISOString().slice(0, 10); // YYYY-MM-DD
  const isoTime = now.toISOString().slice(11, 19); // HH:MM:SS

  const invoice: SunatInvoice = {
    tipoDocumento: '03',
    serie: BOLETA_SERIE,
    numero,
    fechaEmision: isoDate,
    horaEmision: isoTime,
    moneda: 'PEN',
    emisor,
    receptor,
    items: [item],
    totalGravado: totals.totalGravado,
    totalIgv: totals.totalIgv,
    totalVenta: totals.totalVenta,
    formaPago: 'Contado',
    observaciones: `Ref. pago yayapay: ${input.intentId}`,
  };

  try {
    const response = await sendInvoice(config, invoice);

    await attachBoleta({
      userId: input.userId,
      intentId: input.intentId,
      serie: BOLETA_SERIE,
      numero,
      pdfUrl: response.enlace ?? null,
      xmlUrl: response.enlace_del_xml ?? null,
      hash: response.codigo_hash ?? null,
      aceptada: response.aceptada_por_sunat ?? null,
      amountCents: input.amountCents,
      currency: 'PEN',
      sunatMessage: response.sunat_description ?? null,
      rawResponse: response,
    });

    return {
      ok: true,
      serie: BOLETA_SERIE,
      numero,
      pdfUrl: response.enlace ?? null,
      aceptada: response.aceptada_por_sunat ?? null,
      message: response.sunat_description,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      JSON.stringify({
        level: 'error',
        component: 'billing/issue-boleta',
        msg: 'Nubefact issuance failed',
        intent_id: input.intentId,
        serie: BOLETA_SERIE,
        numero,
        error: message,
      }),
    );
    return {
      ok: false,
      serie: BOLETA_SERIE,
      numero,
      pdfUrl: null,
      aceptada: false,
      message,
    };
  }
}
