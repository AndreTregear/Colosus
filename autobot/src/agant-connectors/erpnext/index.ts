/**
 * ERPNext Connector
 *
 * Wraps Frappe's REST API for agentic read + write.
 * Frappe API docs: https://frappeframework.com/docs/user/en/api/rest
 *
 * READ:  customers, invoices, orders, products, inventory, employees
 * WRITE: create invoice, update customer, create purchase order, update stock
 */

import { Connector, DataRecord, HttpClientConfig, httpJson } from '../types.js';

interface FrappeListResponse<T> {
  data: T[];
}

interface FrappeDocResponse<T> {
  data: T;
}

export interface ERPNextConfig {
  baseUrl: string; // e.g. "http://erpnext:8000"
  apiKey?: string;
  apiSecret?: string;
  /** Or use token auth */
  token?: string;
  /** Site name for Host header (multi-tenant Frappe) */
  siteName?: string;
}

function makeHttp(config: ERPNextConfig): HttpClientConfig {
  const headers: Record<string, string> = {};
  if (config.apiKey && config.apiSecret) {
    headers['Authorization'] = `token ${config.apiKey}:${config.apiSecret}`;
  } else if (config.token) {
    headers['Authorization'] = `Bearer ${config.token}`;
  }
  // ERPNext/Frappe resolves sites by Host header. In Docker, use X-Frappe-Site-Name instead.
  if (config.siteName) {
    headers['X-Frappe-Site-Name'] = config.siteName;
  }
  return { baseUrl: config.baseUrl, headers, timeout: 15000 };
}

// ─── Frappe API helpers ──────────────────────────────────────

async function frappeList<T>(
  http: HttpClientConfig,
  doctype: string,
  fields: string[],
  filters?: Record<string, unknown>,
  limit = 100,
  orderBy = 'modified desc',
): Promise<T[]> {
  const params = new URLSearchParams({
    fields: JSON.stringify(fields),
    limit_page_length: String(limit),
    order_by: orderBy,
  });
  if (filters) params.set('filters', JSON.stringify(filters));
  const resp = await httpJson<FrappeListResponse<T>>(http, 'GET', `/api/resource/${doctype}?${params}`);
  return resp.data;
}

async function frappeGet<T>(http: HttpClientConfig, doctype: string, name: string): Promise<T> {
  const resp = await httpJson<FrappeDocResponse<T>>(http, 'GET', `/api/resource/${doctype}/${encodeURIComponent(name)}`);
  return resp.data;
}

async function frappeCreate<T>(http: HttpClientConfig, doctype: string, data: Record<string, unknown>): Promise<T> {
  const resp = await httpJson<FrappeDocResponse<T>>(http, 'POST', `/api/resource/${doctype}`, data);
  return resp.data;
}

async function frappeUpdate<T>(http: HttpClientConfig, doctype: string, name: string, data: Record<string, unknown>): Promise<T> {
  const resp = await httpJson<FrappeDocResponse<T>>(http, 'PUT', `/api/resource/${doctype}/${encodeURIComponent(name)}`, data);
  return resp.data;
}

async function frappeCall<T>(http: HttpClientConfig, method: string, args?: Record<string, unknown>): Promise<T> {
  const resp = await httpJson<{ message: T }>(http, 'POST', `/api/method/${method}`, args);
  return resp.message;
}

// ─── Actions interface ───────────────────────────────────────

export interface ERPNextActions {
  // ── Read ──
  listCustomers(query?: string, limit?: number): Promise<any[]>;
  getCustomer(name: string): Promise<any>;
  listInvoices(status?: string, limit?: number): Promise<any[]>;
  getInvoice(name: string): Promise<any>;
  listItems(query?: string, limit?: number): Promise<any[]>;
  getStockBalance(itemCode: string, warehouse?: string): Promise<any>;
  listEmployees(limit?: number): Promise<any[]>;
  listSalesOrders(status?: string, limit?: number): Promise<any[]>;
  listPurchaseOrders(status?: string, limit?: number): Promise<any[]>;
  listLeadsByStatus(status?: string): Promise<any[]>;
  getAccountBalance(account?: string): Promise<any>;

