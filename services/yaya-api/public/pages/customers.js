// Yaya Platform — Customers Page
import { apiGet, apiPost, formatMoney, formatDate, esc, toast } from '../shared/api.js';

export function mount(container) {
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Clientes</h1>
        <p class="page-subtitle">Tu cartera de clientes</p>
      </div>
      <button class="btn btn-primary" id="btn-new-customer">+ Nuevo Cliente</button>
    </div>

    <div class="card">
      <div class="card-body no-pad">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>Notas</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody id="customers-body">
              <tr><td colspan="6" class="text-center text-muted">Cargando...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  document.getElementById('btn-new-customer').addEventListener('click', showNewCustomerModal);
  loadCustomers();
}

export function unmount() {}

async function loadCustomers() {
  try {
    const data = await apiGet('/customers');
    const customers = data.data || data || [];
    renderCustomers(customers);
  } catch (e) { console.error(e); }
}

function renderCustomers(customers) {
  const tbody = document.getElementById('customers-body');
  if (!customers.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No hay clientes registrados</td></tr>';
    return;
  }
  tbody.innerHTML = customers.map(c => `
    <tr>
      <td><strong>${esc(c.name)}</strong></td>
      <td>${esc(c.phone || '-')}</td>
      <td>${esc(c.email || '-')}</td>
      <td class="text-muted">${esc((c.notes || '').slice(0, 40))}</td>
      <td>${formatDate(c.created_at)}</td>
      <td>
        <button class="btn btn-sm btn-secondary" onclick="window._viewCustomer('${c.id}')">Ver</button>
      </td>
    </tr>
  `).join('');
}

window._viewCustomer = async (id) => {
  try {
    const customer = await apiGet(`/customers/${id}`);
    const orders = customer.orders || [];
    YayaModal.open(esc(customer.name), `
      <div class="mb-16">
        <strong>Teléfono:</strong> ${esc(customer.phone || '-')}<br>
        <strong>Email:</strong> ${esc(customer.email || '-')}<br>
        <strong>Dirección:</strong> ${esc(customer.address || '-')}<br>
        <strong>Notas:</strong> ${esc(customer.notes || '-')}<br>
        <strong>Cliente desde:</strong> ${formatDate(customer.created_at)}
      </div>
      <h4 class="mb-16">Historial de Pedidos (${orders.length})</h4>
      ${orders.length ? `
        <table>
          <thead><tr><th>Total</th><th>Estado</th><th>Fecha</th></tr></thead>
          <tbody>
            ${orders.slice(0, 10).map(o => `
              <tr>
                <td>${formatMoney(o.total)}</td>
                <td><span class="badge badge-${o.status}">${o.status}</span></td>
                <td>${formatDate(o.created_at)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : '<p class="text-muted">Sin pedidos aún</p>'}
    `);
  } catch { toast('Error al cargar cliente', 'error'); }
};

function showNewCustomerModal() {
  YayaModal.open('Nuevo Cliente', `
    <form id="form-new-customer">
      <div class="form-group">
        <label class="form-label">Nombre *</label>
        <input type="text" id="cust-name" class="form-input" placeholder="Nombre completo" required>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Teléfono</label>
          <input type="tel" id="cust-phone" class="form-input" placeholder="999 999 999">
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input type="email" id="cust-email" class="form-input" placeholder="cliente@email.com">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Dirección</label>
        <input type="text" id="cust-address" class="form-input" placeholder="Dirección">
      </div>
      <div class="form-group">
        <label class="form-label">Notas</label>
        <textarea id="cust-notes" class="form-textarea" rows="2" placeholder="Notas sobre el cliente..."></textarea>
      </div>
      <button type="submit" class="btn btn-primary">Guardar Cliente</button>
    </form>
  `);

  document.getElementById('form-new-customer').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await apiPost('/customers', {
        name: document.getElementById('cust-name').value.trim(),
        phone: document.getElementById('cust-phone').value.trim(),
        email: document.getElementById('cust-email').value.trim(),
        address: document.getElementById('cust-address').value.trim(),
        notes: document.getElementById('cust-notes').value.trim()
      });
      YayaModal.close();
      toast('Cliente creado', 'success');
      loadCustomers();
    } catch (err) { toast(err.message, 'error'); }
  });
}
