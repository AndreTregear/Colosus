import type { IncomingMessage } from '../bot/providers/types.js';

export type MatchType = 'exact' | 'contains' | 'regex';
export type RuleScope = 'all' | 'private' | 'group';

export interface Rule {
  id: number;
  name: string;
  pattern: string;
  matchType: MatchType;
  reply: string;
  scope: RuleScope;
  scopeJid: string | null;
  enabled: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export type CreateRuleInput = Omit<Rule, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateRuleInput = Partial<CreateRuleInput>;

export interface MessageLog {
  id?: number;
  tenantId?: string;
  channel?: string;
  jid: string;
  pushName?: string | null;
  direction: 'incoming' | 'outgoing';
  body: string;
  matchedRuleId?: number | null;
  timestamp: string;
}

export interface BotStatus {
  running: boolean;
  connection: 'open' | 'connecting' | 'close';
  autoReplyEnabled: boolean;
  phoneNumber: string | null;
  uptime: number;
  rulesCount: number;
  messagesHandled: number;
}

// ── Enums / Union Types ──

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'payment_requested'
  | 'paid'
  | 'preparing'
  | 'ready'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type ProductType = 'physical' | 'digital';

export type BillingCycle = 'free' | 'monthly' | 'quarterly' | 'yearly' | 'weekly' | 'one_time';

export type ContentType = 'blog' | 'newsletter' | 'agent' | 'general';

// ── Conversations / AI ──

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string | Array<{ type: string; text?: string; [key: string]: unknown }>;
}

// ── Tenants ──

export type TenantSettings = Record<string, unknown>;

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  apiKey: string;
  status: string;
  settings: TenantSettings;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTenantInput {
  name: string;
  slug: string;
  phone?: string;
  settings?: TenantSettings;
}

export interface TenantSession {
  tenantId: string;
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
  lastConnectedAt: string | null;
  lastQrAt: string | null;
  reconnectAttempts: number;
  errorMessage: string | null;
  updatedAt: string;
}

// ── Customers ──

export interface Customer {
  id: number;
  tenantId: string;
  channel: string;
  jid: string;
  name: string | null;
  phone: string | null;
  location: string | null;
  locationLat: number | null;
  locationLng: number | null;
  address: string | null;
  notes: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type UpdateCustomerInput = Partial<Pick<Customer, 'name' | 'phone' | 'location' | 'locationLat' | 'locationLng' | 'address' | 'notes'>>;

// ── Leads ──

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';

export interface Lead {
  id: number;
  tenantId: string;
  channel: string;
  jid: string;
  name: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  interest: string | null;
  source: string;
  status: LeadStatus;
  qualificationScore: number | null;
  qualificationNotes: string | null;
  notes: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export type UpdateLeadInput = Partial<Pick<Lead,
  'name' | 'company' | 'email' | 'phone' | 'interest' | 'source' | 'status' |
  'qualificationScore' | 'qualificationNotes' | 'notes'
>>;

// ── Products ──

export interface Product {
  id: number;
  tenantId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  productType: ProductType;
  stock: number | null;
  imageUrl: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductInput {
  name: string;
  description: string;
  price: number;
  category: string;
  productType: ProductType;
  stock: number | null;
  imageUrl: string | null;
  active: boolean;
}

export type UpdateProductInput = Partial<CreateProductInput>;

// ── Orders ──

export interface Order {
  id: number;
  tenantId: string;
  customerId: number;
  status: OrderStatus;
  total: number;
  deliveryType: string;
  deliveryAddress: string | null;
  notes: string | null;
  reminderCount: number;
  lastReminderAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  productName: string;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
  customerName: string | null;
  customerJid: string;
}

export interface OrderItemInput {
  productId: number;
  quantity: number;
}

// ── Payments ──

export interface Payment {
  id: number;
  tenantId: string;
  orderId: number;
  method: string;
  amount: number;
  status: string;
  reference: string | null;
  confirmedAt: string | null;
  confirmedBy: string | null;
  createdAt: string;
}

// ── Devices ──

export interface Device {
  id: number;
  tenantId: string;
  deviceId: string;
  businessName: string;
  phoneNumber: string;
  token: string;
  lastSeenAt: string | null;
  createdAt: string;
}

// ── Yape ──

export interface YapeNotification {
  id: number;
  tenantId: string;
  deviceId: number;
  senderName: string;
  amount: number;
  capturedAt: string;
  notificationHash: string;
  matchedPaymentId: number | null;
  status: string;
  createdAt: string;
}

// ── Riders / Delivery ──

export interface Rider {
  id: number;
  tenantId: string;
  name: string;
  phone: string;
  whatsappJid: string | null;
  status: string;
  currentLat: number | null;
  currentLng: number | null;
  locationUpdatedAt: string | null;
  createdAt: string;
}

export interface DeliveryAssignment {
  id: number;
  tenantId: string;
  orderId: number;
  riderId: number;
  status: string;
  assignedAt: string;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  notes: string | null;
}

// ── Refunds ──

export interface Refund {
  id: number;
  tenantId: string;
  orderId: number;
  paymentId: number;
  amount: number;
  reason: string | null;
  status: string;
  refundedBy: string;
  createdAt: string;
  completedAt: string | null;
}

// ── Appointments ──

export interface Appointment {
  id: number;
  tenantId: string;
  customerId: number;
  serviceName: string;
  scheduledAt: string;
  durationMinutes: number;
  status: string;
  reminderSent: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Platform Plans ──

export interface PlatformPlan {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  billingCycle: BillingCycle;
  features: Record<string, unknown>;
  limits: Record<string, unknown>;
  sortOrder: number;
  active: boolean;
  createdAt: string;
}

// ── Subscriptions ──

export interface TenantSubscription {
  id: number;
  tenantId: string;
  planId: number;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelledAt: string | null;
  createdAt: string;
}

export interface SubscriptionPayment {
  id: number;
  tenantId: string;
  subscriptionType: string;
  subscriptionId: number;
  amount: number;
  periodStart: string;
  periodEnd: string;
  status: string;
  paymentMethod: string;
  yapeNotificationId: number | null;
  reference: string | null;
  confirmedAt: string | null;
  createdAt: string;
}

// ── Creator Plans ──

export interface CreatorPlan {
  id: number;
  tenantId: string;
  name: string;
  description: string | null;
  price: number;
  billingCycle: BillingCycle;
  contentType: ContentType;
  features: Record<string, unknown>;
  active: boolean;
  createdAt: string;
}

export interface CustomerSubscription {
  id: number;
  tenantId: string;
  customerId: number;
  planId: number;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelledAt: string | null;
  createdAt: string;
}

// ── Worker Types ──

export type WorkerCommand =
  | { type: 'start' }
  | { type: 'stop' }
  | { type: 'send-message'; jid: string; text: string; requestId?: string }
  | { type: 'send-image'; jid: string; imagePath: string; caption?: string; requestId?: string }
  | { type: 'send-presence'; jid: string; presenceType: 'composing' | 'paused' }
  | { type: 'health-check' };

export type WorkerEvent =
  | { type: 'ready' }
  | { type: 'qr'; dataUrl: string }
  | { type: 'connection-update'; status: 'open' | 'connecting' | 'close'; phone?: string }
  | { type: 'message'; message: IncomingMessage }
  | { type: 'error'; error: string }
  | { type: 'heartbeat'; timestamp: number }
  | { type: 'send-result'; requestId: string; success: boolean; error?: string }
  | { type: 'stopped' };
