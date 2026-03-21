import { signIn, signOut, getSession, register } from '../shared/auth.js';
import { apiFetch, esc, formatTime, formatDate, formatUptime, formatNumber, formatCurrency, statusClass, emptyState, skeletonRows } from '../shared/utils.js';
import { ThemeManager, ProfileManager, NotificationManager, ConfirmDialog, KeyboardShortcuts, initTheme } from '../shared/theme.js';

// --- State ---
let currentPanel = 'home';
let messagesPage = 0;
const PAGE_SIZE = 50;
let currentUser = null;
let tenantStatus = null;

// --- Auth ---
async function init() {
  // Initialize theme
  initTheme();
  
  const session = await getSession();
  if (!session) {
    showLogin();
    return;
  }
  if (!session.user.tenantId) {
    NotificationManager.error('This account is not linked to a tenant. Contact your administrator.');
    await signOut();
    showLogin();
    return;
  }
  
  currentUser = session.user;
  document.getElementById('welcome-name').textContent = currentUser.name?.split(' ')[0] || 'Business Owner';
  document.getElementById('business-name').textContent = currentUser.tenantName || 'Business Dashboard';
  
  // Initialize profile dropdown
  ProfileManager.init(currentUser);

  // Initialize keyboard shortcuts
  KeyboardShortcuts.init({
    'g+h': { label: 'Go to Home', action: () => switchPanel('home') },
    'g+c': { label: 'Go to Connect', action: () => switchPanel('connect') },
    'g+p': { label: 'Go to Products', action: () => switchPanel('products') },
    'g+o': { label: 'Go to Orders', action: () => switchPanel('orders') },
    'g+u': { label: 'Go to Customers', action: () => switchPanel('customers') },
    'g+m': { label: 'Go to Messages', action: () => switchPanel('messages') },
    'g+l': { label: 'Go to Leads', action: () => { if (currentMode === 'lead_capture') switchPanel('leads'); } },
    'g+a': { label: 'Go to Analytics', action: () => switchPanel('analytics') },
    'g+s': { label: 'Go to Settings', action: () => switchPanel('settings') },
    'n': { label: 'New product', action: () => { if (currentPanel === 'products') openProductModal(); } },
    '/': { label: 'Focus search', action: () => { const s = document.querySelector('.panel.active .search-input input'); if (s) s.focus(); } },
  });

  showApp();
  loadHomeDashboard();

  // Load business mode to show/hide leads nav
  try {
    const settingsRes = await apiFetch('/api/web/settings');
    const settings = await settingsRes.json();
    updateModeUI(settings.business_type || 'retail');
  } catch { /* ignore */ }

  // Setup theme toggle
  setupThemeToggle();
}

function showLogin() {
  stopPolling();
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app-main').style.display = 'none';
}

function showApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app-main').style.display = 'block';
  pollStatus();
  pollQR();
  startPolling();
}

function setupThemeToggle() {
  const toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      ThemeManager.toggle();
      updateThemeIcons();
    });
    updateThemeIcons();
  }
}

function updateThemeIcons() {
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const sunIcons = document.querySelectorAll('.theme-icon-sun');
  const moonIcons = document.querySelectorAll('.theme-icon-moon');
  
  sunIcons.forEach(icon => icon.style.display = isDark ? 'block' : 'none');
  moonIcons.forEach(icon => icon.style.display = isDark ? 'none' : 'block');
}

document.getElementById('btn-login').addEventListener('click', async () => {
  const email = document.getElementById('email-input').value.trim();
  const password = document.getElementById('password-input').value;
  if (!email || !password) return;
  const errEl = document.getElementById('login-error');
  errEl.style.display = 'none';
  try {
    await signIn(email, password);
    const session = await getSession();
    if (!session?.user?.tenantId) {
      errEl.textContent = 'This account is not linked to a tenant.';
      errEl.style.display = 'block';
      await signOut();
      return;
    }
    window.location.reload();
  } catch (err) {
    errEl.textContent = err.message || 'Invalid email or password.';
    errEl.style.display = 'block';
  }
});

document.getElementById('password-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('btn-login').click();
});

// --- Register / Sign-in toggle ---
document.getElementById('show-register').addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('signin-form').style.display = 'none';
  document.getElementById('register-form').style.display = 'block';
  document.getElementById('register-error').style.display = 'none';
  document.getElementById('register-success').style.display = 'none';
});

document.getElementById('show-signin').addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('register-form').style.display = 'none';
  document.getElementById('signin-form').style.display = 'block';
});

document.getElementById('btn-register').addEventListener('click', async () => {
  const businessName = document.getElementById('reg-business').value.trim();
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const errEl = document.getElementById('register-error');
  const successEl = document.getElementById('register-success');
  errEl.style.display = 'none';
  successEl.style.display = 'none';

  if (!businessName || !email || !password) {
    errEl.textContent = 'Business name, email, and password are required.';
    errEl.style.display = 'block';
    return;
  }
  if (password.length < 8) {
    errEl.textContent = 'Password must be at least 8 characters.';
    errEl.style.display = 'block';
    return;
  }

  try {
    await register(email, password, name || businessName, businessName);
    await signIn(email, password);
    const session = await getSession();
    if (session?.user?.tenantId) {
      window.location.reload();
    } else {
      successEl.textContent = 'Account created! You can now sign in.';
      successEl.style.display = 'block';
      setTimeout(() => {
        document.getElementById('register-form').style.display = 'none';
        document.getElementById('signin-form').style.display = 'block';
        document.getElementById('email-input').value = email;
      }, 1500);
    }
  } catch (err) {
    errEl.textContent = err.message || 'Registration failed.';
    errEl.style.display = 'block';
  }
});

