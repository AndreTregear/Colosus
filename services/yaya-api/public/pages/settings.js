// Yaya Platform — Settings Page
import { apiGet, apiPut, getUser, esc, toast } from '../shared/api.js';

export function mount(container) {
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Configuración</h1>
        <p class="page-subtitle">Ajustes de tu negocio y plataforma</p>
      </div>
    </div>

    <!-- Business Info -->
    <div class="card mb-24">
      <div class="card-header">🏪 Información del Negocio</div>
      <div class="card-body">
        <form id="form-business">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Nombre del negocio</label>
              <input type="text" id="set-business-name" class="form-input" placeholder="Mi Negocio">
            </div>
            <div class="form-group">
              <label class="form-label">RUC</label>
              <input type="text" id="set-ruc" class="form-input" placeholder="20XXXXXXXXX">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Dirección</label>
              <input type="text" id="set-address" class="form-input" placeholder="Av. Principal 123">
            </div>
            <div class="form-group">
              <label class="form-label">Teléfono</label>
              <input type="tel" id="set-phone" class="form-input" placeholder="999 999 999">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Horario de atención</label>
            <input type="text" id="set-hours" class="form-input" placeholder="Lun-Sáb 10:00-22:00">
          </div>
          <button type="submit" class="btn btn-primary">Guardar Cambios</button>
        </form>
      </div>
    </div>

    <!-- AI Config -->
    <div class="card mb-24">
      <div class="card-header">🤖 Configuración del Agente IA</div>
      <div class="card-body">
        <div class="form-group">
          <label class="form-label">Modelo</label>
          <input type="text" id="set-ai-model" class="form-input" value="qwen3.5-27b" disabled>
          <p class="text-muted" style="font-size:12px;margin-top:4px">El modelo se configura desde el servidor</p>
        </div>
        <div class="form-group">
          <label class="form-label">Moneda</label>
          <select id="set-currency" class="form-select">
            <option value="PEN">Soles (S/)</option>
            <option value="USD">Dólares ($)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Idioma</label>
          <select id="set-language" class="form-select">
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Notificaciones</label>
          <div class="toggle-wrap">
            <label class="toggle">
              <input type="checkbox" id="set-notifications" checked>
              <span class="toggle-slider"></span>
            </label>
            <span>Notificaciones activas</span>
          </div>
        </div>
        <button class="btn btn-primary" id="btn-save-ai">Guardar</button>
      </div>
    </div>

    <!-- WhatsApp -->
    <div class="card mb-24">
      <div class="card-header">💬 WhatsApp</div>
      <div class="card-body">
        <div class="flex-between mb-16">
          <div>
            <strong>Estado de conexión</strong>
            <p class="text-muted" style="font-size:13px">Conecta tu WhatsApp para recibir pedidos</p>
          </div>
          <span class="badge badge-pending">No conectado</span>
        </div>
        <div style="background:var(--bg);border-radius:var(--radius);padding:40px;text-align:center;color:var(--text-muted);">
          <p style="font-size:48px;margin-bottom:12px;">📱</p>
          <p>El código QR estará disponible aquí cuando configures WhatsApp</p>
        </div>
      </div>
    </div>

    <!-- Danger Zone -->
    <div class="danger-zone">
      <h3>⚠️ Zona de Peligro</h3>
      <p class="text-muted mb-16" style="font-size:13px;">Estas acciones son irreversibles</p>
      <div class="btn-group">
        <button class="btn btn-secondary" id="btn-export">📥 Exportar Datos</button>
        <button class="btn btn-danger" id="btn-reset">🗑️ Reiniciar Datos</button>
      </div>
    </div>
  `;

  loadSettings();
  setupHandlers();
}

export function unmount() {}

async function loadSettings() {
  try {
    const settings = await apiGet('/settings');
    // Fill form fields from settings
    if (settings.business_name) document.getElementById('set-business-name').value = settings.business_name;
    if (settings.ruc) document.getElementById('set-ruc').value = settings.ruc;
    if (settings.address) document.getElementById('set-address').value = settings.address;
    if (settings.phone) document.getElementById('set-phone').value = settings.phone;
    if (settings.business_hours) document.getElementById('set-hours').value = settings.business_hours;
    if (settings.currency) document.getElementById('set-currency').value = settings.currency;
    if (settings.language) document.getElementById('set-language').value = settings.language;
    if (settings.notifications === 'false') document.getElementById('set-notifications').checked = false;
  } catch { /* first time, no settings */ }

  // Also fill from user profile
  const user = getUser();
  if (user) {
    const nameInput = document.getElementById('set-business-name');
    if (!nameInput.value && user.business_name) nameInput.value = user.business_name;
    const phoneInput = document.getElementById('set-phone');
    if (!phoneInput.value && user.phone) phoneInput.value = user.phone;
  }
}

function setupHandlers() {
  // Save business info
  document.getElementById('form-business').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await apiPut('/settings', {
        business_name: document.getElementById('set-business-name').value.trim(),
        ruc: document.getElementById('set-ruc').value.trim(),
        address: document.getElementById('set-address').value.trim(),
        phone: document.getElementById('set-phone').value.trim(),
        business_hours: document.getElementById('set-hours').value.trim()
      });
      toast('Información guardada', 'success');
    } catch { toast('Error al guardar', 'error'); }
  });

  // Save AI config
  document.getElementById('btn-save-ai').addEventListener('click', async () => {
    try {
      await apiPut('/settings', {
        currency: document.getElementById('set-currency').value,
        language: document.getElementById('set-language').value,
        notifications: String(document.getElementById('set-notifications').checked)
      });
      toast('Configuración guardada', 'success');
    } catch { toast('Error al guardar', 'error'); }
  });

  // Export data
  document.getElementById('btn-export').addEventListener('click', async () => {
    try {
      const [products, orders, customers] = await Promise.all([
        apiGet('/products'), apiGet('/orders'), apiGet('/customers')
      ]);
      const exportData = { products: products.data, orders: orders.data, customers: customers.data, exported_at: new Date().toISOString() };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `yaya-export-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast('Datos exportados', 'success');
    } catch { toast('Error al exportar', 'error'); }
  });

  // Reset data warning
  document.getElementById('btn-reset').addEventListener('click', () => {
    if (!confirm('⚠️ ¿Estás seguro? Esta acción eliminará todos tus datos.')) return;
    if (!confirm('¿REALMENTE estás seguro? No se puede deshacer.')) return;
    toast('Función no disponible aún', 'info');
  });
}
