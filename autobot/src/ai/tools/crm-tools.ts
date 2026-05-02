import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { logger } from '../../shared/logger.js';
import { createERPNextConnector } from '../../agant-connectors/erpnext/index.js';
import { requireSecret } from '../../shared/secrets.js';

// Lazy ERPNext connector — only constructed (and only requires secrets) when
// the agent first calls a CRM tool. Avoids breaking dev/test boots that have
// no ERPNext deployed.
let _erpnext: ReturnType<typeof createERPNextConnector> | null = null;
function erpnextClient(): ReturnType<typeof createERPNextConnector> {
  if (_erpnext) return _erpnext;
  _erpnext = createERPNextConnector({
    baseUrl: process.env.ERPNEXT_URL || 'http://erpnext:8000',
    apiKey: requireSecret('ERPNEXT_API_KEY'),
    apiSecret: requireSecret('ERPNEXT_API_SECRET'),
  });
  return _erpnext;
}

/**
 * Record a sale in the Agant CRM (ERPNext).
 */
export const recordSaleInCRM = createTool({
  id: 'record-sale-in-crm',
  description: 'Records a completed sale in the company CRM (ERPNext) to update inventory and generate an invoice.',
  inputSchema: z.object({
    customer_name: z.string().describe('The name of the customer who made the purchase.'),
    phone: z.string().optional().describe('The phone number (WhatsApp) of the customer.'),
    items: z.array(
      z.object({
        item_code: z.string().describe('The product ID or code being sold (e.g., "SHIRT-01").'),
        qty: z.number().describe('Quantity of the product.'),
        rate: z.number().describe('Price per unit.'),
      })
    ).describe('The items being purchased.'),
  }),
  execute: async ({ customer_name, phone, items }) => {
    try {
      logger.info({ customer_name, items }, 'Recording sale in CRM...');

      // 1. Ensure customer exists
      let customer;
      try {
        const existing = await erpnextClient().actions.listCustomers(customer_name, 1);
        if (existing && existing.length > 0) {
          customer = existing[0];
        } else {
          customer = await erpnextClient().actions.createCustomer({
            customer_name,
            phone: phone || '',
          });
        }
      } catch (err) {
        logger.error({ err }, 'Error fetching/creating customer in CRM');
        // We'll proceed with the name as a string, ERPNext might accept it or fail on the invoice
      }

      // 2. Create the Sales Invoice
      const invoice = await erpnextClient().actions.createSalesInvoice({
        customer: customer?.name || customer_name,
        items: items,
      });

      logger.info({ invoiceName: invoice.name }, 'Successfully created invoice in CRM.');

      return {
        success: true,
        invoice_id: invoice.name,
        message: `Venta registrada exitosamente en el CRM con el número de factura ${invoice.name}.`,
      };
    } catch (err: any) {
      logger.error({ err }, 'Failed to record sale in CRM');
      return {
        success: false,
        error: err.message || 'Unknown error occurred while contacting the CRM.',
      };
    }
  },
});

export const crmTools = { recordSaleInCRM };
