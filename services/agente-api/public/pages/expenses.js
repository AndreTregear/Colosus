// Agente Platform — Expenses Page
import { apiGet, apiPost, formatMoney, formatDate, esc, toast, today, dateRange } from '../shared/api.js';
import { drawBarChart, autoResize } from '../shared/charts.js';

const CATEGORIES = ['Insumos', 'Alquiler', 'Personal', 'Servicios', 'Transporte', 'Otros'];

export function mount(container) {
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Gastos</h1>
        <p class="page-subtitle">Control de gastos del negocio</p>
      </div>
      <button class="btn btn-primary" id="btn-new-expense">+ Registrar Gasto</button>
    </div>

    <div class="kpi-grid mb-24">
      <div class="kpi-card red">
        <div class="kpi-label">Gastos Hoy</div>
        <div class="kpi-value" id="exp-today">--</div>
      </div>
      <div class="kpi-card red">
        <div class="kpi-label">Gastos Este Mes</div>
        <div class="kpi-value" id="exp-month">--</div>
      </div>
    </div>

    <div class="content-grid mb-24">
      <div class="card">
        <div class="card-header">📊 Gastos por Categoría (Este Mes)</div>
        <div class="card-body">
          <div class="chart-wrap"><canvas id="exp-category-chart"></canvas></div>
        </div>
      </div>
      <div class="card">
        <div class="card-header">📋 Desglose por Categoría</div>
        <div class="card-body no-pad">
          <div class="table-wrap">
            <table>
              <thead><tr><th>Categoría</th><th class="text-right">Monto</th></tr></thead>
              <tbody id="exp-categories-body">
                <tr><td colspan="2" class="text-center text-muted">Cargando...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">Todos los Gastos</div>
      <div class="card-body no-pad">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Descripción</th><th>Categoría</th><th class="text-right">Monto</th><th>Fecha</th></tr></thead>
            <tbody id="exp-all-body">
              <tr><td colspan="4" class="text-center text-muted">Cargando...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  document.getElementById('btn-new-expense').addEventListener('click', showNewExpenseModal);
  loadExpenses();
}

export function unmount() {}

async function loadExpenses() {
  const { start: monthStart, end } = dateRange('month');
  const todayStr = today();

  // Today's expenses
  try {
    const data = await apiGet(`/analytics/expenses?start=${todayStr}&end=${todayStr}`);
    document.getElementById('exp-today').textContent = formatMoney(data.total || 0);
  } catch { /* ok */ }

  // Month expenses + category chart
  try {
    const data = await apiGet(`/analytics/expenses?start=${monthStart}&end=${end}`);
    document.getElementById('exp-month').textContent = formatMoney(data.total || 0);

    const cats = data.data || [];
    renderCategoryTable(cats);
    renderCategoryChart(cats);
  } catch { /* ok */ }

  // All expenses list
  try {
    const data = await apiGet(`/expenses`);
    const expenses = data.data || data || [];
    renderExpensesList(expenses);
  } catch {
    // Fallback if /expenses route doesn't exist — use analytics
    try {
      const data = await apiGet(`/analytics/expenses?start=2020-01-01&end=${today()}`);
      renderExpensesList(data.expenses || []);
    } catch { /* ok */ }
  }
}

function renderCategoryTable(cats) {
  const tbody = document.getElementById('exp-categories-body');
  if (!cats.length) {
    tbody.innerHTML = '<tr><td colspan="2" class="text-center text-muted">Sin gastos este mes</td></tr>';
    return;
  }
  tbody.innerHTML = cats.map(c => `
    <tr>
      <td>${esc(c.category || 'Otro')}</td>
      <td class="text-right">${formatMoney(c.total || c.amount || 0)}</td>
    </tr>
  `).join('');
}

function renderCategoryChart(cats) {
  if (!cats.length) return;
  const labels = cats.map(c => c.category || 'Otro');
  const values = cats.map(c => c.total || c.amount || 0);
  const canvas = document.getElementById('exp-category-chart');
  if (canvas) {
    drawBarChart(canvas, { labels, values });
    autoResize(canvas, () => drawBarChart(canvas, { labels, values }));
  }
}

function renderExpensesList(expenses) {
  const tbody = document.getElementById('exp-all-body');
  if (!expenses.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Sin gastos registrados</td></tr>';
    return;
  }
  tbody.innerHTML = expenses.map(e => `
    <tr>
      <td>${esc(e.description || '-')}</td>
      <td>${esc(e.category || '-')}</td>
      <td class="text-right">${formatMoney(e.amount)}</td>
      <td>${formatDate(e.date || e.created_at)}</td>
    </tr>
  `).join('');
}

function showNewExpenseModal() {
  YayaModal.open('Registrar Gasto', `
    <form id="form-new-expense">
      <div class="form-group">
        <label class="form-label">Monto (S/) *</label>
        <input type="number" id="exp-amount" class="form-input" step="0.01" min="0.01" required placeholder="0.00">
      </div>
      <div class="form-group">
        <label class="form-label">Categoría *</label>
        <select id="exp-category" class="form-select" required>
          <option value="">Seleccionar...</option>
          ${CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Descripción</label>
        <textarea id="exp-description" class="form-textarea" rows="2" placeholder="Detalle del gasto..."></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Fecha</label>
        <input type="date" id="exp-date" class="form-input" value="${today()}">
      </div>
      <button type="submit" class="btn btn-primary">Guardar Gasto</button>
    </form>
  `);

  document.getElementById('form-new-expense').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await apiPost('/expenses', {
        amount: parseFloat(document.getElementById('exp-amount').value),
        category: document.getElementById('exp-category').value,
        description: document.getElementById('exp-description').value.trim(),
        date: document.getElementById('exp-date').value
      });
      YayaModal.close();
      toast('Gasto registrado', 'success');
      loadExpenses();
    } catch (err) { toast(err.message || 'Error al guardar gasto', 'error'); }
  });
}