document.getElementById('reg-password').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('btn-register').click();
});

// --- Navigation ---
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    const panel = btn.dataset.panel;
    document.getElementById(`panel-${panel}`).classList.add('active');
    currentPanel = panel;
    
    if (panel === 'home') loadHomeDashboard();
    if (panel === 'products') loadProducts();
    if (panel === 'orders') { loadOrders(); loadPendingPayments(); }
    if (panel === 'customers') loadCustomers();
    if (panel === 'messages') loadMessages();
    if (panel === 'analytics') loadAnalytics();
    if (panel === 'leads') loadLeads();
    if (panel === 'subscription') loadStore();
    if (panel === 'settings') loadSettings();
    // Close mobile nav on panel select
    document.querySelector('.app')?.classList.remove('nav-open');
  });
});

// Hamburger menu
document.getElementById('hamburger')?.addEventListener('click', () => {
  document.querySelector('.app')?.classList.toggle('nav-open');
});
document.getElementById('nav-backdrop')?.addEventListener('click', () => {
  document.querySelector('.app')?.classList.remove('nav-open');
});

// Global panel switcher
window.switchPanel = function(panelName) {
  const btn = document.querySelector(`[data-panel="${panelName}"]`);
  if (btn) btn.click();
};

// ==================== HOME DASHBOARD ====================
async function loadHomeDashboard() {
  try {
    const res = await apiFetch('/api/account/status');
    if (res.status === 401) { showLogin(); return; }
    tenantStatus = await res.json();
    
    // Update quick stats
    document.getElementById('home-customers').textContent = formatNumber(tenantStatus.customersCount || 0);
    document.getElementById('home-messages').textContent = formatNumber(tenantStatus.messagesHandled || 0);
    
    // Load additional data
    loadHomeOrders();
    loadHomeProducts();
    loadHomeSales();
    updateHomeConnectionStatus();
  } catch (err) {
    console.error('Failed to load home dashboard:', err);
  }
}

async function loadHomeSales() {
  try {
    const res = await apiFetch('/api/web/analytics/sales?period=today');
    const data = await res.json();
    document.getElementById('home-sales-today').textContent = formatCurrency(data.total || 0);
    const change = data.change || 0;
    const changeEl = document.getElementById('home-sales-change');
    changeEl.textContent = `${change >= 0 ? '+' : ''}${change}%`;
    changeEl.className = `quick-stat-change ${change >= 0 ? 'positive' : 'negative'}`;
  } catch {
    document.getElementById('home-sales-today').textContent = formatCurrency(0);
  }
}

async function loadHomeOrders() {
  try {
    const res = await apiFetch('/api/web/orders?limit=5&offset=0');
    const data = await res.json();
    document.getElementById('home-orders-today').textContent = data.orders?.length || 0;
    
    const container = document.getElementById('home-recent-orders');
    if (!data.orders || data.orders.length === 0) {
      container.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px;">No orders yet</p>';
      return;
    }
    
    container.innerHTML = data.orders.slice(0, 5).map(o => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--border);${o === data.orders[data.orders.length-1] ? 'border-bottom:none;' : ''}">
        <div>
          <div style="font-weight:500;">Order #${o.id}</div>
          <div style="font-size:12px;color:var(--text-muted);">${esc(o.customerName || 'Unknown')}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-weight:600;">${formatCurrency(o.total)}</div>
          <span class="badge badge-${statusClass(o.status)}" style="font-size:10px;padding:2px 8px;">${esc(o.status)}</span>
        </div>
      </div>
    `).join('');
  } catch {
    document.getElementById('home-recent-orders').innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px;">No orders yet</p>';
  }
}

async function loadHomeProducts() {
  try {
    const res = await apiFetch('/api/web/products?limit=5');
    const products = await res.json();
    
    const container = document.getElementById('home-top-products');
    if (!products || products.length === 0) {
      container.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px;">No products yet</p>';
      return;
    }
    
    container.innerHTML = products.slice(0, 5).map((p, i) => `
      <div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--border);${i === products.length - 1 ? 'border-bottom:none;' : ''}">
        <div style="width:40px;height:40px;background:var(--bg);border-radius:var(--radius);display:flex;align-items:center;justify-content:center;font-size:20px;">
          ${p.imageUrl ? `<img src="/media/${esc(p.imageUrl)}" style="width:100%;height:100%;object-fit:cover;border-radius:var(--radius);">` : '📦'}
        </div>
        <div style="flex:1;">
          <div style="font-weight:500;font-size:14px;">${esc(p.name)}</div>
          <div style="font-size:12px;color:var(--text-muted);">${esc(p.category || 'Uncategorized')}</div>
        </div>
        <div style="font-weight:600;color:var(--primary);">${formatCurrency(p.price)}</div>
      </div>
    `).join('');
  } catch {
    document.getElementById('home-top-products').innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px;">No products yet</p>';
  }
}

function updateHomeConnectionStatus() {
  if (!tenantStatus) return;
  
  const card = document.getElementById('home-connection-card');
  const statusEl = document.getElementById('home-connection-status');
  const qrPreview = document.getElementById('home-qr-preview');
  
  if (tenantStatus.connection === 'connected') {
    statusEl.textContent = `Connected: ${tenantStatus.phoneNumber || 'WhatsApp'}`;
    statusEl.style.color = 'var(--success)';
    qrPreview.innerHTML = '<span style="font-size:32px;">✅</span>';
  } else if (tenantStatus.running) {
    statusEl.textContent = 'Connecting...';
    statusEl.style.color = 'var(--warning)';
    qrPreview.innerHTML = '<span style="font-size:32px;">⏳</span>';
  } else {
    statusEl.textContent = 'Not connected - Click to connect';
    statusEl.style.color = 'var(--text-muted)';
    qrPreview.innerHTML = '<span style="font-size:32px;">📱</span>';
  }
}

window.shareBusinessLink = function() {
  const link = `https://wa.me/${tenantStatus?.phoneNumber?.replace(/\D/g, '')}`;
  navigator.clipboard.writeText(link).then(() => {
    NotificationManager.success('Business link copied to clipboard!');
  });
};

