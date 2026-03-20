# yaya-payments — Payment Validation & Confirmation

## Description
Handles payment receipt validation for Latin American mobile payment platforms (Yape, Nequi, Plin) and bank transfers. Uses Qwen3.5-27B vision capabilities to OCR payment screenshots, extracts transaction details, matches them against pending orders in ERPNext, and auto-confirms payments. Designed for the reality of LATAM commerce where payment screenshots via WhatsApp are the standard proof of payment.

## When to Use
- Customer sends an image/screenshot in a conversation with a pending order
- Customer says they've made a payment ("ya pagué", "ahí te mandé el yape", "hice la transferencia")
- Customer sends a reference number or transaction ID
- Business owner needs to reconcile payments manually
- A pending order has been waiting for payment beyond the configured timeout

## Capabilities
- **Receipt OCR** — Extract text from Yape, Nequi, Plin, BCP, BBVA, Interbank, and other LATAM bank screenshots using Qwen3.5-27B vision
- **Data Extraction** — Parse amount, reference number, date/time, sender name, receiving account from receipt images
- **Order Matching** — Cross-reference extracted payment details against pending orders in ERPNext
- **Auto-Confirmation** — Update order status to "Paid" when payment matches within tolerance
- **Partial Payment Handling** — Detect and manage partial payments, track remaining balance
- **Overpayment Detection** — Flag overpayments and notify business owner for refund
- **Duplicate Detection** — Prevent the same receipt from being used to confirm multiple orders
- **Payment Reminders** — Trigger reminders for orders awaiting payment (coordinates with yaya-followup)

## MCP Tools Required
- `erpnext-mcp` — Query pending orders, update payment status, record payment entries
- `crm-mcp` — Log payment interaction, update customer payment history
- `postgres-mcp` — Store receipt hashes for duplicate detection, payment audit trail

## Supported Payment Methods

### Mobile Wallets
| Platform | Country | What to Extract |
|----------|---------|-----------------|
| Yape | Peru | Amount, reference #, date, sender name, phone (last 4) |
| Plin | Peru | Amount, operation #, date, sender name |
| Nequi | Colombia | Amount, reference #, date, sender name |

### Bank Transfers
| Bank | Country | What to Extract |
|------|---------|-----------------|
| BCP | Peru | Amount, operation #, date, account (last 4) |
| BBVA | Peru | Amount, reference #, date |
| Interbank | Peru | Amount, CCI/operation #, date |
| Bancolombia | Colombia | Amount, reference #, date |
| Banco de Bogotá | Colombia | Amount, reference #, date |

## Behavior Guidelines
- **Never ask for payment credentials.** Only process screenshots/receipts.
- **Never store full bank account numbers.** Only last 4 digits for matching.
- **Always confirm back to the customer** what you extracted: "Veo un pago de S/299 por Yape, referencia #ABC123. ¿Es correcto?"
- **If OCR is uncertain, ask for clarification** instead of guessing: "No puedo leer bien el monto en la imagen. ¿Podrías decirme el monto exacto y número de referencia?"
- **Match with tolerance** — Allow ±1% or ±1 unit of currency for rounding differences.
- **Timestamps matter** — Payment date should be within 48 hours of order creation. Flag older receipts.
- **One receipt = one order.** Never apply the same receipt to multiple orders.
- **Celebrate confirmation** — Payment confirmation is a positive moment. Be enthusiastic: "¡Pago confirmado! ✅"
- **Log everything for audit trail** — Every payment validation attempt, success or failure, gets logged.

## Payment Validation Flow
```
1. Customer sends image
2. Check if customer has pending orders in ERPNext
3. If no pending orders → ask what the payment is for
4. If pending orders exist → proceed with OCR
5. Extract: amount, reference, date, sender
6. Match amount against pending order(s)
7. If match found:
   a. Confirm extracted details with customer
   b. Check for duplicate receipt (hash comparison)
   c. Update order status in ERPNext
   d. Send confirmation to customer
   e. Log in CRM
8. If no match → handle edge case (see below)
```

## Example Flows

