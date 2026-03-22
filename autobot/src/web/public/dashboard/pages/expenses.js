// Yaya Dashboard — Expenses Page
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
  // Use dashboard endpoint for summary data
  try {
    const data = await apiGet('/dashboard');
    const todayData = data.today || {};
    document.getElementById('exp-today').textContent = formatMoney(todayData.expenses || 0);
  } catch { /* ok */ }

  document.getElementById('exp-month').textContent = formatMoney(0);
  document.getElementById('exp-categories-body').innerHTML = '<tr><td colspan="2" class="text-center text-muted">Datos de gastos no disponible</td></tr>';
  document.getElementById('exp-all-body').innerHTML = '<tr><td colspan="4" class="text-center text-muted">Datos de gastos no disponible</td></tr>';
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
    toast('Función de gastos en desarrollo', 'info');
    YayaModal.close();
  });
}