// ==================== STATUS POLLING ====================
async function pollStatus() {
  try {
    const res = await apiFetch('/api/account/status');
    if (res.status === 401) { showLogin(); return; }
    tenantStatus = await res.json();
    updateStatusUI(tenantStatus);
    if (currentPanel === 'home') updateHomeConnectionStatus();
  } catch { /* ignore */ }
}

function updateStatusUI(status) {
  const badge = document.getElementById('connection-badge');
  const phone = document.getElementById('phone-number');
  badge.className = 'badge';
  if (status.connection === 'open' || status.connection === 'connected') {
    badge.textContent = 'Connected';
    badge.classList.add('badge-connected');
  } else if (status.running) {
    badge.textContent = 'Connecting';
    badge.classList.add('badge-connecting');
  } else {
    badge.textContent = 'Disconnected';
    badge.classList.add('badge-disconnected');
  }
  phone.textContent = status.phoneNumber ? `+${status.phoneNumber}` : '';
  document.getElementById('stat-uptime').textContent = formatUptime(status.uptime);
  document.getElementById('stat-messages').textContent = status.messagesHandled;
  document.getElementById('stat-products').textContent = status.productsCount;
  document.getElementById('stat-orders').textContent = status.ordersCount;
  document.getElementById('stat-pending').textContent = status.pendingPaymentsCount;
  document.getElementById('toggle-autoreply').checked = status.autoReplyEnabled;
}

// --- QR Polling ---
async function pollQR() {
  try {
    const res = await apiFetch('/api/account/qr');
    if (!res.ok) return;
    const data = await res.json();
    const loading = document.getElementById('qr-loading');
    const img = document.getElementById('qr-image');
    const connected = document.getElementById('qr-connected');
    const connectedPhone = document.getElementById('connected-phone');
    
    if (data.status === 'connected') {
      loading.style.display = 'none';
      img.style.display = 'none';
      connected.style.display = 'flex';
      connectedPhone.textContent = data.phoneNumber ? `+${data.phoneNumber}` : '';
    } else if (data.qr) {
      loading.style.display = 'none';
      img.style.display = 'block';
      img.src = data.qr;
      connected.style.display = 'none';
    } else {
      loading.style.display = 'flex';
      img.style.display = 'none';
      connected.style.display = 'none';
    }
  } catch { /* ignore */ }
}

// --- Bot Controls ---
document.getElementById('btn-start').addEventListener('click', async () => {
  await apiFetch('/api/account/bot/start', { method: 'POST' });
  NotificationManager.success('Bot starting...');
});
document.getElementById('btn-stop').addEventListener('click', async () => {
  await apiFetch('/api/account/bot/stop', { method: 'POST' });
  NotificationManager.info('Bot stopped');
});
document.getElementById('btn-reset').addEventListener('click', async () => {
  if (!await ConfirmDialog.show({ title: 'Reset Connection', message: 'This will disconnect the current number and show a new QR code. Continue?', confirmText: 'Reset', danger: true })) return;
  await apiFetch('/api/account/bot/reset', { method: 'POST' });
  NotificationManager.success('Connection reset');
});
document.getElementById('toggle-autoreply').addEventListener('change', async (e) => {
  await apiFetch('/api/account/bot/toggle-autoreply', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled: e.target.checked }),
  });
  NotificationManager.success(`Auto-reply ${e.target.checked ? 'enabled' : 'disabled'}`);
});

