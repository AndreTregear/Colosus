// Contador Portal — Referral Code Page
import { apiGet, apiPost, formatDate, esc, toast } from '../shared/api.js';

export function mount(container) {
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Codigo de Referido</h1>
        <p class="page-subtitle">Comparte tu codigo con clientes MYPE para ganar 20% de comision</p>
      </div>
    </div>

    <div class="referral-card" id="referral-card">
      <div class="kpi-label">Tu codigo unico</div>
      <div class="referral-code" id="referral-code">---</div>
      <div style="color:var(--text-secondary);font-size:0.85rem">
        Tus clientes ingresan este codigo al registrarse en agente.ceo
      </div>
      <div class="referral-actions">
        <button class="btn btn-primary" id="btn-copy">Copiar codigo</button>
        <button class="btn btn-secondary" id="btn-share">Compartir por WhatsApp</button>
        <button class="btn btn-secondary" id="btn-regenerate">Regenerar</button>
      </div>
    </div>

    <div class="kpi-grid" style="margin-top:24px">
      <div class="kpi-card">
        <div class="kpi-label">Clientes referidos</div>
        <div class="kpi-value purple" id="ref-total">--</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Tasa de comision</div>
        <div class="kpi-value money" id="ref-rate">--</div>
      </div>
    </div>

    <div class="card" style="margin-top:16px">
      <div class="card-header"><h3>Como funciona</h3></div>
      <div class="card-body">
        <div style="display:flex;flex-direction:column;gap:16px">
          <div style="display:flex;gap:12px;align-items:flex-start">
            <div style="width:28px;height:28px;border-radius:50%;background:rgba(139,92,246,0.15);color:var(--purple);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem;flex-shrink:0">1</div>
            <div>
              <div style="font-weight:500;margin-bottom:2px">Comparte tu codigo</div>
              <div style="color:var(--text-secondary);font-size:0.85rem">Dale tu codigo a tus clientes MYPE</div>
            </div>
          </div>
          <div style="display:flex;gap:12px;align-items:flex-start">
            <div style="width:28px;height:28px;border-radius:50%;background:rgba(6,182,212,0.15);color:var(--cyan);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem;flex-shrink:0">2</div>
            <div>
              <div style="font-weight:500;margin-bottom:2px">Ellos se registran</div>
              <div style="color:var(--text-secondary);font-size:0.85rem">Ingresan el codigo al crear su cuenta en agente.ceo</div>
            </div>
          </div>
          <div style="display:flex;gap:12px;align-items:flex-start">
            <div style="width:28px;height:28px;border-radius:50%;background:rgba(16,185,129,0.15);color:var(--emerald);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem;flex-shrink:0">3</div>
            <div>
              <div style="font-weight:500;margin-bottom:2px">Ganas comision</div>
              <div style="color:var(--text-secondary);font-size:0.85rem">Recibes el 20% de los ingresos de la plataforma por cada cliente referido</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card" style="margin-top:16px">
      <div class="card-header"><h3>Referidos recientes</h3></div>
      <div class="card-body" id="recent-referrals">
        <p style="color:var(--text-muted)">Cargando...</p>
      </div>
    </div>
  `;

  document.getElementById('btn-copy')?.addEventListener('click', copyCode);
  document.getElementById('btn-share')?.addEventListener('click', shareWhatsApp);
  document.getElementById('btn-regenerate')?.addEventListener('click', regenerateCode);

  loadReferral();
}

export function unmount() {}

let referralCode = '';

async function loadReferral() {
  try {
    const data = await apiGet('/referral');
    referralCode = data.referralCode;

    document.getElementById('referral-code').textContent = referralCode;
    document.getElementById('ref-total').textContent = data.totalClients;
    document.getElementById('ref-rate').textContent = (data.commissionRate * 100).toFixed(0) + '%';

    const recentEl = document.getElementById('recent-referrals');
    const recent = data.recentReferrals || [];
    if (recent.length) {
      recentEl.innerHTML = recent.map(r => `
        <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)">
          <span style="font-weight:500">${esc(r.clientName)}</span>
          <span style="color:var(--text-muted);font-size:0.85rem">${formatDate(r.referredAt)}</span>
        </div>
      `).join('');
    } else {
      recentEl.innerHTML = '<p style="color:var(--text-muted);text-align:center">Sin referidos aun</p>';
    }
  } catch (e) {
    console.error('Failed to load referral:', e);
  }
}

function copyCode() {
  if (referralCode) {
    navigator.clipboard.writeText(referralCode).then(() => {
      toast('Codigo copiado!', 'success');
    });
  }
}

function shareWhatsApp() {
  if (referralCode) {
    const text = encodeURIComponent(
      `Hola! Te invito a usar agente.ceo para gestionar tu negocio con IA. ` +
      `Registrate gratis y usa mi codigo de referido: ${referralCode}\n\n` +
      `https://agente.ceo/dashboard`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  }
}

async function regenerateCode() {
  if (!confirm('Seguro que quieres regenerar tu codigo? El codigo anterior dejara de funcionar.')) return;
  try {
    const data = await apiPost('/referral/regenerate', {});
    referralCode = data.referralCode;
    document.getElementById('referral-code').textContent = referralCode;
    toast('Codigo regenerado', 'success');
  } catch (e) {
    toast('Error al regenerar codigo', 'error');
  }
}
