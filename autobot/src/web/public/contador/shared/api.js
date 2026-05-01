// Contador Portal — API Client
const API = '/api/contador';

let cachedSession = null;

export function getSession() { return cachedSession; }
export function setSession(s) { cachedSession = s; }
export function getUser() { return cachedSession?.user || null; }

export async function apiFetch(path, opts = {}) {
  const headers = { ...(opts.headers || {}) };
  if (opts.body && typeof opts.body === 'string' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(`${API}${path}`, { ...opts, headers, credentials: 'include' });
  if (res.status === 401) {
    cachedSession = null;
    window.dispatchEvent(new CustomEvent('contador:logout'));
    throw new Error('No autorizado');
  }
  return res;
}

export async function apiGet(path) {
  const res = await apiFetch(path);
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
}

export async function apiPost(path, data) {
  const res = await apiFetch(path, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Error ${res.status}`);
  }
  return res.json();
}

export async function apiPut(path, data) {
  const res = await apiFetch(path, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Error ${res.status}`);
  }
  return res.json();
}

// HTML-safe escape
export function esc(str) {
  if (str == null) return '';
  const d = document.createElement('div');
  d.textContent = String(str);
  return d.innerHTML;
}

// Currency format (Peruvian Soles)
export function formatMoney(n) {
  return 'S/ ' + Number(n || 0).toFixed(2);
}

// Date format
export function formatDate(d) {
  if (!d) return '-';
  const dt = new Date(d);
  return dt.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatDateTime(d) {
  if (!d) return '-';
  const dt = new Date(d);
  return dt.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Toast notifications
export function toast(msg, type = 'info') {
  let c = document.getElementById('toast-container');
  if (!c) {
    c = document.createElement('div');
    c.id = 'toast-container';
    c.className = 'toast-container';
    document.body.appendChild(c);
  }
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => { t.remove(); }, 4000);
}