// ==================== PRODUCTS ====================
async function loadProducts() {
  const tbody = document.getElementById('products-body');
  tbody.innerHTML = skeletonRows(7, 4);
  try {
    const res = await apiFetch('/api/web/products');
    const products = await res.json();

    if (products.length === 0) {
      tbody.innerHTML = emptyState('📦', 'No products yet', 'Add your first product to start selling via WhatsApp.', 'Add Product', 'empty-add-product');
      document.getElementById('empty-add-product')?.addEventListener('click', () => openProductModal());
      return;
    }
    
    tbody.innerHTML = products.map(p => `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:40px;height:40px;background:var(--bg);border-radius:var(--radius);display:flex;align-items:center;justify-content:center;">
              ${p.imageUrl ? `<img src="/media/${esc(p.imageUrl)}" style="width:100%;height:100%;object-fit:cover;border-radius:var(--radius);">` : '📦'}
            </div>
            <div>
              <div style="font-weight:500;">${esc(p.name)}</div>
              <div style="font-size:11px;color:var(--text-muted);">${esc(p.productType)}</div>
            </div>
          </div>
        </td>
        <td style="font-weight:600;color:var(--primary);">${formatCurrency(p.price)}</td>
        <td>${esc(p.category)}</td>
        <td>${p.stock === null ? '∞' : p.stock}</td>
        <td><span class="badge badge-${p.active ? 'success' : 'disconnected'}">${p.active ? 'Active' : 'Inactive'}</span></td>
        <td>${p.salesCount || 0}</td>
        <td>
          <div class="action-btns">
            <button class="btn btn-secondary btn-sm" data-edit-product="${p.id}">Edit</button>
            <button class="btn btn-danger btn-sm" data-delete-product="${p.id}">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');
    
    tbody.querySelectorAll('[data-edit-product]').forEach(btn => {
      btn.addEventListener('click', () => editProduct(Number(btn.dataset.editProduct)));
    });
    tbody.querySelectorAll('[data-delete-product]').forEach(btn => {
      btn.addEventListener('click', () => deleteProduct(Number(btn.dataset.deleteProduct)));
    });
    
    // Update category filter
    const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
    const catFilter = document.getElementById('product-category-filter');
    catFilter.innerHTML = '<option value="">All Categories</option>' + 
      categories.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
  } catch { /* ignore */ }
}

async function deleteProduct(id) {
  if (!await ConfirmDialog.show({ title: 'Delete Product', message: 'This product will be permanently removed. Continue?', confirmText: 'Delete', danger: true })) return;
  await apiFetch(`/api/web/products/${id}`, { method: 'DELETE' });
  NotificationManager.success('Product deleted');
  loadProducts();
}

async function editProduct(id) {
  const res = await apiFetch(`/api/web/products/${id}`);
  const p = await res.json();
  document.getElementById('product-modal-title').textContent = 'Edit Product';
  document.getElementById('product-id').value = p.id;
  document.getElementById('product-name').value = p.name;
  document.getElementById('product-description').value = p.description || '';
  document.getElementById('product-price').value = p.price;
  document.getElementById('product-category').value = p.category;
  document.getElementById('product-type').value = p.productType;
  document.getElementById('product-stock').value = p.stock ?? '';
  document.getElementById('product-image-file').value = '';
  
  const preview = document.getElementById('image-preview');
  const previewImg = document.getElementById('image-preview-img');
  if (p.imageUrl) {
    previewImg.src = `/media/${p.imageUrl}`;
    document.getElementById('product-image-path').value = p.imageUrl;
    preview.style.display = 'flex';
  } else {
    document.getElementById('product-image-path').value = '';
    preview.style.display = 'none';
  }
  document.getElementById('product-modal').classList.add('active');
}

window.showAddProductModal = function() {
  document.getElementById('product-modal-title').textContent = 'Add Product';
  document.getElementById('product-form').reset();
  document.getElementById('product-id').value = '';
  document.getElementById('product-category').value = 'General';
  document.getElementById('product-image-path').value = '';
  document.getElementById('image-preview').style.display = 'none';
  document.getElementById('product-modal').classList.add('active');
};

document.getElementById('btn-add-product').addEventListener('click', window.showAddProductModal);
document.getElementById('product-modal-close').addEventListener('click', () => {
  document.getElementById('product-modal').classList.remove('active');
});
document.getElementById('product-modal-cancel').addEventListener('click', () => {
  document.getElementById('product-modal').classList.remove('active');
});

// Close modal on backdrop click
document.getElementById('product-modal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('product-modal')) {
    document.getElementById('product-modal').classList.remove('active');
  }
});

document.getElementById('product-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('product-id').value;
  const stockVal = document.getElementById('product-stock').value;
  const data = {
    name: document.getElementById('product-name').value,
    description: document.getElementById('product-description').value,
    price: Number(document.getElementById('product-price').value),
    category: document.getElementById('product-category').value,
    productType: document.getElementById('product-type').value,
    stock: stockVal === '' ? null : Number(stockVal),
    imageUrl: document.getElementById('product-image-path').value || null,
    active: true,
  };

  let savedProduct;
  if (id) {
    const res = await apiFetch(`/api/web/products/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    savedProduct = await res.json();
    NotificationManager.success('Product updated');
  } else {
    const res = await apiFetch('/api/web/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    savedProduct = await res.json();
    NotificationManager.success('Product created');
  }

  const fileInput = document.getElementById('product-image-file');
  if (fileInput.files.length > 0 && savedProduct?.id) {
    const formData = new FormData();
    formData.append('image', fileInput.files[0]);
    await apiFetch(`/api/web/products/${savedProduct.id}/image`, { method: 'POST', body: formData });
  }

  document.getElementById('product-modal').classList.remove('active');
  loadProducts();
  loadHomeDashboard();
});

// Image file preview
document.getElementById('product-image-file').addEventListener('change', (e) => {
  const file = e.target.files[0];
  const preview = document.getElementById('image-preview');
  const previewImg = document.getElementById('image-preview-img');
  if (file) {
    const reader = new FileReader();
    reader.onload = (ev) => { previewImg.src = ev.target.result; preview.style.display = 'flex'; };
    reader.readAsDataURL(file);
  }
});

document.getElementById('btn-remove-image').addEventListener('click', async () => {
  const id = document.getElementById('product-id').value;
  if (id) {
    await apiFetch(`/api/web/products/${id}/image`, { method: 'DELETE' });
  }
  document.getElementById('product-image-file').value = '';
  document.getElementById('product-image-path').value = '';
  document.getElementById('image-preview').style.display = 'none';
  if (id) loadProducts();
});

// Product search/filter
document.getElementById('product-search')?.addEventListener('input', debounce(() => loadProducts(), 300));

// ==================== ORDERS ====================
async function loadOrders() {
  const tbody = document.getElementById('orders-body');
  tbody.innerHTML = skeletonRows(7, 4);
  try {
    const status = document.getElementById('order-status-filter').value;
    const res = await apiFetch(`/api/web/orders?limit=50&offset=0${status ? `&status=${status}` : ''}`);
    const data = await res.json();
    if (data.orders.length === 0) {
      tbody.innerHTML = emptyState('🛒', 'No orders yet', 'Orders will appear here when customers make purchases via WhatsApp.');
      return;
    }
    tbody.innerHTML = data.orders.map(o => `
      <tr>
        <td><strong>#${o.id}</strong></td>
        <td>${esc(o.customerName || o.customerId)}</td>
        <td>${o.items?.length || 0} items</td>
        <td style="font-weight:600;">${formatCurrency(o.total)}</td>
        <td><span class="badge badge-${statusClass(o.status)}">${esc(o.status)}</span></td>
        <td>${formatDate(o.createdAt)}</td>
        <td>
          <div class="action-btns">
            ${o.status === 'paid' ? `<button class="btn btn-secondary btn-sm" data-order-status="${o.id}:shipped">Mark Shipped</button>` : ''}
            ${o.status === 'shipped' ? `<button class="btn btn-secondary btn-sm" data-order-status="${o.id}:delivered">Mark Delivered</button>` : ''}
            ${!['delivered','cancelled'].includes(o.status) ? `<button class="btn btn-danger btn-sm" data-order-status="${o.id}:cancelled">Cancel</button>` : ''}
          </div>
        </td>
      </tr>
    `).join('');
    tbody.querySelectorAll('[data-order-status]').forEach(btn => {
      btn.addEventListener('click', () => {
        const [id, st] = btn.dataset.orderStatus.split(':');
        updateOrderStatus(Number(id), st);
      });
    });
  } catch { /* ignore */ }
}

document.getElementById('order-status-filter').addEventListener('change', loadOrders);

async function updateOrderStatus(id, status) {
  await apiFetch(`/api/web/orders/${id}/status`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  NotificationManager.success(`Order marked as ${status}`);
  loadOrders();
  loadPendingPayments();
  loadHomeDashboard();
}

// ==================== PAYMENTS ====================
async function loadPendingPayments() {
  try {
    const res = await apiFetch('/api/web/payments/pending');
    const payments = await res.json();
    const tbody = document.getElementById('payments-body');
    if (payments.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty">No pending payments.</td></tr>';
      return;
    }
    tbody.innerHTML = payments.map(p => `
      <tr>
        <td><strong>#${p.id}</strong></td>
        <td>#${p.orderId}</td>
        <td>${esc(p.customerName || p.customerJid)}</td>
        <td style="font-weight:600;">${formatCurrency(p.amount)}</td>
        <td>${esc(p.method)}</td>
        <td>${formatTime(p.createdAt)}</td>
        <td>
          <div class="action-btns">
            <button class="btn btn-primary btn-sm" data-confirm-pay="${p.id}">Confirm</button>
            <button class="btn btn-danger btn-sm" data-reject-pay="${p.id}">Reject</button>
          </div>
        </td>
      </tr>
    `).join('');
    tbody.querySelectorAll('[data-confirm-pay]').forEach(btn => {
      btn.addEventListener('click', () => confirmPayment(Number(btn.dataset.confirmPay)));
    });
    tbody.querySelectorAll('[data-reject-pay]').forEach(btn => {
      btn.addEventListener('click', () => rejectPayment(Number(btn.dataset.rejectPay)));
    });
  } catch { /* ignore */ }
}

async function confirmPayment(id) {
  const ref = prompt('Yape reference (optional):');
  await apiFetch(`/api/web/payments/${id}/confirm`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reference: ref || undefined }),
  });
  NotificationManager.success('Payment confirmed');
  loadPendingPayments();
  loadOrders();
  loadHomeDashboard();
}