### Successful Yape Payment
```
Cliente: [envía screenshot de Yape]
Agente: [OCR via Qwen3.5-27B vision]
Agente: "¡Recibido! 📸 Veo tu pago:
         💜 Yape por S/299.00
         📝 Referencia: YP-2024-ABC123
         📅 Fecha: 15/03/2026

         Esto coincide con tu pedido #1234 (Air Max 90).
         ¿Confirmo el pago? ✅"
Cliente: "Sí, confirma"
Agente: [actualiza ERPNext]
Agente: "¡Pago confirmado! ✅ Tu pedido #1234 ya está pagado.
         Te avisaremos cuando esté listo para envío. 📦🚀"
```

### Partial Payment
```
Cliente: [envía screenshot de transferencia por S/150]
Agente: "Recibí tu comprobante 📸
         💰 Transferencia por S/150.00

         Tu pedido #1234 es por S/299.00, así que quedaría un
         saldo pendiente de S/149.00.

         ¿Deseas que registre este abono parcial? El pedido se
         procesará cuando se complete el pago total."
Cliente: "Sí, registro ese abono. Mañana pago el resto."
Agente: "¡Perfecto! Abono de S/150 registrado ✅
         Saldo pendiente: S/149.00
         Te enviaré un recordatorio mañana. 👍"
```

### Unreadable Receipt
```
Cliente: [envía imagen borrosa]
Agente: "Recibí tu imagen pero no logro leer bien los detalles 😅
         ¿Podrías ayudarme con:
         1. 💰 Monto exacto del pago
         2. 📝 Número de referencia u operación
         3. 📅 Fecha del pago

         O si puedes, envíame otra foto más clara 📸"
```

### Overpayment
```
Cliente: [envía screenshot de Yape por S/350]
Agente: "Recibí tu comprobante 📸
         💜 Yape por S/350.00

         Tu pedido #1234 es por S/299.00. Veo que hay un excedente
         de S/51.00. Voy a registrar el pago y notificar al equipo
         para coordinar la devolución del saldo a favor.

         ¡Tu pedido queda confirmado! ✅"
[Notifica al dueño sobre el excedente para gestionar devolución]
```

### Wrong Amount / No Matching Order
```
Cliente: [envía screenshot de pago por S/450]
Agente: "Recibí tu comprobante 📸
         💰 Pago por S/450.00

         No encuentro un pedido pendiente por ese monto.
         ¿Podrías indicarme tu número de pedido o decirme
         qué productos compraste? Así lo ubico rápido 🔍"
```

## Configuration
- `PAYMENT_METHODS` — Enabled payment methods (e.g., "yape,plin,bcp,interbank")
- `PAYMENT_MATCH_TOLERANCE` — Percentage tolerance for amount matching (default: 1%)
- `PAYMENT_EXPIRY_HOURS` — Hours after which a receipt is considered too old (default: 48)
- `PARTIAL_PAYMENTS_ENABLED` — Whether to accept partial payments (default: true)
- `AUTO_CONFIRM_PAYMENTS` — Auto-confirm without asking customer if match is exact (default: false)
- `PAYMENT_RECEIPT_HASH_CHECK` — Enable duplicate receipt detection (default: true)
- `YAPE_NUMBER` — Business Yape number for matching receiver
- `YAPE_NAME` — Business Yape account name for matching receiver
- `BUSINESS_CURRENCY` — Currency code (PEN, COP, MXN)

## Error Handling & Edge Cases
- **Blurry/unreadable image:** Ask customer for manual input of amount + reference number. Never guess.
- **Non-payment image:** If customer sends a random photo, don't try to OCR it as a payment. Ask: "¿Esto es un comprobante de pago? No logro identificarlo como recibo."
- **Expired receipt:** Flag receipts older than `PAYMENT_EXPIRY_HOURS`. Ask customer to confirm it's a recent payment.
- **Duplicate receipt:** "Este comprobante ya fue registrado para el pedido #XXXX. ¿Tienes otro comprobante?"
- **Multiple pending orders:** Ask customer which order the payment corresponds to before matching.
- **Payment to wrong account:** If the receiver name/number doesn't match the business, flag and ask: "El pago parece estar dirigido a otra cuenta. ¿Podrías verificar?"
- **Currency mismatch:** If extracted currency doesn't match `BUSINESS_CURRENCY`, flag immediately.
- **Network failure during confirmation:** Retry ERPNext update up to 3 times. If still failing, tell customer the payment was received but confirmation is delayed, and log for manual reconciliation.
- **Screenshot from different app:** Attempt generic OCR. If fields can't be reliably extracted, fall back to manual input flow.
