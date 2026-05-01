// Contador Portal — Dashboard Page (KPIs)
import { apiGet, formatMoney, esc } from '../shared/api.js';

export function mount(container) {
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Dashboard</h1>
        <p class="page-subtitle">Resumen de tu red de clientes</p>
      </div>
    </div>

    <div class="kpi-grid" id="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Clientes activos</div>
        <div class="kpi-value purple" id="kpi-clients">--</div>
        <div class="kpi-sub">referidos con tu codigo</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Comision del mes</div>
        <div class="kpi-value money" id="kpi-month">--</div>
        <div class="kpi-sub">20% de ingresos de clientes</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Comision pendiente</div>
        <div class="kpi-value amber" id="kpi-pending">--</div>
        <div class="kpi-sub">por cobrar</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Total ganado</div>
        <div class="kpi-value cyan" id="kpi-total">--</div>
        <div class="kpi-sub">comisiones historicas</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>Tu Codigo de Referido</h3>
      </div>
      <div class="card-body" style="text-align:center;">
        <div class="referral-code" id="dash-referral-code">---</div>
        <p style="color:var(--text-secondary);font-size:0.85rem;margin-top:8px">
          Comparte este codigo con tus clientes al registrarse en agente.ceo
        </p>
        <button class="btn btn-secondary btn-sm" id="btn-copy-code" style="margin-top:12px">
          Copiar codigo
        </button>
      </div>
    </div>

    <div class="card" style="margin-top:16px">
      <div class="card-header">
        <h3>Ingresos de Clientes (este mes)</h3>
      </div>
      <div class="card-body">
        <div id="revenue-info" style="text-align:center;padding:16px;">
          <div style="font-size:2rem;font-weight:700;color:var(--emerald)" id="client-revenue">--</div>
          <div style="color:var(--text-secondary);font-size:0.85rem;margin-top:4px">
            Ingresos totales de tus clientes referidos
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('btn-copy-code')?.addEventListener('click', copyCode);
  loadDashboard();
}

export function unmount() {}

async function loadDashboard() {
  try {
    const data = await apiGet('/dashboard');
    const k = data.kpis;

    document.getElementById('kpi-clients').textContent = k.totalClients;
    document.getElementById('kpi-month').textContent = formatMoney(k.pendingCommissions);
    document.getElementById('kpi-pending').textContent = formatMoney(k.pendingCommissions);
    document.getElementById('kpi-total').textContent = formatMoney(k.totalEarned);
    document.getElementById('dash-referral-code').textContent = data.contador.referralCode;
    document.getElementById('client-revenue').textContent = formatMoney(k.clientRevenue);
  } catch (e) {
    console.error('Dashboard load failed:', e);
  }
}

function copyCode() {
  const code = document.getElementById('dash-referral-code')?.textContent;
  if (code && code !== '---') {
    navigator.clipboard.writeText(code).then(() => {
      const btn = document.getElementById('btn-copy-code');
      if (btn) { btn.textContent = 'Copiado!'; setTimeout(() => btn.textContent = 'Copiar codigo', 2000); }
    });
  }
}
