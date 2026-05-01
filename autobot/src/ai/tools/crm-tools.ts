import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { logger } from '../../shared/logger.js';
import { createERPNextConnector } from '../../agant-connectors/erpnext/index.js';

// Initialize the ERPNext connector pointing to our local compose stack
const erpnext = createERPNextConnector({
  baseUrl: process.env.ERPNEXT_URL || 'http://erpnext:8000',
  apiKey: process.env.ERPNEXT_API_KEY || 'admin',
  apiSecret: process.env.ERPNEXT_API_SECRET || 'admin',
});

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
        const existing = await erpnext.actions.listCustomers(customer_name, 1);
        if (existing && existing.length > 0) {
          customer = existing[0];
        } else {
          customer = await erpnext.actions.createCustomer({
            customer_name,
            phone: phone || '',
          });
        }
      } catch (err) {
        logger.error({ err }, 'Error fetching/creating customer in CRM');
        // We'll proceed with the name as a string, ERPNext might accept it or fail on the invoice
      }

      // 2. Create the Sales Invoice
      const invoice = await erpnext.actions.createSalesInvoice({
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