  // ── Write ──
  createCustomer(data: { customer_name: string; customer_type?: string; territory?: string; email?: string; phone?: string }): Promise<any>;
  createSalesInvoice(data: { customer: string; items: { item_code: string; qty: number; rate: number }[]; due_date?: string }): Promise<any>;
  createSalesOrder(data: { customer: string; items: { item_code: string; qty: number; rate: number }[]; delivery_date?: string }): Promise<any>;
  updateCustomer(name: string, data: Record<string, unknown>): Promise<any>;
  createLead(data: { lead_name: string; email_id?: string; phone?: string; source?: string }): Promise<any>;
  submitDocument(doctype: string, name: string): Promise<any>;
}

// ─── Connector implementation ────────────────────────────────

export function createERPNextConnector(config: ERPNextConfig): Connector<ERPNextActions> {
  const http = makeHttp(config);

  const actions: ERPNextActions = {
    // ── Read ──
    async listCustomers(query, limit = 20) {
      const filters: Record<string, unknown> = {};
      if (query) filters['customer_name'] = ['like', `%${query}%`];
      return frappeList(http, 'Customer', ['name', 'customer_name', 'customer_type', 'territory', 'mobile_no', 'email_id', 'modified'], filters, limit);
    },

    async getCustomer(name) {
      return frappeGet(http, 'Customer', name);
    },

    async listInvoices(status, limit = 20) {
      const filters: Record<string, unknown> = {};
      if (status) filters['status'] = status;
      return frappeList(http, 'Sales Invoice', ['name', 'customer', 'customer_name', 'grand_total', 'status', 'posting_date', 'due_date', 'currency', 'modified'], filters, limit);
    },

    async getInvoice(name) {
      return frappeGet(http, 'Sales Invoice', name);
    },

    async listItems(query, limit = 50) {
      const filters: Record<string, unknown> = {};
      if (query) filters['item_name'] = ['like', `%${query}%`];
      return frappeList(http, 'Item', ['name', 'item_name', 'item_group', 'stock_uom', 'standard_rate', 'modified'], filters, limit);
    },

    async getStockBalance(itemCode, warehouse) {
      return frappeCall(http, 'erpnext.stock.utils.get_stock_balance_for', {
        item_code: itemCode,
        warehouse: warehouse || '',
      });
    },

    async listEmployees(limit = 50) {
      return frappeList(http, 'Employee', ['name', 'employee_name', 'designation', 'department', 'status', 'cell_phone', 'company_email', 'modified'], {}, limit);
    },

    async listSalesOrders(status, limit = 20) {
      const filters: Record<string, unknown> = {};
      if (status) filters['status'] = status;
      return frappeList(http, 'Sales Order', ['name', 'customer', 'customer_name', 'grand_total', 'status', 'transaction_date', 'delivery_date', 'currency', 'modified'], filters, limit);
    },

    async listPurchaseOrders(status, limit = 20) {
      const filters: Record<string, unknown> = {};
      if (status) filters['status'] = status;
      return frappeList(http, 'Purchase Order', ['name', 'supplier', 'supplier_name', 'grand_total', 'status', 'transaction_date', 'modified'], filters, limit);
    },

    async listLeadsByStatus(status) {
      const filters: Record<string, unknown> = {};
      if (status) filters['status'] = status;
      return frappeList(http, 'Lead', ['name', 'lead_name', 'email_id', 'phone', 'status', 'source', 'modified'], filters);
    },

    async getAccountBalance(account) {
      return frappeCall(http, 'erpnext.accounts.utils.get_balance_on', {
        account: account || '',
      });
    },

    // ── Write ──
    async createCustomer(data) {
      return frappeCreate(http, 'Customer', {
        customer_name: data.customer_name,
        customer_type: data.customer_type || 'Individual',
        territory: data.territory || 'All Territories',
        email_id: data.email,
        mobile_no: data.phone,
      });
    },

    async createSalesInvoice(data) {
      return frappeCreate(http, 'Sales Invoice', {
        customer: data.customer,
        due_date: data.due_date,
        items: data.items.map(i => ({
          item_code: i.item_code,
          qty: i.qty,
          rate: i.rate,
        })),
      });
    },

    async createSalesOrder(data) {
      return frappeCreate(http, 'Sales Order', {
        customer: data.customer,
        delivery_date: data.delivery_date,
        items: data.items.map(i => ({
          item_code: i.item_code,
          qty: i.qty,
          rate: i.rate,
        })),
      });
    },

    async updateCustomer(name, data) {
      return frappeUpdate(http, 'Customer', name, data);
    },

    async createLead(data) {
      return frappeCreate(http, 'Lead', data);
    },

    async submitDocument(doctype, name) {
      return frappeCall(http, 'frappe.client.submit', { doc: { doctype, name } });
    },
  };

  return {
    name: 'erpnext',

    async healthCheck() {
      try {
        await httpJson(http, 'GET', '/api/method/ping');
        return true;
      } catch { return false; }
    },

    async extractSince(since: Date) {
      const records: DataRecord[] = [];
      const sinceStr = since.toISOString().split('T')[0];
      const now = new Date();

      // Extract customers
      const customers = await frappeList<any>(http, 'Customer',
        ['name', 'customer_name', 'customer_type', 'email_id', 'mobile_no', 'territory', 'modified'],
        { modified: ['>=', sinceStr] }, 500);
      for (const c of customers) {
        records.push({
          id: `erpnext:customer:${c.name}`,
          source: 'erpnext', kind: 'customer',
          title: c.customer_name,
          body: `Customer: ${c.customer_name}. Type: ${c.customer_type}. Email: ${c.email_id || 'N/A'}. Phone: ${c.mobile_no || 'N/A'}. Territory: ${c.territory}.`,
          timestamp: new Date(c.modified),
          indexed_at: now,
          metadata: c,
          participants: [c.customer_name, c.email_id, c.mobile_no].filter(Boolean),
          tags: [c.customer_type, c.territory].filter(Boolean),
          source_url: `${config.baseUrl}/app/customer/${c.name}`,
        });
      }

      // Extract invoices
      const invoices = await frappeList<any>(http, 'Sales Invoice',
        ['name', 'customer', 'customer_name', 'grand_total', 'status', 'posting_date', 'due_date', 'currency', 'modified'],
        { modified: ['>=', sinceStr] }, 500);
      for (const inv of invoices) {
        records.push({
          id: `erpnext:invoice:${inv.name}`,
          source: 'erpnext', kind: 'invoice',
          title: `Invoice ${inv.name} — ${inv.customer_name}`,
          body: `Sales Invoice ${inv.name} for ${inv.customer_name}. Amount: ${inv.grand_total} ${inv.currency}. Status: ${inv.status}. Due: ${inv.due_date}.`,
          timestamp: new Date(inv.posting_date),
          indexed_at: now,
          metadata: inv,
          participants: [inv.customer_name],
          tags: [inv.status, inv.currency],
          source_url: `${config.baseUrl}/app/sales-invoice/${inv.name}`,
        });
      }

      // Extract items/products
      const items = await frappeList<any>(http, 'Item',
        ['name', 'item_name', 'item_group', 'standard_rate', 'stock_uom', 'modified'],
        { modified: ['>=', sinceStr] }, 500);
      for (const item of items) {
        records.push({
          id: `erpnext:product:${item.name}`,
          source: 'erpnext', kind: 'product',
          title: item.item_name,
          body: `Product: ${item.item_name}. Group: ${item.item_group}. Price: ${item.standard_rate} per ${item.stock_uom}.`,
          timestamp: new Date(item.modified),
          indexed_at: now,
          metadata: item,
          participants: [],
          tags: [item.item_group],
          source_url: `${config.baseUrl}/app/item/${item.name}`,
        });
      }

      return records;
    },

    actions,
  };
}
