// Contador Portal — Commissions Page
import { apiGet, formatMoney, formatDate, esc } from '../shared/api.js';

let currentTab = 'all';

export function mount(container) {
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Comisiones</h1>
        <p class="page-subtitle">Historial de comisiones (20% revenue share)</p>
      </div>
    </div>

    <div class="kpi-grid" id="commission-kpis">
      <div class="kpi-card">
        <div class="kpi-label">Total ganado</div>
        <div class="kpi-value money" id="comm-total">--</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Pendiente</div>
        <div class="kpi-value amber" id="comm-pending">--</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Pagado</div>
        <div class="kpi-value cyan" id="comm-paid">--</div>
      </div>
    </div>

    <div class="tabs">
      <button class="tab active" data-tab="all">Todas</button>
      <button class="tab" data-tab="pending">Pendientes</button>
      <button class="tab" data-tab="paid">Pagadas</button>
    </div>

    <div class="card" id="commission-summary" style="margin-bottom:20px">
      <div class="card-header"><h3>Resumen Mensual</h3></div>
      <div class="card-body" id="monthly-summary">
        <p style="color:var(--text-muted)">Cargando...</p>
      </div>
    </div>

    <div id="commissions-list"></div>
  `;

  container.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentTab = tab.dataset.tab;
      loadCommissions();
    });
  });

  loadCommissions();
}

export function unmount() { currentTab = 'all'; }

async function loadCommissions() {
  const list = document.getElementById('commissions-list');
  try {
    const data = await apiGet('/commissions');
    const commissions = data.commissions || [];
    const monthly = data.monthlySummary || [];

    // KPIs
    const total = commissions.reduce((s, c) => s + c.commissionAmount, 0);
    const pending = commissions.filter(c => c.status === 'pending').reduce((s, c) => s + c.commissionAmount, 0);
    const paid = commissions.filter(c => c.status === 'paid').reduce((s, c) => s + c.commissionAmount, 0);

    document.getElementById('comm-total').textContent = formatMoney(total);
    document.getElementById('comm-pending').textContent = formatMoney(pending);
    document.getElementById('comm-paid').textContent = formatMoney(paid);

    // Monthly summary
    const summaryEl = document.getElementById('monthly-summary');
    if (monthly.length) {
      summaryEl.innerHTML = `
        <div class="table-wrap">
          <table>
            <thead><tr><th>Mes</th><th>Comision</th><th>Transacciones</th></tr></thead>
            <tbody>
              ${monthly.map(m => `
                <tr>
                  <td style="font-weight:500">${esc(m.month)}</td>
                  <td style="color:var(--emerald);font-weight:600">${formatMoney(m.total)}</td>
                  <td>${m.count}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>`;
    } else {
      summaryEl.innerHTML = '<p style="color:var(--text-muted);text-align:center">Sin datos aun</p>';
    }

    // Filtered commissions
    let filtered = commissions;
    if (currentTab === 'pending') filtered = commissions.filter(c => c.status === 'pending');
    if (currentTab === 'paid') filtered = commissions.filter(c => c.status === 'paid');

    if (!filtered.length) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">💰</div>
          <p>No hay comisiones${currentTab !== 'all' ? ` ${currentTab === 'pending' ? 'pendientes' : 'pagadas'}` : ''}</p>
        </div>`;
      return;
    }

    list.innerHTML = filtered.map(c => `
      <div class="commission-item">
        <div class="commission-info">
          <h4>${esc(c.clientName)}</h4>
          <p>${esc(c.periodMonth || '-')} · ${esc(c.sourceType)} · <span class="badge badge-${c.status === 'paid' ? 'paid' : c.status === 'pending' ? 'pending' : 'active'}">${c.status}</span></p>
        </div>
        <div style="text-align:right">
          <div class="commission-amount">${formatMoney(c.commissionAmount)}</div>
          <div style="font-size:0.7rem;color:var(--text-muted)">${(c.commissionRate * 100).toFixed(0)}% de ${formatMoney(c.grossAmount)}</div>
        </div>
      </div>
    `).join('');
  } catch (e) {
    list.innerHTML = `<div class="empty-state"><p style="color:var(--red)">Error al cargar comisiones</p></div>`;
  }
}
