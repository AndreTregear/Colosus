import type { Tool } from '@mastra/core/tools';
import type { BusinessType } from '../flows/types.js';

// ── Universal tools (all business types) ──
import { searchProductsTool } from './search-products.js';
import { saveCustomerInfoTool } from './save-customer-info.js';
import { getBusinessInfoTool } from './get-business-info.js';
import { getCustomerHistoryTool } from './get-customer-history.js';
import { searchMediaTool } from './search-media.js';
import { requestYapePaymentTool } from './request-yape-payment.js';
import { validateYapePaymentTool } from './validate-yape-payment.js';
import { refundPaymentTool } from './refund-payment.js';
import { requestSubscriptionPaymentTool } from './request-subscription-payment.js';
import { getBusinessHoursTool } from './get-business-hours.js';
import { tagCustomerTool } from './tag-customer.js';
import { getCustomerTagsTool } from './get-customer-tags.js';
import { escalateToHumanTool } from './escalate-to-human.js';

// ── Retail + Delivery tools ──
import { createOrderTool } from './create-order.js';
import { getOrderStatusTool } from './get-order-status.js';
import { sendProductImageTool } from './send-product-image.js';
import { cancelOrderTool } from './cancel-order.js';
import { modifyOrderTool } from './modify-order.js';
import { getRecommendationsTool } from './get-recommendations.js';
import { getInventoryStatusTool } from './get-inventory-status.js';

// ── Service (appointment) tools ──
import { checkAvailabilityTool } from './check-availability.js';
import { bookAppointmentTool } from './book-appointment.js';
import { cancelAppointmentTool } from './cancel-appointment.js';
import { syncCalendarTool } from './sync-calendar.js';

// ── Delivery-specific tools ──
import { getDeliveryStatusTool } from './get-delivery-status.js';
import { assignRiderTool } from './assign-rider.js';
import { notifyRiderTool } from './notify-rider.js';
import { getLiveRiderLocationTool } from './get-live-rider-location.js';

// ── Merchant / Owner tools ──
import { getSalesSummaryTool } from './merchant/get-sales-summary.js';
import { getTopProductsTool } from './merchant/get-top-products.js';
import { getCustomerInsightsTool } from './merchant/get-customer-insights.js';
import { getRevenueReportTool } from './merchant/get-revenue-report.js';
import { queryInteractionsTool, queryAIPerformanceTool, queryMediaAnalyticsTool, exportTrainingDataTool } from './merchant/query-warehouse.js';
import { dailyBriefingTool, searchConversationsTool, comparePeriodsTool, getInventoryAlertsTool } from './merchant/business-actions.js';
import { businessHealthScoreTool, identifyBestCustomersTool } from './merchant/insights.js';
import { sendPaymentReminderTool, getCustomerDetailTool, listPendingPaymentsTool } from './merchant/manage-customers.js';
import { addProductTool, updateProductTool, setStockTool } from './merchant/manage-products.js';
import { updateBusinessConfigTool } from './merchant/update-config.js';

// ── Tool type (any Mastra tool) ──
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTool = Tool<any, any, any, any, any, any, any>;

// ── Universal tools available to all business types ──
const universalTools: Record<string, AnyTool> = {
  search_products: searchProductsTool,
  save_customer_info: saveCustomerInfoTool,
  get_business_info: getBusinessInfoTool,
  get_customer_history: getCustomerHistoryTool,
  search_media: searchMediaTool,
  request_yape_payment: requestYapePaymentTool,
  validate_yape_payment: validateYapePaymentTool,
  refund_payment: refundPaymentTool,
  request_subscription_payment: requestSubscriptionPaymentTool,
  get_business_hours: getBusinessHoursTool,
  tag_customer: tagCustomerTool,
  get_customer_tags: getCustomerTagsTool,
  escalate_to_human: escalateToHumanTool,
};

// ── Retail + Delivery tools ──
const retailTools: Record<string, AnyTool> = {
  create_order: createOrderTool,
  get_order_status: getOrderStatusTool,
  send_product_image: sendProductImageTool,
  cancel_order: cancelOrderTool,
  modify_order: modifyOrderTool,
  get_recommendations: getRecommendationsTool,
  get_inventory_status: getInventoryStatusTool,
};

// ── Service tools ──
const serviceTools: Record<string, AnyTool> = {
  check_appointment_availability: checkAvailabilityTool,
  book_appointment: bookAppointmentTool,
  cancel_appointment: cancelAppointmentTool,
  sync_calendar: syncCalendarTool,
};

// ── Delivery-only tools ──
const deliveryTools: Record<string, AnyTool> = {
  get_delivery_status: getDeliveryStatusTool,
  assign_rider: assignRiderTool,
  notify_rider: notifyRiderTool,
  get_live_rider_location: getLiveRiderLocationTool,
};

/**
 * Return all tools applicable to a given business type.
 * No factory functions, no ToolContext — tools read runtime context
 * from the agent's RequestContext at execution time.
 */
export function getToolsForBusiness(businessType: BusinessType): Record<string, AnyTool> {
  switch (businessType) {
    case 'retail':
      return { ...universalTools, ...retailTools };
    case 'delivery':
      return { ...universalTools, ...retailTools, ...deliveryTools };
    case 'service':
      return { ...universalTools, ...serviceTools };
    case 'lead_capture':
      return { ...universalTools };
    default:
      return { ...universalTools };
  }
}

/**
 * All owner/merchant tools — config, analytics, actions.
 */
export const ownerTools: Record<string, AnyTool> = {
  // Config
  update_business_config: updateBusinessConfigTool,
  // Analytics
  get_sales_summary: getSalesSummaryTool,
  get_top_products: getTopProductsTool,
  get_customer_insights: getCustomerInsightsTool,
  get_revenue_report: getRevenueReportTool,
  // Warehouse
  query_interactions: queryInteractionsTool,
  query_ai_performance: queryAIPerformanceTool,
  query_media_analytics: queryMediaAnalyticsTool,
  export_training_data: exportTrainingDataTool,
  // Business actions
  get_daily_briefing: dailyBriefingTool,
  search_conversations: searchConversationsTool,
  compare_periods: comparePeriodsTool,
  get_inventory_alerts: getInventoryAlertsTool,
  // Insights
  get_business_health_score: businessHealthScoreTool,
  identify_best_customers: identifyBestCustomersTool,
  // Customer management
  send_payment_reminder: sendPaymentReminderTool,
  get_customer_detail: getCustomerDetailTool,
  list_pending_payments: listPendingPaymentsTool,
  // Product management
  create_product: addProductTool,
  update_product: updateProductTool,
  set_product_stock: setStockTool,
};