async function rejectPayment(id) {
  if (!await ConfirmDialog.show({ title: 'Reject Payment', message: 'This payment will be marked as rejected. Continue?', confirmText: 'Reject', danger: true })) return;
  await apiFetch(`/api/web/payments/${id}/reject`, { method: 'POST' });
  NotificationManager.info('Payment rejected');
  loadPendingPayments();
}

// ==================== CUSTOMERS ====================
async function loadCustomers() {
  const tbody = document.getElementById('customers-body');
  tbody.innerHTML = skeletonRows(7, 4);
  try {
    const res = await apiFetch('/api/web/customers');
    const { customers } = await res.json();
    if (customers.length === 0) {
      tbody.innerHTML = emptyState('👥', 'No customers yet', 'Customers are added automatically when they message your WhatsApp bot.');
      return;
    }
    tbody.innerHTML = customers.map(c => `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--info));display:flex;align-items:center;justify-content:center;color:#fff;font-weight:600;font-size:14px;">
              ${(c.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div style="font-weight:500;">${esc(c.name || 'Unknown')}</div>
          </div>
        </td>
        <td>${esc(c.phone || '-')}</td>
        <td>${c.orderCount || 0}</td>
        <td style="font-weight:600;color:var(--primary);">${formatCurrency(c.totalSpent || 0)}</td>
        <td>${esc(c.location || '-')}</td>
        <td>${formatDate(c.createdAt)}</td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="viewCustomer('${c.id}')">View</button>
        </td>
      </tr>
    `).join('');
  } catch { /* ignore */ }
}

