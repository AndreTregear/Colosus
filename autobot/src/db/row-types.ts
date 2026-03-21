/**
 * Raw database row types matching PostgreSQL column names.
 * Used to type query results before row mapping.
 *
 * Index signatures allow compatibility with Record<string, unknown>
 * (required by createRowMapper and pg query generics).
 */

export interface TenantRow {
  [key: string]: unknown;
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  api_key: string;
  status: string;
  settings: string | Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface ProductRow {
  [key: string]: unknown;
  id: number;
  tenant_id: string;
  name: string;
  description: string;
  price: string; // NUMERIC comes as string from pg
  category: string;
  product_type: string;
  stock: number | null;
  image_url: string | null;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CustomerRow {
  [key: string]: unknown;
  id: number;
  tenant_id: string;
  channel: string;
  jid: string;
  name: string | null;
  phone: string | null;
  location: string | null;
  location_lat: string | null; // NUMERIC
  location_lng: string | null; // NUMERIC
  address: string | null;
  notes: string | null;
  tags: string | string[]; // JSONB
  created_at: Date;
  updated_at: Date;
}

export interface OrderRow {
  [key: string]: unknown;
  id: number;
  tenant_id: string;
  customer_id: number;
  status: string;
  total: string; // NUMERIC
  delivery_type: string;
  delivery_address: string | null;
  notes: string | null;
  reminder_count: number;
  last_reminder_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface OrderItemRow {
  [key: string]: unknown;
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: string; // NUMERIC
  product_name?: string; // from JOIN
}

export interface PaymentRow {
  [key: string]: unknown;
  id: number;
  tenant_id: string;
  order_id: number;
  method: string;
  amount: string; // NUMERIC
  status: string;
  reference: string | null;
  confirmed_at: Date | null;
  confirmed_by: string | null;
  created_at: Date;
}

export interface MessageRow {
  [key: string]: unknown;
  id: number;
  tenant_id: string;
  channel: string;
  jid: string;
  push_name: string | null;
  direction: string;
  body: string;
  timestamp: Date;
}

export interface ConversationRow {
  [key: string]: unknown;
  tenant_id: string;
  jid: string;
  messages: string; // JSONB stored as text
  updated_at: Date;
}

export interface SettingsRow {
  [key: string]: unknown;
  tenant_id: string;
  key: string;
  value: string;
}

export interface DeviceRow {
  [key: string]: unknown;
  id: number;
  tenant_id: string;
  device_id: string;
  business_name: string;
  phone_number: string;
  token: string;
  last_seen_at: Date | null;
  created_at: Date;
}

export interface YapeNotificationRow {
  [key: string]: unknown;
  id: number;
  tenant_id: string;
  device_id: number;
  sender_name: string;
  amount: string; // NUMERIC
  captured_at: Date;
  notification_hash: string;
  matched_payment_id: number | null;
  status: string;
  created_at: Date;
}

export interface TokenUsageRow {
  [key: string]: unknown;
  id: number;
  tenant_id: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  created_at: Date;
}

export interface SessionRow {
  [key: string]: unknown;
  tenant_id: string;
  connection_status: string;
  last_connected_at: Date | null;
  last_qr_at: Date | null;
  reconnect_attempts: number;
  error_message: string | null;
  updated_at: Date;
}

export interface PlatformPlanRow {
  [key: string]: unknown;
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: string; // NUMERIC
  billing_cycle: string;
  features: string | Record<string, unknown>;
  limits: string | Record<string, unknown>;
  sort_order: number;
  active: boolean;
  created_at: Date;
}

export interface TenantSubscriptionRow {
  [key: string]: unknown;
  id: number;
  tenant_id: string;
  plan_id: number;
  status: string;
  current_period_start: Date;
  current_period_end: Date;
  cancelled_at: Date | null;
  created_at: Date;
}

export interface CreatorPlanRow {
  [key: string]: unknown;
  id: number;
  tenant_id: string;
  name: string;
  description: string | null;
  price: string; // NUMERIC
  billing_cycle: string;
  content_type: string;
  features: string | Record<string, unknown>;
  active: boolean;
  created_at: Date;
}

export interface CustomerSubscriptionRow {
  [key: string]: unknown;
  id: number;
  tenant_id: string;
  customer_id: number;
  plan_id: number;
  status: string;
  current_period_start: Date;
  current_period_end: Date;
  cancelled_at: Date | null;
  created_at: Date;
}

export interface SubscriptionPaymentRow {
  [key: string]: unknown;
  id: number;
  tenant_id: string;
  subscription_type: string;
  subscription_id: number;
  amount: string; // NUMERIC
  period_start: Date;
  period_end: Date;
  status: string;
  payment_method: string;
  yape_notification_id: number | null;
  reference: string | null;
  confirmed_at: Date | null;
  created_at: Date;
}

export interface MobileUserRow {
  [key: string]: unknown;
  id: number;
  tenant_id: string;
  phone: string;
  password_hash: string;
  name: string | null;
  email: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface AppointmentRow {
  [key: string]: unknown;
  id: number;
  tenant_id: string;
  customer_id: number;
  service_name: string;
  scheduled_at: Date;
  duration_minutes: number;
  status: string;
  reminder_sent: boolean;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface RiderRow {
  [key: string]: unknown;
  id: number;
  tenant_id: string;
  name: string;
  phone: string;
  whatsapp_jid: string | null;
  status: string;
  current_lat: number | null;
  current_lng: number | null;
  location_updated_at: Date | null;
  created_at: Date;
}

export interface DeliveryAssignmentRow {
  [key: string]: unknown;
  id: number;
  tenant_id: string;
  order_id: number;
  rider_id: number;
  status: string;
  assigned_at: Date;
  picked_up_at: Date | null;
  delivered_at: Date | null;
  notes: string | null;
}

export interface RefundRow {
  [key: string]: unknown;
  id: number;
  tenant_id: string;
  order_id: number;
  payment_id: number;
  amount: string; // NUMERIC
  reason: string | null;
  status: string;
  refunded_by: string;
  created_at: Date;
  completed_at: Date | null;
}
