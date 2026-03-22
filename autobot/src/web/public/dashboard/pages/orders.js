// Yaya Dashboard — Orders Page
import { apiGet, apiPost, apiPut, formatMoney, formatDateTime, esc, toast } from '../shared/api.js';

export function mount(container) {
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Pedidos</h1>
        <p class="page-subtitle">Gestiona los pedidos de tu negocio</p>
      </div>
      <button class="btn btn-primary" id="btn-new-order">+ Nuevo Pedido</button>
    </div>

    <div class="tabs" id="order-tabs">
      <button class="tab active" data-status="">Todos</button>
      <button class="tab" data-status="pending">Pendientes</button>
      <button class="tab" data-status="confirmed">Confirmados</button>
      <button class="tab" data-status="delivered">Entregados</button>
      <button class="tab" data-status="cancelled">Cancelados</button>
    </div>

    <div class="card">
      <div class="card-body no-pad">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th class="text-right">Total</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody id="orders-body">
              <tr><td colspan="6" class="text-center text-muted">Cargando...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  // Tab filtering
  container.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      loadOrders(tab.dataset.status);
    });
  });

  document.getElementById('btn-new-order').addEventListener('click', showNewOrderModal);
  loadOrders();
}

export function unmount() {}

const statusLabels = {
  pending: 'Pendiente', confirmed: 'Confirmado', preparing: 'Preparando',
  ready: 'Listo', delivered: 'Entregado', cancelled: 'Cancelado'
};
const statusClasses = {
  pending: 'badge-pending', confirmed: 'badge-confirmed', preparing: 'badge-preparing',
  ready: 'badge-ready', delivered: 'badge-delivered', cancelled: 'badge-cancelled'
};
const nextStatus = {
  pending: 'confirmed', confirmed: 'preparing', preparing: 'ready', ready: 'delivered'
};

async function loadOrders(status) {
  try {
    const url = status ? `/orders?status=${status}` : '/orders';
    const data = await apiGet(url);
    const orders = data.orders || data.data || data || [];
    renderOrders(orders);
  } catch (e) { console.error(e); }
}

function renderOrders(orders) {
  const tbody = document.getElementById('orders-body');
  if (!orders.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No hay pedidos</td></tr>';
    return;
  }
  tbody.innerHTML = orders.map(o => {
    const id = String(o.id);
    return `
    <tr>
      <td><code>${esc(id.slice(0, 12))}</code></td>
      <td>${esc(o.customerName || o.customer_name || 'Sin cliente')}</td>
      <td class="text-right">${formatMoney(o.total)}</td>
      <td><span class="badge ${statusClasses[o.status] || ''}">${statusLabels[o.status] || o.status}</span></td>
      <td>${formatDateTime(o.createdAt || o.created_at)}</td>
      <td>
        <div class="btn-group">
          <button class="btn btn-sm btn-secondary" onclick="window._viewOrder('${o.id}')">Ver</button>
          ${nextStatus[o.status] ? `<button class="btn btn-sm btn-primary" onclick="window._advanceOrder('${o.id}','${nextStatus[o.status]}')">${statusLabels[nextStatus[o.status]]}</button>` : ''}
          ${o.status !== 'cancelled' && o.status !== 'delivered' ? `<button class="btn btn-sm btn-danger" onclick="window._advanceOrder('${o.id}','cancelled')">Cancelar</button>` : ''}
        </div>
      </td>
    </tr>
  `}).join('');
}

window._viewOrder = async (id) => {
  try {
    const order = await apiGet(`/orders/${id}`);
    const items = order.items || [];
    YayaModal.open(`Pedido #${id}`, `
      <div class="mb-16">
        <strong>Cliente:</strong> ${esc(order.customerName || order.customer_name || 'Sin cliente')}<br>
        <strong>Estado:</strong> <span class="badge ${statusClasses[order.status]}">${statusLabels[order.status]}</span><br>
        <strong>Fecha:</strong> ${formatDateTime(order.createdAt || order.created_at)}<br>
        <strong>Notas:</strong> ${esc(order.notes || '-')}
      </div>
      <table>
        <thead><tr><th>Producto</th><th class="text-right">Cant.</th><th class="text-right">Precio</th><th class="text-right">Subtotal</th></tr></thead>
        <tbody>
          ${items.map(i => `
            <tr>
              <td>${esc(i.productName || i.product_name)}</td>
              <td class="text-right">${i.quantity}</td>
              <td class="text-right">${formatMoney(i.unitPrice || i.unit_price)}</td>
              <td class="text-right">${formatMoney((i.unitPrice || i.unit_price) * i.quantity)}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot><tr><td colspan="3" class="text-right"><strong>Total</strong></td><td class="text-right"><strong>${formatMoney(order.total)}</strong></td></tr></tfoot>
      </table>
    `);
  } catch { toast('Error al cargar pedido', 'error'); }
};

window._advanceOrder = async (id, status) => {
  try {
    await apiPut(`/orders/${id}/status`, { status });
    toast(`Pedido actualizado a ${statusLabels[status]}`, 'success');
    loadOrders();
  } catch { toast('Error al actualizar', 'error'); }
};

async function showNewOrderModal() {
  let customers = [], products = [];
  try { const d = await apiGet('/customers'); customers = d.customers || d.data || d || []; } catch {}
  try { const d = await apiGet('/products'); products = d.products || d.data || d || []; } catch {}

  YayaModal.open('Nuevo Pedido', `
    <form id="form-new-order">
      <div class="form-group">
        <label class="form-label">Cliente</label>
        <select id="order-customer" class="form-select">
          <option value="">Sin cliente</option>
          ${customers.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Productos</label>
        <div id="order-items">
          <div class="form-row mb-16">
            <select class="form-select order-product">
              ${products.map(p => `<option value="${p.id}" data-price="${p.price}">${esc(p.name)} — ${formatMoney(p.price)}</option>`).join('')}
            </select>
            <input type="number" class="form-input order-qty" value="1" min="1" style="max-width:80px">
          </div>
        </div>
        <button type="button" class="btn btn-sm btn-secondary" onclick="
          const tpl = document.querySelector('#order-items .form-row').cloneNode(true);
          tpl.querySelector('.order-qty').value = 1;
          document.getElementById('order-items').appendChild(tpl);
        ">+ Agregar producto</button>
      </div>
      <div class="form-group">
        <label class="form-label">Notas</label>
        <textarea id="order-notes" class="form-textarea" rows="2" placeholder="Notas opcionales..."></textarea>
      </div>
      <button type="submit" class="btn btn-primary">Crear Pedido</button>
    </form>
  `);

  document.getElementById('form-new-order').addEventListener('submit', async (e) => {
    e.preventDefault();
    const customer_id = document.getElementById('order-customer').value || null;
    const notes = document.getElementById('order-notes').value;
    const rows = document.querySelectorAll('#order-items .form-row');
    const items = [];
    rows.forEach(row => {
      const select = row.querySelector('.order-product');
      const qty = parseInt(row.querySelector('.order-qty').value) || 1;
      const opt = select.options[select.selectedIndex];
      items.push({
        product_id: select.value,
        product_name: opt.textContent.split(' — ')[0],
        quantity: qty,
        unit_price: parseFloat(opt.dataset.price) || 0
      });
    });
    try {
      await apiPost('/orders', { customer_id, items, notes });
      YayaModal.close();
      toast('Pedido creado', 'success');
      loadOrders();
    } catch (err) { toast(err.message, 'error'); }
  });
}
