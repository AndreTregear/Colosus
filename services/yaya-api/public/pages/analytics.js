// Yaya Platform — Analytics Page
import { apiGet, formatMoney, dateRange } from '../shared/api.js';
import { drawLineChart, drawBarChart, drawPieChart, autoResize } from '../shared/charts.js';

let currentRange = 'today';

export function mount(container) {
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Analíticas</h1>
        <p class="page-subtitle">Rendimiento de tu negocio</p>
      </div>
      <div class="date-range">
        <button class="date-btn active" data-range="today">Hoy</button>
        <button class="date-btn" data-range="week">Esta Semana</button>
        <button class="date-btn" data-range="month">Este Mes</button>
      </div>
    </div>

    <div class="kpi-grid" id="analytics-kpis">
      <div class="kpi-card green">
        <div class="kpi-label">Ingresos</div>
        <div class="kpi-value" id="an-revenue">--</div>
      </div>
      <div class="kpi-card red">
        <div class="kpi-label">Gastos</div>
        <div class="kpi-value" id="an-expenses">--</div>
      </div>
      <div class="kpi-card orange">
        <div class="kpi-label">Ganancia</div>
        <div class="kpi-value" id="an-profit">--</div>
      </div>
      <div class="kpi-card blue">
        <div class="kpi-label">Pedidos</div>
        <div class="kpi-value" id="an-orders">--</div>
      </div>
    </div>

    <div class="content-grid">
      <div class="card">
        <div class="card-header">📈 Tendencia de Ingresos</div>
        <div class="card-body">
          <div class="chart-wrap"><canvas id="an-revenue-chart"></canvas></div>
        </div>
      </div>
      <div class="card">
        <div class="card-header">📊 Gastos por Categoría</div>
        <div class="card-body">
          <div class="chart-wrap"><canvas id="an-expenses-chart"></canvas></div>
        </div>
      </div>
    </div>

    <div class="content-grid mt-24">
      <div class="card">
        <div class="card-header">💳 Métodos de Pago</div>
        <div class="card-body">
          <div class="chart-wrap"><canvas id="an-payments-chart"></canvas></div>
        </div>
      </div>
      <div class="card">
        <div class="card-header">🏆 Productos Más Vendidos</div>
        <div class="card-body">
          <div class="chart-wrap"><canvas id="an-products-chart"></canvas></div>
        </div>
      </div>
    </div>
  `;

  // Date range buttons
  container.querySelectorAll('.date-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.date-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentRange = btn.dataset.range;
      loadAnalytics();
    });
  });

  loadAnalytics();
}

export function unmount() {}

async function loadAnalytics() {
  const { start, end } = dateRange(currentRange);
  const params = `start=${start}&end=${end}`;

  // Load summary
  try {
    const summary = await apiGet(`/analytics/summary?range=${currentRange}`);
    document.getElementById('an-revenue').textContent = formatMoney(summary.revenue || 0);
    document.getElementById('an-expenses').textContent = formatMoney(summary.expenses || 0);
    document.getElementById('an-profit').textContent = formatMoney((summary.revenue || 0) - (summary.expenses || 0));
    document.getElementById('an-orders').textContent = summary.orders || '0';
  } catch { /* ok */ }

  // Revenue chart
  try {
    const data = await apiGet(`/analytics/revenue?${params}`);
    const days = data.daily || data || [];
    const labels = days.map(r => {
      const dt = new Date(r.date);
      return dt.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
    });
    const values = days.map(r => r.total || r.revenue || 0);
    const canvas = document.getElementById('an-revenue-chart');
    if (canvas && labels.length) {
      drawLineChart(canvas, { labels, values });
      autoResize(canvas, () => drawLineChart(canvas, { labels, values }));
    }
  } catch { /* ok */ }

  // Expenses by category
  try {
    const data = await apiGet(`/analytics/expenses?${params}`);
    const cats = data.by_category || data || [];
    const labels = cats.map(c => c.category || 'Otro');
    const values = cats.map(c => c.total || c.amount || 0);
    const canvas = document.getElementById('an-expenses-chart');
    if (canvas && labels.length) {
      drawBarChart(canvas, { labels, values });
      autoResize(canvas, () => drawBarChart(canvas, { labels, values }));
    }
  } catch { /* ok */ }

  // Payments chart (pie) — use stats for today, simulate methods
  try {
    const stats = await apiGet('/payments/stats');
    const confirmed = stats.confirmed_amount || 0;
    const pending = stats.pending_amount || 0;
    const labels = ['Confirmado', 'Pendiente'];
    const values = [confirmed, pending];
    const canvas = document.getElementById('an-payments-chart');
    if (canvas && (confirmed + pending) > 0) {
      drawPieChart(canvas, { labels, values }, { colors: ['#28A745', '#FFC107'] });
      autoResize(canvas, () => drawPieChart(canvas, { labels, values }, { colors: ['#28A745', '#FFC107'] }));
    }
  } catch { /* ok */ }

  // Top products
  try {
    const data = await apiGet(`/analytics/top-products?${params}&limit=6`);
    const products = data.products || data || [];
    const labels = products.map(p => p.name || p.product_name);
    const values = products.map(p => p.total_revenue || p.revenue || 0);
    const canvas = document.getElementById('an-products-chart');
    if (canvas && labels.length) {
      drawBarChart(canvas, { labels, values }, { colors: ['#FF6B35', '#FF8F65', '#FFB088', '#2D3142', '#4F5D75', '#BFC0C0'] });
      autoResize(canvas, () => drawBarChart(canvas, { labels, values }, { colors: ['#FF6B35', '#FF8F65', '#FFB088', '#2D3142', '#4F5D75', '#BFC0C0'] }));
    }
  } catch { /* ok */ }
}
