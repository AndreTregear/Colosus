// Contador Portal — Clients Page
import { apiGet, formatMoney, formatDate, esc } from '../shared/api.js';

export function mount(container) {
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Mis Clientes</h1>
        <p class="page-subtitle">Negocios referidos con tu codigo</p>
      </div>
    </div>

    <div id="clients-list" style="display:flex;flex-direction:column;gap:12px;">
      <div class="empty-state"><p>Cargando...</p></div>
    </div>
  `;

  loadClients();
}

export function unmount() {}

async function loadClients() {
  const list = document.getElementById('clients-list');
  try {
    const data = await apiGet('/clients');
    const clients = data.clients || [];

    if (!clients.length) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">👥</div>
          <p>Aun no tienes clientes referidos</p>
          <p style="color:var(--text-muted);font-size:0.8rem;margin-top:8px">
            Comparte tu codigo de referido con tus clientes MYPE
          </p>
        </div>`;
      return;
    }

    list.innerHTML = clients.map(c => `
      <div class="client-card" onclick="window._viewClient('${esc(c.tenantId)}')">
        <div class="client-info">
          <div class="client-avatar">${esc((c.name || '?').slice(0, 2).toUpperCase())}</div>
          <div class="client-meta">
            <h4>${esc(c.name)}</h4>
            <p>Referido el ${formatDate(c.referredAt)} · <span class="badge badge-${c.status === 'active' ? 'active' : 'churned'}">${c.status}</span></p>
          </div>
        </div>
        <div class="client-stats">
          <div class="client-revenue">${formatMoney(c.totalRevenue)}</div>
          <div class="client-orders">${c.totalOrders} pedidos</div>
        </div>
      </div>
    `).join('');
  } catch (e) {
    list.innerHTML = `<div class="empty-state"><p style="color:var(--red)">Error al cargar clientes</p></div>`;
  }
}

window._viewClient = async (tenantId) => {
  try {
    const data = await apiGet(`/clients/${tenantId}/transactions`);
    const txns = data.transactions || [];

    const bodyHTML = txns.length ? `
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>Pedido</th><th>Cliente</th><th>Monto</th><th>Estado</th><th>Fecha</th></tr>
          </thead>
          <tbody>
            ${txns.map(t => `
              <tr>
                <td>#${t.orderId}</td>
                <td>${esc(t.customerName || '-')}</td>
                <td style="font-weight:600;color:var(--emerald)">${formatMoney(t.total)}</td>
                <td><span class="badge badge-${t.orderStatus === 'delivered' || t.orderStatus === 'paid' ? 'active' : t.orderStatus === 'cancelled' ? 'churned' : 'pending'}">${t.orderStatus}</span></td>
                <td>${formatDate(t.createdAt)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : '<div class="empty-state"><p>Este cliente aun no tiene transacciones</p></div>';

    window.ContadorModal.open('Transacciones del Cliente', bodyHTML);
  } catch {
    window.ContadorModal.open('Error', '<p>No se pudieron cargar las transacciones</p>');
  }
};
