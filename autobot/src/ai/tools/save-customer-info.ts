import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import * as customersRepo from '../../db/customers-repo.js';
import { getTenantId, getJid, getChannel, type YayaToolContext } from './types.js';

export const saveCustomerInfoTool = createTool({
  id: 'save_customer_info',
  description: 'Save or update customer information such as name, phone number, location, or address. Use this whenever the customer shares personal info.',
  inputSchema: z.object({
    name: z.string().optional().describe('Customer name'),
    phone: z.string().optional().describe('Customer phone number'),
    location: z.string().optional().describe('Location name or description'),
    address: z.string().optional().describe('Full delivery address'),
    location_lat: z.number().optional().describe('Latitude coordinate'),
    location_lng: z.number().optional().describe('Longitude coordinate'),
  }),
  execute: async (input, context: YayaToolContext) => {
    const tenantId = getTenantId(context);
    const jid = getJid(context);
    const channel = getChannel(context);

    const customer = await customersRepo.getOrCreateCustomer(tenantId, jid, channel);
    const updates: Record<string, unknown> = {};
    if (input.name) updates.name = input.name;
    if (input.phone) updates.phone = input.phone;
    if (input.location) updates.location = input.location;
    if (input.address) updates.address = input.address;
    if (input.location_lat) updates.locationLat = input.location_lat;
    if (input.location_lng) updates.locationLng = input.location_lng;

    const updated = await customersRepo.updateCustomer(tenantId, customer.id, updates);
    const saved = Object.entries(updates).map(([k, v]) => `${k}: ${v}`).join(', ');
    return `Customer info saved: ${saved}`;
  },
});
