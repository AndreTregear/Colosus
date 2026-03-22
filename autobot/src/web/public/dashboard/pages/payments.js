// Yaya Dashboard — Payments Page
import { apiGet, apiPost, formatMoney, formatDateTime, esc, toast } from '../shared/api.js';

let currentTab = 'pending';

export function mount(container) {
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Pagos</h1>
        <p class="page-subtitle">Notificaciones de Yape y confirmaciones</p>
      </div>
    </div>

    <div id="payment-summary" class="summary-card">
      <h3>Resumen de Hoy</h3>
      <div class="summary-value" id="pay-total">S/ 0.00</div>
      <div class="summary-sub" id="pay-sub">0 pagos</div>
    </div>

    <div class="tabs">
      <button class="tab active" data-tab="pending">⏳ Pendientes</button>
      <button class="tab" data-tab="confirmed">✅ Confirmados</button>
      <button class="tab" data-tab="all">📋 Todos</button>
    </div>

    <div id="payments-list" style="display:flex;flex-direction:column;gap:12px;"></div>
  `;

  container.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentTab = tab.dataset.tab;
      loadPayments();
    });
  });

  loadStats();
  loadPayments();
}

export function unmount() {}

async function loadStats() {
  try {
    const pending = await apiGet('/payments/pending');
    const payments = pending.data || pending || [];
    const total = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    document.getElementById('pay-total').textContent = formatMoney(total);
    document.getElementById('pay-sub').textContent = `${payments.length} pagos pendientes`;
  } catch { /* ok */ }
}

async function loadPayments() {
  const list = document.getElementById('payments-list');
  try {
    const data = await apiGet('/payments/pending');
    let payments = data.data || data || [];

    if (currentTab === 'confirmed') {
      list.innerHTML = `<div class="empty-state"><div class="empty-icon">✅</div><p>Los pagos confirmados se muestran en el resumen</p></div>`;
      return;
    }

    if (!payments.length) {
      list.innerHTML = `<div class="empty-state"><div class="empty-icon">💰</div><p>No hay pagos pendientes</p></div>`;
      return;
    }

    list.innerHTML = payments.map(p => `
      <div class="payment-card">
        <div class="payment-info">
          <h4>${esc(p.customerName || p.sender_name || 'Desconocido')}</h4>
          <p>${formatDateTime(p.createdAt || p.captured_at || p.created_at)}</p>
          <p class="text-muted">ID: ${esc(String(p.id).slice(0, 12))}</p>
        </div>
        <div style="text-align:right;">
          <div class="payment-amount">${formatMoney(p.amount)}</div>
          <div class="payment-actions mt-16">
            <button class="btn btn-sm btn-success" onclick="window._confirmPayment('${p.id}')">✓ Confirmar</button>
            <button class="btn btn-sm btn-danger" onclick="window._rejectPayment('${p.id}')">✗ Rechazar</button>
          </div>
        </div>
      </div>
    `).join('');
  } catch (e) {
    list.innerHTML = `<div class="empty-state"><p class="text-muted">Error al cargar pagos</p></div>`;
  }
}

window._confirmPayment = async (id) => {
  try {
    await apiPost(`/payments/${id}/confirm`, {});
    toast('Pago confirmado', 'success');
    loadPayments();
    loadStats();
  } catch { toast('Error al confirmar', 'error'); }
};

window._rejectPayment = async (id) => {
  if (!confirm('¿Estás seguro de rechazar este pago?')) return;
  try {
    await apiPost(`/payments/${id}/reject`, {});
    toast('Pago rechazado', 'info');
    loadPayments();
    loadStats();
  } catch { toast('Error al rechazar', 'error'); }
};
