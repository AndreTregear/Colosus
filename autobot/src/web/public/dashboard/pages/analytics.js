// Yaya Dashboard — Analytics Page
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
        <div class="card-header">📊 Productos Más Vendidos</div>
        <div class="card-body">
          <div class="chart-wrap"><canvas id="an-products-chart"></canvas></div>
        </div>
      </div>
      <div class="card">
        <div class="card-header">💳 Pagos</div>
        <div class="card-body">
          <div class="chart-wrap"><canvas id="an-payments-chart"></canvas></div>
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
  const periodMap = { today: 'today', week: '7d', month: '30d' };
  const period = periodMap[currentRange] || '30d';
  const days = currentRange === 'today' ? 1 : currentRange === 'week' ? 7 : 30;

  // Load sales summary
  try {
    const sales = await apiGet(`/analytics/sales?period=${period}`);
    document.getElementById('an-revenue').textContent = formatMoney(sales.total || 0);
    document.getElementById('an-orders').textContent = sales.count || '0';
  } catch { /* ok */ }

  // Load comprehensive analytics
  try {
    const data = await apiGet(`/analytics?period=${days}`);
    const revenue = data.totalSales || 0;
    document.getElementById('an-revenue').textContent = formatMoney(revenue);
    document.getElementById('an-orders').textContent = data.totalOrders || '0';
    document.getElementById('an-expenses').textContent = formatMoney(0); // expenses from separate endpoint
    document.getElementById('an-profit').textContent = formatMoney(revenue);

    // Top products chart
    const products = data.topProducts || [];
    if (products.length) {
      const labels = products.map(p => p.name);
      const values = products.map(p => p.sales || 0);
      const canvas = document.getElementById('an-products-chart');
      if (canvas) {
        drawBarChart(canvas, { labels, values }, { colors: ['#FF6B35', '#FF8F65', '#FFB088', '#2D3142', '#4F5D75', '#BFC0C0'] });
        autoResize(canvas, () => drawBarChart(canvas, { labels, values }, { colors: ['#FF6B35', '#FF8F65', '#FFB088', '#2D3142', '#4F5D75', '#BFC0C0'] }));
      }
    }
  } catch { /* ok */ }

  // Payment stats pie
  try {
    const pending = await apiGet('/payments/pending');
    const payments = pending.data || pending || [];
    const pendingAmount = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const labels = ['Confirmado', 'Pendiente'];
    const values = [0, pendingAmount]; // We only have pending data
    const canvas = document.getElementById('an-payments-chart');
    if (canvas && pendingAmount > 0) {
      drawPieChart(canvas, { labels, values }, { colors: ['#28A745', '#FFC107'] });
      autoResize(canvas, () => drawPieChart(canvas, { labels, values }, { colors: ['#28A745', '#FFC107'] }));
    }
  } catch { /* ok */ }
}