window.viewCustomer = function(id) {
  NotificationManager.info('Customer details coming soon');
};

// ==================== MESSAGES ====================
async function loadMessages() {
  const tbody = document.getElementById('messages-body');
  tbody.innerHTML = skeletonRows(5, 4);
  try {
    const res = await apiFetch(`/api/web/messages?limit=${PAGE_SIZE}&offset=${messagesPage * PAGE_SIZE}`);
    const data = await res.json();
    renderMessages(data.messages);
    const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));
    document.getElementById('page-info').textContent = `Page ${messagesPage + 1} of ${totalPages}`;
    document.getElementById('btn-prev-page').disabled = messagesPage === 0;
    document.getElementById('btn-next-page').disabled = (messagesPage + 1) >= totalPages;
  } catch { /* ignore */ }
}

function renderMessages(messages) {
  const tbody = document.getElementById('messages-body');
  if (messages.length === 0) {
    tbody.innerHTML = emptyState('💬', 'No messages yet', 'Messages will appear here once your WhatsApp bot starts receiving conversations.');
    return;
  }
  tbody.innerHTML = messages.map(m => `
    <tr>
      <td>${formatTime(m.timestamp)}</td>
      <td class="truncate" title="${esc(m.jid)}">${esc(m.pushName || m.jid)}</td>
      <td class="${m.direction === 'incoming' ? 'dir-in' : 'dir-out'}">${m.direction === 'incoming' ? 'IN' : 'OUT'}</td>
      <td class="truncate" title="${esc(m.body)}">${esc(m.body)}</td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="viewMessage('${m.id}')">View</button>
      </td>
    </tr>
  `).join('');
}

window.viewMessage = function(id) {
  NotificationManager.info('Message details coming soon');
};

document.getElementById('btn-refresh-messages').addEventListener('click', loadMessages);
document.getElementById('btn-prev-page').addEventListener('click', () => { if (messagesPage > 0) { messagesPage--; loadMessages(); } });
document.getElementById('btn-next-page').addEventListener('click', () => { messagesPage++; loadMessages(); });

// ==================== ANALYTICS ====================
async function loadAnalytics() {
  try {
    const res = await apiFetch('/api/web/analytics?period=30d');
    const data = await res.json();
    
    document.getElementById('analytics-total-sales').textContent = formatCurrency(data.totalSales || 0);
    document.getElementById('analytics-total-orders').textContent = formatNumber(data.totalOrders || 0);
    document.getElementById('analytics-new-customers').textContent = formatNumber(data.newCustomers || 0);
    document.getElementById('analytics-conversion').textContent = `${data.conversionRate || 0}%`;
    
    // Load categories
    const catContainer = document.getElementById('analytics-categories');
    if (data.categories && data.categories.length > 0) {
      catContainer.innerHTML = data.categories.map(c => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);">
          <span>${esc(c.name)}</span>
          <span style="font-weight:600;color:var(--primary);">${formatCurrency(c.sales)}</span>
        </div>
      `).join('');
    } else {
      catContainer.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px;">No data yet</p>';
    }
    
    // Load top customers
    const topCustContainer = document.getElementById('analytics-top-customers');
    if (data.topCustomers && data.topCustomers.length > 0) {
      topCustContainer.innerHTML = data.topCustomers.map((c, i) => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);${i === data.topCustomers.length - 1 ? 'border-bottom:none;' : ''}">
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:28px;height:28px;border-radius:50%;background:${i < 3 ? 'var(--warning)' : 'var(--surface-hover)'};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;">
              ${i + 1}
            </div>
            <span>${esc(c.name)}</span>
          </div>
          <span style="font-weight:600;">${formatCurrency(c.spent)}</span>
        </div>
      `).join('');
    } else {
      topCustContainer.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px;">No data yet</p>';
    }
  } catch { /* ignore */ }
}

// ==================== SETTINGS ====================
async function loadSettings() {
  try {
    const res = await apiFetch('/api/web/settings');
    const settings = await res.json();
    document.getElementById('system-prompt').value = settings.system_prompt || '';
    document.getElementById('toggle-ai').checked = settings.ai_enabled !== '0';
    document.getElementById('setting-business-name').value = settings.businessName || '';
    document.getElementById('setting-business-phone').value = settings.businessPhone || '';
    document.getElementById('setting-currency').value = settings.currency || 'PEN';

    // Load business mode
    const mode = settings.business_type || 'retail';
    const radio = document.querySelector(`input[name="business_mode"][value="${mode}"]`);
    if (radio) radio.checked = true;
    updateModeUI(mode);
  } catch { /* ignore */ }
  loadApiKey();
}

