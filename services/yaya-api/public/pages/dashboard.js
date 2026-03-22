// Yaya Platform — Dashboard Page
import { apiGet, formatMoney, formatDate, formatDateTime, esc } from '../shared/api.js';
import { drawLineChart, autoResize } from '../shared/charts.js';

let refreshInterval = null;

export function mount(container) {
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Dashboard</h1>
        <p class="page-subtitle">Resumen de tu negocio hoy</p>
      </div>
    </div>

    <div class="kpi-grid" id="dash-kpis">
      <div class="kpi-card green">
        <div class="kpi-label">Ingresos Hoy</div>
        <div class="kpi-value" id="kpi-revenue">--</div>
      </div>
      <div class="kpi-card red">
        <div class="kpi-label">Gastos Hoy</div>
        <div class="kpi-value" id="kpi-expenses">--</div>
      </div>
      <div class="kpi-card orange">
        <div class="kpi-label">Ganancia Hoy</div>
        <div class="kpi-value" id="kpi-profit">--</div>
      </div>
      <div class="kpi-card blue">
        <div class="kpi-label">Pagos Pendientes</div>
        <div class="kpi-value" id="kpi-pending">--</div>
      </div>
    </div>

    <div class="quick-actions mb-24">
      <button class="action-card" onclick="location.hash='#orders'">
        <span class="action-icon">📦</span> Nuevo Pedido
      </button>
      <button class="action-card" onclick="location.hash='#expenses'">
        <span class="action-icon">💸</span> Registrar Gasto
      </button>
      <button class="action-card" onclick="location.hash='#payments'">
        <span class="action-icon">💰</span> Ver Pagos Yape
      </button>
    </div>

    <div class="content-grid">
      <div class="card">
        <div class="card-header">📈 Ingresos - Últimos 7 días</div>
        <div class="card-body">
          <div class="chart-wrap"><canvas id="dash-revenue-chart"></canvas></div>
        </div>
      </div>
      <div class="card">
        <div class="card-header">🏆 Productos Top</div>
        <div class="card-body no-pad">
          <div class="table-wrap">
            <table>
              <thead><tr><th>Producto</th><th class="text-right">Vendido</th><th class="text-right">Ingresos</th></tr></thead>
              <tbody id="dash-top-products"><tr><td colspan="3" class="text-center text-muted">Cargando...</td></tr></tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <div class="content-grid mt-24">
      <div class="card">
        <div class="card-header">📦 Pedidos Recientes</div>
        <div class="card-body no-pad">
          <div class="table-wrap">
            <table>
              <thead><tr><th>Cliente</th><th>Total</th><th>Estado</th><th>Fecha</th></tr></thead>
              <tbody id="dash-orders"><tr><td colspan="4" class="text-center text-muted">Cargando...</td></tr></tbody>
            </table>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header">💰 Pagos Recientes</div>
        <div class="card-body no-pad">
          <div class="table-wrap">
            <table>
              <thead><tr><th>Remitente</th><th>Monto</th><th>Estado</th><th>Fecha</th></tr></thead>
              <tbody id="dash-payments"><tr><td colspan="4" class="text-center text-muted">Cargando...</td></tr></tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
  loadData();
  refreshInterval = setInterval(loadData, 30000);
}

export function unmount() {
  if (refreshInterval) { clearInterval(refreshInterval); refreshInterval = null; }
}

async function loadData() {
  try {
    const data = await apiGet('/dashboard');
    renderKPIs(data);
    renderTopProducts(data.top_products || []);
    renderOrders(data.recent_orders || []);
  } catch (e) { console.error('Dashboard load error:', e); }

  try {
    const stats = await apiGet('/payments/stats');
    document.getElementById('kpi-pending').textContent = formatMoney(stats.pending_amount || 0);
  } catch { /* ok */ }

  try {
    const pending = await apiGet('/payments/pending');
    renderPayments(pending || []);
  } catch { /* ok */ }

  loadRevenueChart();
}

function renderKPIs(data) {
  const today = data.today || {};
  const revenue = today.revenue || 0;
  const expenses = today.expenses || 0;
  document.getElementById('kpi-revenue').textContent = formatMoney(revenue);
  document.getElementById('kpi-expenses').textContent = formatMoney(expenses);
  document.getElementById('kpi-profit').textContent = formatMoney(revenue - expenses);
}

async function loadRevenueChart() {
  try {
    const d = new Date();
    const end = d.toISOString().slice(0, 10);
    d.setDate(d.getDate() - 6);
    const start = d.toISOString().slice(0, 10);
    const data = await apiGet(`/analytics/revenue?start=${start}&end=${end}`);
    const days = data.daily || data || [];
    const labels = days.map(r => {
      const dt = new Date(r.date);
      return dt.toLocaleDateString('es-PE', { weekday: 'short' });
    });
    const values = days.map(r => r.total || r.revenue || 0);
    const canvas = document.getElementById('dash-revenue-chart');
    if (canvas) {
      drawLineChart(canvas, { labels, values });
      autoResize(canvas, () => drawLineChart(canvas, { labels, values }));
    }
  } catch (e) { console.error('Revenue chart error:', e); }
}

function renderTopProducts(products) {
  const tbody = document.getElementById('dash-top-products');
  if (!products.length) {
    tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">Sin datos aún</td></tr>';
    return;
  }
  tbody.innerHTML = products.slice(0, 5).map(p => `
    <tr>
      <td>${esc(p.name || p.product_name)}</td>
      <td class="text-right">${p.total_sold || p.quantity || 0}</td>
      <td class="text-right">${formatMoney(p.total_revenue || p.revenue || 0)}</td>
    </tr>
  `).join('');
}

function renderOrders(orders) {
  const tbody = document.getElementById('dash-orders');
  if (!orders.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Sin pedidos recientes</td></tr>';
    return;
  }
  const statusMap = {
    pending: 'badge-pending', confirmed: 'badge-confirmed', preparing: 'badge-preparing',
    ready: 'badge-ready', delivered: 'badge-delivered', cancelled: 'badge-cancelled'
  };
  const statusLabels = {
    pending: 'Pendiente', confirmed: 'Confirmado', preparing: 'Preparando',
    ready: 'Listo', delivered: 'Entregado', cancelled: 'Cancelado'
  };
  tbody.innerHTML = orders.slice(0, 10).map(o => `
    <tr style="cursor:pointer" onclick="location.hash='#orders'">
      <td>${esc(o.customer_name || 'Sin cliente')}</td>
      <td>${formatMoney(o.total)}</td>
      <td><span class="badge ${statusMap[o.status] || ''}">${statusLabels[o.status] || o.status}</span></td>
      <td>${formatDateTime(o.created_at)}</td>
    </tr>
  `).join('');
}

function renderPayments(payments) {
  const tbody = document.getElementById('dash-payments');
  if (!payments.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Sin pagos pendientes</td></tr>';
    return;
  }
  tbody.innerHTML = payments.slice(0, 10).map(p => `
    <tr>
      <td>${esc(p.sender_name)}</td>
      <td>${formatMoney(p.amount)}</td>
      <td><span class="badge badge-${p.status}">${p.status === 'pending' ? 'Pendiente' : p.status === 'confirmed' ? 'Confirmado' : p.status}</span></td>
      <td>${formatDateTime(p.captured_at || p.created_at)}</td>
    </tr>
  `).join('');
}
