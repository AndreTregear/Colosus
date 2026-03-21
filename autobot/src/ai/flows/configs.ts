import type { BusinessType, BusinessFlowConfig } from './types.js';

export const FLOW_CONFIGS: Record<BusinessType, BusinessFlowConfig> = {
  // ── Retail (sneaker shop, food store, general e-commerce) ──
  retail: {
    type: 'retail',
    goals: [
      'Help customers browse and buy products',
      'Complete product sales efficiently',
      'Maximize order value through relevant suggestions',
      'Ensure payment collection via Yape',
    ],
    guidelines: [
      'Help customers browse and choose products from the catalog',
      'When a product has a photo, offer to show it using the send_product_image tool',
      'Collect the customer name before creating orders',
      'For physical products with delivery, ask the customer to share their location pin via WhatsApp before creating the order',
      'Always confirm the order summary (products, quantities, total) with the customer before creating it',
      'After creating an order, immediately request Yape payment',
      'When the customer says they paid, validate the payment',
      'Suggest complementary products when appropriate',
    ],
    requiredCustomerInfo: ['name', 'location_for_delivery'],
  },

  // ── Service (dentist, salon, consultancy, any appointment-based business) ──
  service: {
    type: 'service',
    goals: [
      'Help customers book appointments for services',
      'Minimize no-shows through clear confirmations',
      'Collect payment upfront when required',
    ],
    guidelines: [
      'Ask what service the customer needs',
      'Check appointment availability before suggesting times',
      'Present available time slots clearly',
      'Confirm date, time, and service details before booking',
      'Collect customer name and phone number before booking',
      'If prepayment is required, guide toward Yape payment after booking',
      'Send a clear confirmation with all appointment details',
      'If the customer wants to cancel, confirm before proceeding',
    ],
    requiredCustomerInfo: ['name', 'phone'],
  },

  // ── Delivery (food delivery, courier service, anything with rider coordination) ──
  delivery: {
    type: 'delivery',
    goals: [
      'Complete orders and arrange delivery efficiently',
      'Keep the customer informed about delivery status',
      'Coordinate rider pickup and delivery smoothly',
    ],
    guidelines: [
      'Help customers browse and order products',
      'Collect the customer name and delivery location (location pin preferred) before creating orders',
      'Always confirm the order summary before creating it',
      'After creating an order, request Yape payment',
      'Once payment is confirmed, assign a delivery rider',
      'Notify the rider with pickup and delivery details',
      'Provide delivery status updates when the customer asks',
      'Estimate delivery time when possible',
    ],
    requiredCustomerInfo: ['name', 'location', 'phone'],
  },

  // ── Lead Capture (expos, events, inbound marketing, consultative sales) ──
  lead_capture: {
    type: 'lead_capture',
    goals: [
      'Engage potential leads in warm, consultative conversation',
      'Discover their needs, challenges, and context',
      'Capture contact information progressively (name, company, email, phone)',
      'Qualify leads based on fit with offered services',
      'Leave a positive impression of the brand',
    ],
    guidelines: [
      'Start with a warm greeting and ask about their needs or challenges',
      'Listen first — understand their situation before pitching services',
      'When a lead mentions a need or interest, use search_products to show relevant offerings',
      'Capture information naturally as it comes up — do not interrogate',
      'Use save_customer_info to save lead details progressively (name, company, email, interest)',
      'Use tag_customer to classify leads (e.g., "hot_lead", "interested_in_X")',
      'Use get_customer_history to check if the lead has interacted before',
      'For promising leads, offer to schedule a follow-up or demo',
      'Keep messages conversational and concise (WhatsApp style, 1-3 sentences)',
      'Never pressure — if they are not ready, thank them and leave the door open',
    ],
    requiredCustomerInfo: ['name', 'company_or_role', 'interest'],
  },
};