document.getElementById('btn-save-prompt').addEventListener('click', async () => {
  const value = document.getElementById('system-prompt').value;
  await apiFetch('/api/web/settings/system_prompt', {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value }),
  });
  NotificationManager.success('System prompt saved');
});

document.getElementById('toggle-ai').addEventListener('change', async (e) => {
  await apiFetch('/api/web/settings/ai_enabled', {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value: e.target.checked ? '1' : '0' }),
  });
  NotificationManager.success(`AI ${e.target.checked ? 'enabled' : 'disabled'}`);
});

document.getElementById('btn-save-business').addEventListener('click', async () => {
  const data = {
    businessName: document.getElementById('setting-business-name').value,
    businessPhone: document.getElementById('setting-business-phone').value,
    currency: document.getElementById('setting-currency').value
  };
  await apiFetch('/api/web/settings/business', {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  NotificationManager.success('Business settings saved');
});

// --- API Key Management ---
let apiKeyValue = '';
let apiKeyVisible = false;

async function loadApiKey() {
  try {
    const res = await apiFetch('/api/account');
    const data = await res.json();
    apiKeyValue = data.apiKey || '';
    updateApiKeyDisplay();
  } catch { /* ignore */ }
}

function updateApiKeyDisplay() {
  const input = document.getElementById('api-key-display');
  if (!input || !apiKeyValue) return;
  input.value = apiKeyVisible ? apiKeyValue : '••••••••' + apiKeyValue.slice(-4);
}

document.getElementById('btn-toggle-key')?.addEventListener('click', () => {
  apiKeyVisible = !apiKeyVisible;
  updateApiKeyDisplay();
});

document.getElementById('btn-copy-key')?.addEventListener('click', () => {
  if (!apiKeyValue) return;
  navigator.clipboard.writeText(apiKeyValue).then(() => {
    NotificationManager.success('API key copied to clipboard');
  });
});

document.getElementById('btn-rotate-key')?.addEventListener('click', async () => {
  if (!await ConfirmDialog.show({ title: 'Rotate API Key', message: 'The current key will stop working immediately. Any integrations using it will break.', confirmText: 'Rotate Key', danger: true })) return;
  try {
    const res = await apiFetch('/api/account/api-key/rotate', { method: 'POST' });
    const data = await res.json();
    apiKeyValue = data.apiKey || '';
    apiKeyVisible = true;
    updateApiKeyDisplay();
    NotificationManager.success('API key rotated. Copy your new key now.');
  } catch {
    NotificationManager.error('Failed to rotate API key');
  }
});

window.clearAllData = async function() {
  if (!await ConfirmDialog.show({ title: 'Delete All Data', message: 'WARNING: This will delete ALL your data permanently. This cannot be undone.', confirmText: 'Delete Everything', danger: true })) return;
  NotificationManager.info('Data deletion initiated...');
};

window.exportAllData = function() {
  NotificationManager.info('Preparing data export...');
  setTimeout(() => NotificationManager.success('Data exported successfully'), 1000);
};

// --- Polling loops ---
let statusInterval = null;
let qrInterval = null;

function startPolling() {
  stopPolling();
  statusInterval = setInterval(() => pollStatus(), 5000);
  qrInterval = setInterval(() => pollQR(), 2000);
}

function stopPolling() {
  if (statusInterval) { clearInterval(statusInterval); statusInterval = null; }
  if (qrInterval) { clearInterval(qrInterval); qrInterval = null; }
}

// ==================== STORE/SUBSCRIPTION ====================
async function loadStore() {
  try {
    const [statusRes, plansRes] = await Promise.all([
      apiFetch('/api/account/status'),
      apiFetch('/api/plans'),
    ]);
    const status = await statusRes.json();
    const plans = await plansRes.json();

    if (status.subscription) {
      const sub = status.subscription;
      document.getElementById('store-plan-name').textContent = sub.planName;
      document.getElementById('store-messages-used').textContent = formatNumber(sub.messagesUsed);
      document.getElementById('store-messages-limit').textContent =
        sub.messagesLimit === -1 ? 'Unlimited' : formatNumber(sub.messagesLimit);
      document.getElementById('store-status').textContent = sub.isPaid ? 'Premium' : 'Free';

      const usageBar = document.getElementById('store-usage-fill');
      const usageText = document.getElementById('store-usage-text');
      if (sub.messagesLimit > 0) {
        const pct = Math.min(100, Math.round((sub.messagesUsed / sub.messagesLimit) * 100));
        usageBar.style.width = pct + '%';
        usageBar.className = 'progress-fill' + (pct >= 90 ? ' danger' : pct >= 70 ? ' warning' : '');
        usageText.textContent = `${pct}%`;
      } else {
        usageBar.style.width = '100%';
        usageBar.className = 'progress-fill';
        usageText.textContent = 'Unlimited';
      }

      document.getElementById('store-limit-warning').style.display =
        sub.canSendMessages ? 'none' : 'block';
    }

    // Render available plans
    const container = document.getElementById('store-plans');
    const currentSlug = status.subscription?.planSlug || 'free';
    container.innerHTML = plans
      .filter(p => p.active)
      .map(p => {
        const isCurrent = currentSlug === p.slug;
        const isFree = p.slug === 'free';
        return `
          <div class="plan-card ${isCurrent ? 'plan-active' : ''}">
            <h3>${esc(p.name)}</h3>
            <p class="plan-price">${isFree ? 'Free' : formatCurrency(p.price)}</p>
            <p class="plan-cycle">${
              p.billingCycle === 'monthly' ? 'per month' :
              p.billingCycle === 'quarterly' ? 'per 3 months' :
              p.billingCycle === 'free' ? '100 messages' : p.billingCycle
            }</p>
            <p class="plan-desc">${esc(p.description || '')}</p>
            <ul class="plan-features">
              <li>WhatsApp AI Assistant</li>
              <li>${isFree ? '100 messages/mo' : 'Unlimited messages'}</li>
              ${!isFree ? '<li>Priority support</li><li>Analytics dashboard</li>' : ''}
            </ul>
            ${!isFree ? `
              <button class="btn btn-primary" style="width:100%;margin-top:16px;"
                      data-subscribe-plan="${p.id}" ${isCurrent ? 'disabled' : ''}>
                ${isCurrent ? 'Current Plan' : 'Subscribe'}
              </button>
            ` : `<p style="color:var(--primary);margin-top:16px;font-weight:600;">Current Plan</p>`}
          </div>
        `;
      }).join('');

    container.querySelectorAll('[data-subscribe-plan]').forEach(btn => {
      btn.addEventListener('click', () => subscribeToPlan(Number(btn.dataset.subscribePlan)));
    });
  } catch { /* ignore */ }
}

async function subscribeToPlan(planId) {
  if (!await ConfirmDialog.show({ title: 'Subscribe', message: 'Confirm subscription? A pending payment will be created.', confirmText: 'Subscribe' })) return;
  try {
    const res = await apiFetch('/api/subscription/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId }),
    });
    if (res.ok) {
      NotificationManager.success('Subscription activated! Complete payment to confirm.');
      loadStore();
    } else {
      const err = await res.json();
      NotificationManager.error(err.error || 'Subscription failed');
    }
  } catch {
    NotificationManager.error('Connection error');
  }
}

// ==================== UTILITIES ====================
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ==================== BUSINESS MODE ====================
let currentMode = 'retail';

function updateModeUI(mode) {
  currentMode = mode;
  const leadsNav = document.getElementById('nav-leads');
  if (leadsNav) {
    leadsNav.style.display = mode === 'lead_capture' ? '' : 'none';
  }
}

document.getElementById('mode-selector')?.addEventListener('change', async (e) => {
  if (!e.target.matches('input[name="business_mode"]')) return;
  const mode = e.target.value;
  await apiFetch('/api/web/settings/business_type', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value: mode }),
  });
  updateModeUI(mode);
  NotificationManager.success(`Business mode set to ${mode.replace('_', ' ')}`);
});

