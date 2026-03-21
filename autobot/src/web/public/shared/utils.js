/**
 * Shared utility functions for both customer and admin portals.
 */

export function esc(str) {
  if (!str) return '';
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

export function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function formatDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function formatUptime(seconds) {
  if (!seconds || seconds <= 0) return '0s';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

export function apiFetch(url, opts = {}) {
  opts.credentials = 'include';
  return fetch(url, opts);
}

export function statusClass(status) {
  if (['paid', 'delivered', 'connected', 'active'].includes(status)) return 'connected';
  if (['cancelled', 'disconnected', 'deleted', 'suspended'].includes(status)) return 'disconnected';
  return 'connecting';
}

export function formatNumber(n) {
  if (n == null) return '0';
  return Number(n).toLocaleString();
}

export function formatCurrency(n, currency = 'PEN') {
  if (n == null) n = 0;
  const value = Number(n).toFixed(2);
  
  const symbols = {
    'PEN': 'S/',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'MXN': 'MX$',
    'COP': 'COL$',
    'CLP': 'CLP$',
    'ARS': 'ARS$',
  };
  
  const symbol = symbols[currency] || symbols['PEN'];
  return `${symbol}${value}`;
}

// Empty state component
export function emptyState(icon, title, subtitle, actionText, actionId) {
  return `<tr><td colspan="99">
    <div class="empty-state">
      <div class="empty-state-icon">${icon}</div>
      <div class="empty-state-title">${esc(title)}</div>
      <div class="empty-state-subtitle">${esc(subtitle)}</div>
      ${actionText ? `<button class="btn btn-primary btn-sm" id="${actionId}">${esc(actionText)}</button>` : ''}
    </div>
  </td></tr>`;
}

// Loading skeleton rows
export function skeletonRows(cols = 5, rows = 4) {
  let html = '';
  for (let r = 0; r < rows; r++) {
    html += '<tr>';
    for (let c = 0; c < cols; c++) {
      const w = 40 + Math.random() * 50;
      html += `<td><div class="skeleton" style="width:${w}%"></div></td>`;
    }
    html += '</tr>';
  }
  return html;
}

// Helper to get user's preferred currency from settings
export async function getUserCurrency() {
  try {
    const res = await apiFetch('/api/web/settings/currency');
    if (res.ok) {
      const data = await res.json();
      return data.currency || 'PEN';
    }
  } catch { /* ignore */ }
  return 'PEN';
}
