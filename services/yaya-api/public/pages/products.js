// Yaya Platform — Products Page
import { apiGet, apiPost, apiPut, apiDelete, formatMoney, esc, toast } from '../shared/api.js';

let viewMode = 'grid';

export function mount(container) {
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Productos</h1>
        <p class="page-subtitle">Catálogo de productos y precios</p>
      </div>
      <div class="btn-group">
        <div class="view-toggle">
          <button class="view-btn active" data-view="grid" title="Vista cuadrícula">▦</button>
          <button class="view-btn" data-view="list" title="Vista lista">☰</button>
        </div>
        <button class="btn btn-primary" id="btn-new-product">+ Nuevo Producto</button>
      </div>
    </div>

    <div id="products-container"></div>
  `;

  // View toggle
  container.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      viewMode = btn.dataset.view;
      loadProducts();
    });
  });

  document.getElementById('btn-new-product').addEventListener('click', () => showProductModal());
  loadProducts();
}

export function unmount() {}

async function loadProducts() {
  try {
    const data = await apiGet('/products');
    const products = data.data || data || [];
    renderProducts(products);
  } catch (e) { console.error(e); }
}

function renderProducts(products) {
  const container = document.getElementById('products-container');
  if (!products.length) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">🛍️</div><p>No hay productos. ¡Agrega tu primer producto!</p></div>`;
    return;
  }

  if (viewMode === 'grid') {
    container.innerHTML = `<div class="product-grid">${products.map(p => `
      <div class="product-card ${p.active === 0 ? 'product-inactive' : ''}">
        <div class="product-name">${esc(p.name)}</div>
        <div class="product-category">${esc(p.category || 'Sin categoría')}</div>
        <div class="product-price">${formatMoney(p.price)}</div>
        <div class="product-stock">${p.stock < 0 ? 'Stock ilimitado' : `Stock: ${p.stock}`}</div>
        <div class="product-actions">
          <button class="btn btn-sm btn-secondary" onclick="window._editProduct('${p.id}')">Editar</button>
          <button class="btn btn-sm ${p.active !== 0 ? 'btn-danger' : 'btn-success'}" onclick="window._toggleProduct('${p.id}', ${p.active === 0 ? 1 : 0})">
            ${p.active !== 0 ? 'Desactivar' : 'Activar'}
          </button>
        </div>
      </div>
    `).join('')}</div>`;
  } else {
    container.innerHTML = `
      <div class="card"><div class="card-body no-pad"><div class="table-wrap">
        <table>
          <thead><tr><th>Nombre</th><th>Categoría</th><th class="text-right">Precio</th><th>Stock</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            ${products.map(p => `
              <tr class="${p.active === 0 ? 'product-inactive' : ''}">
                <td><strong>${esc(p.name)}</strong></td>
                <td>${esc(p.category || '-')}</td>
                <td class="text-right">${formatMoney(p.price)}</td>
                <td>${p.stock < 0 ? 'Ilimitado' : p.stock}</td>
                <td><span class="badge ${p.active !== 0 ? 'badge-delivered' : 'badge-cancelled'}">${p.active !== 0 ? 'Activo' : 'Inactivo'}</span></td>
                <td>
                  <div class="btn-group">
                    <button class="btn btn-sm btn-secondary" onclick="window._editProduct('${p.id}')">Editar</button>
                    <button class="btn btn-sm ${p.active !== 0 ? 'btn-danger' : 'btn-success'}" onclick="window._toggleProduct('${p.id}', ${p.active === 0 ? 1 : 0})">
                      ${p.active !== 0 ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div></div></div>`;
  }
}

function showProductModal(product) {
  const isEdit = !!product;
  YayaModal.open(isEdit ? 'Editar Producto' : 'Nuevo Producto', `
    <form id="form-product">
      <div class="form-group">
        <label class="form-label">Nombre *</label>
        <input type="text" id="prod-name" class="form-input" value="${esc(product?.name || '')}" required>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Precio (S/) *</label>
          <input type="number" id="prod-price" class="form-input" step="0.01" min="0" value="${product?.price || ''}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Categoría</label>
          <input type="text" id="prod-category" class="form-input" value="${esc(product?.category || '')}" placeholder="Ej: Pollos, Bebidas">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Descripción</label>
        <textarea id="prod-desc" class="form-textarea" rows="2">${esc(product?.description || '')}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Stock (-1 = ilimitado)</label>
        <input type="number" id="prod-stock" class="form-input" value="${product?.stock ?? -1}" min="-1">
      </div>
      <button type="submit" class="btn btn-primary">${isEdit ? 'Guardar Cambios' : 'Crear Producto'}</button>
    </form>
  `);

  document.getElementById('form-product').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      name: document.getElementById('prod-name').value.trim(),
      price: parseFloat(document.getElementById('prod-price').value),
      category: document.getElementById('prod-category').value.trim(),
      description: document.getElementById('prod-desc').value.trim(),
      stock: parseInt(document.getElementById('prod-stock').value)
    };
    try {
      if (isEdit) {
        await apiPut(`/products/${product.id}`, data);
      } else {
        await apiPost('/products', data);
      }
      YayaModal.close();
      toast(isEdit ? 'Producto actualizado' : 'Producto creado', 'success');
      loadProducts();
    } catch (err) { toast(err.message, 'error'); }
  });
}

window._editProduct = async (id) => {
  try {
    const products = (await apiGet('/products')).data || [];
    const product = products.find(p => p.id === id);
    if (product) showProductModal(product);
  } catch { toast('Error al cargar producto', 'error'); }
};

window._toggleProduct = async (id, active) => {
  try {
    if (active === 0) {
      await apiDelete(`/products/${id}`);
      toast('Producto desactivado', 'info');
    } else {
      await apiPut(`/products/${id}`, { active: 1 });
      toast('Producto activado', 'success');
    }
    loadProducts();
  } catch { toast('Error', 'error'); }
};