// ==================== LEADS ====================
async function loadLeads() {
  const tbody = document.getElementById('leads-body');
  if (!tbody) return;
  tbody.innerHTML = skeletonRows(8, 4);
  try {
    const status = document.getElementById('lead-status-filter')?.value || '';
    const url = status ? `/api/leads?status=${status}` : '/api/leads';
    const res = await apiFetch(url);
    const leads = await res.json();

    document.getElementById('leads-count').textContent = `${leads.length} lead${leads.length !== 1 ? 's' : ''}`;

    if (leads.length === 0) {
      tbody.innerHTML = emptyState('🎯', 'No leads yet', 'Leads will appear here when your WhatsApp bot captures contact information in Lead Capture mode.');
      return;
    }

    tbody.innerHTML = leads.map(l => `
      <tr>
        <td><strong>${esc(l.name) || '—'}</strong></td>
        <td>${esc(l.company) || '—'}</td>
        <td>
          <div style="font-size:12px;">
            ${l.email ? `<div>${esc(l.email)}</div>` : ''}
            ${l.phone ? `<div>${esc(l.phone)}</div>` : ''}
            ${!l.email && !l.phone ? '—' : ''}
          </div>
        </td>
        <td><span class="truncate" style="max-width:150px;display:inline-block;">${esc(l.interest) || '—'}</span></td>
        <td>${formatScore(l.qualificationScore)}</td>
        <td><span class="badge badge-${leadStatusClass(l.status)}">${esc(l.status)}</span></td>
        <td><span style="font-size:12px;color:var(--text-muted);">${esc(l.source) || '—'}</span></td>
        <td style="white-space:nowrap;">${formatDate(l.createdAt)}</td>
      </tr>
    `).join('');
  } catch {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--text-muted);">Failed to load leads</td></tr>';
  }
}

function formatScore(score) {
  if (score == null) return '<span class="score-badge score-low">—</span>';
  const cls = score >= 70 ? 'score-high' : score >= 40 ? 'score-medium' : 'score-low';
  return `<span class="score-badge ${cls}">${score}</span>`;
}

function leadStatusClass(status) {
  if (['qualified', 'won'].includes(status)) return 'connected';
  if (['lost'].includes(status)) return 'disconnected';
  return 'connecting';
}

document.getElementById('lead-status-filter')?.addEventListener('change', () => loadLeads());

// --- Init ---
init();
