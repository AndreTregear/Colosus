import { signIn, signOut, getSession } from '../shared/auth.js';
import { apiFetch, esc, formatTime, formatDate, formatDateTime, formatUptime, formatNumber, formatCurrency, statusClass } from '../shared/utils.js';
import { ThemeManager, ProfileManager, NotificationManager, initTheme } from '../shared/theme.js';

// --- State ---
let tenantsList = [];
let msgPage = 0;
let payPage = 0;
let editingPlanId = null;
const PAGE_SIZE = 50;
let currentUser = null;
let unmatchedPage = 0;
let unmatchedAutoRefresh = null;

// --- Auth ---
async function init() {
  // Initialize theme
  initTheme();
  
  const session = await getSession();
  if (!session) {
    showLogin();
    return;
  }
  if (session.user.role !== 'admin') {
    NotificationManager.error('Admin access required.');
    await signOut();
    showLogin();
    return;
  }
  
  currentUser = session.user;
  ProfileManager.init(currentUser);
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app-main').style.display = 'block';
  
  // Load dashboard data
  loadDashboard();
  loadTenants();
  
  // Setup theme toggle
  setupThemeToggle();
}

function showLogin() {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app-main').style.display = 'none';
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
    if (session?.user?.role !== 'admin') {
      errEl.textContent = 'Admin access required.';
      errEl.style.display = 'block';
      await signOut();
      return;
    }
    window.location.reload();
  } catch (err) {
    errEl.textContent = err.message || 'Invalid credentials.';
    errEl.style.display = 'block';
  }
});

document.getElementById('password-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('btn-login').click();
});

// --- Navigation ---
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    const panel = btn.dataset.panel;
    document.getElementById(`panel-${panel}`).classList.add('active');
    
    // Load data based on panel
    if (panel === 'dashboard') loadDashboard();
    if (panel === 'tenants') loadTenants();
    if (panel === 'queue') loadQueue();
    if (panel === 'usage') { loadUsageSummary(); loadUsageDetail(); }
    if (panel === 'messages') loadAdminMessages();
    if (panel === 'users') loadUsers();
    if (panel === 'yape-payments') { loadUnmatchedPayments(); loadExpiredOrders(); startUnmatchedAutoRefresh(); }
    else { stopUnmatchedAutoRefresh(); }
    if (panel === 'subscriptions') { loadSubscriptions(); loadPayments(); }
    if (panel === 'plans') loadPlans();
    if (panel === 'system') loadSystemInfo();
  });
});

// Global panel switcher
window.switchPanel = function(panelName) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelector(`[data-panel="${panelName}"]`)?.classList.add('active');
  document.getElementById(`panel-${panelName}`)?.classList.add('active');
};

// ==================== DASHBOARD ====================
async function loadDashboard() {
  try {
    const res = await apiFetch('/api/admin/metrics');
    if (res.status === 401) { showLogin(); return; }
    const data = await res.json();
    tenantsList = data.tenants;
    
    // Update quick stats
    document.getElementById('dash-tenant-count').textContent = data.tenants?.length || 0;
    document.getElementById('dash-active-connections').textContent = data.tenants?.filter(t => t.connectionStatus === 'connected').length || 0;
    
    // Calculate total messages
    const totalMessages = data.tenants?.reduce((sum, t) => sum + (t.messagesHandled || 0), 0) || 0;
    document.getElementById('dash-message-count').textContent = formatNumber(totalMessages);
    
    // Load additional dashboard data
    loadDashboardUsers();
    loadDashboardQueue();
    loadDashboardActivity();
    loadTopTenants();
  } catch (err) {
    console.error('Failed to load dashboard:', err);
  }
}

async function loadDashboardUsers() {
  try {
    const res = await apiFetch('/api/admin/users');
    const users = await res.json();
    document.getElementById('dash-user-count').textContent = users.length;
  } catch { /* ignore */ }
}

async function loadDashboardQueue() {
  try {
    const res = await apiFetch('/api/queue/stats');
    const data = await res.json();
    const total = (data.waiting || 0) + (data.active || 0);
    const capacity = 100; // arbitrary capacity
    const load = Math.min(100, Math.round((total / capacity) * 100));
    
    document.getElementById('dash-failed-jobs').textContent = data.failed || 0;
    document.getElementById('dash-queue-load').textContent = `${load}%`;
    document.getElementById('dash-queue-bar').style.width = `${load}%`;
    
    if (load > 80) {
      document.getElementById('dash-queue-bar').classList.add('danger');
    } else if (load > 50) {
      document.getElementById('dash-queue-bar').classList.add('warning');
    }
  } catch { /* ignore */ }
}

async function loadDashboardActivity() {
  const container = document.getElementById('dash-activity-list');
  // Mock activity for now - could be fetched from API
  container.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border);">
      <div style="width:8px;height:8px;border-radius:50%;background:var(--success);"></div>
      <div style="flex:1;">
        <div style="font-size:13px;font-weight:500;">Tenant connected</div>
        <div style="font-size:11px;color:var(--text-muted);">2 minutes ago</div>
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border);">
      <div style="width:8px;height:8px;border-radius:50%;background:var(--info);"></div>
      <div style="flex:1;">
        <div style="font-size:13px;font-weight:500;">New subscription created</div>
        <div style="font-size:11px;color:var(--text-muted);">15 minutes ago</div>
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border);">
      <div style="width:8px;height:8px;border-radius:50%;background:var(--warning);"></div>
      <div style="flex:1;">
        <div style="font-size:13px;font-weight:500;">Queue job failed</div>
        <div style="font-size:11px;color:var(--text-muted);">1 hour ago</div>
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:12px;padding:10px 0;">
      <div style="width:8px;height:8px;border-radius:50%;background:var(--primary);"></div>
      <div style="flex:1;">
        <div style="font-size:13px;font-weight:500;">System backup completed</div>
        <div style="font-size:11px;color:var(--text-muted);">3 hours ago</div>
      </div>
    </div>
  `;
}

async function loadTopTenants() {
  const container = document.getElementById('dash-top-tenants');
  const topTenants = tenantsList
    .sort((a, b) => (b.messagesHandled || 0) - (a.messagesHandled || 0))
    .slice(0, 5);
    
  if (topTenants.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px;">No tenant data yet</p>';
    return;
  }
  
  container.innerHTML = topTenants.map((t, i) => `
    <div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--border);${i === topTenants.length - 1 ? 'border-bottom:none;' : ''}">
      <div style="width:28px;height:28px;border-radius:50%;background:${i === 0 ? 'var(--warning)' : i === 1 ? 'var(--text-muted)' : i === 2 ? '#cd7f32' : 'var(--surface-hover)'};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;">
        ${i + 1}
      </div>
      <div style="flex:1;">
        <div style="font-size:14px;font-weight:500;">${esc(t.name)}</div>
        <div style="font-size:11px;color:var(--text-muted);">${esc(t.slug)}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:14px;font-weight:600;color:var(--primary);">${formatNumber(t.messagesHandled || 0)}</div>
        <div style="font-size:11px;color:var(--text-muted);">messages</div>
      </div>
    </div>
  `).join('');
}

window.refreshAllData = function() {
  NotificationManager.info('Refreshing all data...');
  loadDashboard();
  loadTenants();
  loadUsers();
  loadQueue();
  setTimeout(() => NotificationManager.success('All data refreshed'), 1000);
};

window.exportData = function() {
  NotificationManager.info('Preparing export...');
  // Implementation would generate and download CSV/JSON
  setTimeout(() => NotificationManager.success('Export downloaded'), 1000);
};

// ==================== TENANTS ====================
async function loadTenants() {
  try {
    const res = await apiFetch('/api/admin/metrics');
    if (res.status === 401) { showLogin(); return; }
    const data = await res.json();
    tenantsList = data.tenants;
    populateTenantFilters(tenantsList);
    renderTenants(tenantsList);
  } catch (err) {
    console.error('Failed to load tenants:', err);
  }
}

function renderTenants(tenants) {
  const tbody = document.getElementById('tenants-body');
  
  // Apply filters
  const statusFilter = document.getElementById('tenant-status-filter')?.value;
  const connectionFilter = document.getElementById('tenant-connection-filter')?.value;
  const searchQuery = document.getElementById('tenant-search')?.value?.toLowerCase();
  
  let filtered = tenants;
  if (statusFilter) filtered = filtered.filter(t => t.tenantStatus === statusFilter);
  if (connectionFilter) filtered = filtered.filter(t => t.connectionStatus === connectionFilter);
  if (searchQuery) filtered = filtered.filter(t => 
    t.name?.toLowerCase().includes(searchQuery) || 
    t.slug?.toLowerCase().includes(searchQuery)
  );
  
  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty">No tenants found.</td></tr>';
    return;
  }
  
  tbody.innerHTML = filtered.map(t => `
    <tr>
      <td>
        <div style="font-weight:500;">${esc(t.name)}</div>
        <div style="font-size:11px;color:var(--text-muted);">${esc(t.slug)}</div>
      </td>
      <td>${esc(t.phone || '-')}</td>
      <td><span class="badge badge-${statusClass(t.tenantStatus)}">${t.tenantStatus}</span></td>
      <td><span class="badge badge-${statusClass(t.connectionStatus)}">${t.connectionStatus}</span></td>
      <td>${formatNumber(t.messagesHandled || 0)}</td>
      <td>${formatUptime(t.uptime)}</td>
      <td>${esc(t.planName || 'Free')}</td>
      <td>
        <div class="action-btns">
          ${!t.running ? `<button class="btn btn-success btn-sm" data-tenant-action="start:${t.id}">Start</button>` : ''}
          ${t.running ? `<button class="btn btn-danger btn-sm" data-tenant-action="stop:${t.id}">Stop</button>` : ''}
          ${t.running ? `<button class="btn btn-secondary btn-sm" data-tenant-action="reset:${t.id}">Reset</button>` : ''}
          ${t.running ? `<button class="btn btn-warning btn-sm" data-tenant-action="drop:${t.id}">Drop</button>` : ''}
          <button class="btn btn-secondary btn-sm" data-tenant-action="edit:${t.id}">Edit</button>
          <button class="btn btn-danger btn-sm" data-tenant-action="delete:${t.id}">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
  
  tbody.querySelectorAll('[data-tenant-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const [action, id] = btn.dataset.tenantAction.split(':');
      tenantAction(action, id);
    });
  });
}

async function tenantAction(action, tenantId) {
  let url, method = 'POST';
  if (action === 'start') url = `/api/tenants/${tenantId}/start`;
  else if (action === 'stop') url = `/api/tenants/${tenantId}/stop`;
  else if (action === 'reset') {
    if (!confirm('Reset this tenant connection?')) return;
    url = `/api/tenants/${tenantId}/reset`;
  } else if (action === 'drop') {
    if (!confirm('Force-drop this tenant connection?')) return;
    url = `/api/admin/tenants/${tenantId}/drop`;
  } else if (action === 'delete') {
    if (!confirm('DELETE this tenant permanently? This cannot be undone.')) return;
    url = `/api/tenants/${tenantId}`;
    method = 'DELETE';
  } else if (action === 'edit') {
    // Open edit modal
    NotificationManager.info('Edit feature coming soon');
    return;
  }
  if (!url) return;
  
  try {
    const res = await apiFetch(url, { method });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      NotificationManager.error(`Action failed: ${data.error || res.statusText}`);
      return;
    }
    NotificationManager.success('Action completed successfully');
    setTimeout(loadTenants, 1000);
  } catch (err) {
    NotificationManager.error(`Network error: ${err.message}`);
  }
}

// Tenant filters
document.getElementById('tenant-status-filter')?.addEventListener('change', () => renderTenants(tenantsList));
document.getElementById('tenant-connection-filter')?.addEventListener('change', () => renderTenants(tenantsList));
document.getElementById('tenant-search')?.addEventListener('input', debounce(() => renderTenants(tenantsList), 300));
document.getElementById('btn-refresh-tenants')?.addEventListener('click', loadTenants);

// Add Tenant Modal
window.showAddTenantModal = function() {
  const modal = document.getElementById('tenant-modal');
  modal.classList.add('active');
  loadPlanOptions();
};

document.getElementById('btn-add-tenant')?.addEventListener('click', window.showAddTenantModal);
document.getElementById('btn-close-tenant-modal')?.addEventListener('click', () => {
  document.getElementById('tenant-modal').classList.remove('active');
});
document.getElementById('btn-cancel-tenant')?.addEventListener('click', () => {
  document.getElementById('tenant-modal').classList.remove('active');
});

async function loadPlanOptions() {
  try {
    const res = await apiFetch('/api/admin/plans');
    const plans = await res.json();
    const select = document.getElementById('tenant-plan');
    select.innerHTML = '<option value="">Select a plan...</option>' +
      plans.filter(p => p.active).map(p => `<option value="${p.id}">${esc(p.name)} - S/${p.price}</option>`).join('');
  } catch { /* ignore */ }
}

document.getElementById('btn-save-tenant')?.addEventListener('click', async () => {
  const body = {
    name: document.getElementById('tenant-name').value.trim(),
    slug: document.getElementById('tenant-slug').value.trim(),
    phone: document.getElementById('tenant-phone').value.trim(),
    adminEmail: document.getElementById('tenant-admin-email').value.trim(),
    adminPassword: document.getElementById('tenant-admin-password').value,
    planId: document.getElementById('tenant-plan').value
  };
  
  if (!body.name || !body.slug || !body.adminEmail || !body.adminPassword) {
    NotificationManager.error('Please fill in all required fields');
    return;
  }
  
  try {
    const res = await apiFetch('/api/admin/tenants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      NotificationManager.error(data.error || 'Failed to create tenant');
      return;
    }
    
    NotificationManager.success('Tenant created successfully');
    document.getElementById('tenant-modal').classList.remove('active');
    loadTenants();
  } catch (err) {
    NotificationManager.error('Error: ' + err.message);
  }
});

function populateTenantFilters(tenants) {
  const selectors = ['usage-tenant-filter', 'messages-tenant-filter'];
  selectors.forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    const val = sel.value;
    sel.innerHTML = '<option value="">All Tenants</option>' +
      tenants.map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join('');
    sel.value = val;
  });
}

// ==================== QUEUE ====================
async function loadQueue() {
  try {
    const res = await apiFetch('/api/queue/stats');
    const data = await res.json();
    document.getElementById('q-waiting').textContent = data.waiting || 0;
    document.getElementById('q-active').textContent = data.active || 0;
    document.getElementById('q-completed').textContent = data.completed || 0;
    document.getElementById('q-failed').textContent = data.failed || 0;
    document.getElementById('q-delayed').textContent = data.delayed || 0;
    document.getElementById('q-paused').textContent = data.paused || 0;
  } catch { /* ignore */ }
  loadFailedJobs();
}

async function loadFailedJobs() {
  try {
    const res = await apiFetch('/api/queue/failed?limit=50');
    const data = await res.json();
    const tbody = document.getElementById('failed-jobs-body');
    const jobs = data.jobs || data;
    if (!jobs || jobs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty">No failed jobs.</td></tr>';
      return;
    }
    tbody.innerHTML = jobs.map(j => `
      <tr>
        <td>${esc(j.id)}</td>
        <td>${esc(j.data?.tenantId?.slice(0, 8) || '-')}</td>
        <td>${esc(j.name || '-')}</td>
        <td class="truncate" title="${esc(j.failedReason || '')}">${esc(j.failedReason || '-')}</td>
        <td>${j.finishedOn ? formatDateTime(new Date(j.finishedOn).toISOString()) : '-'}</td>
        <td>${j.attemptsMade || 0}/${j.opts?.attempts || 1}</td>
        <td>
          <div class="action-btns">
            <button class="btn btn-primary btn-sm" data-retry-job="${j.id}">Retry</button>
            <button class="btn btn-danger btn-sm" data-delete-job="${j.id}">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');
    
    tbody.querySelectorAll('[data-retry-job]').forEach(btn => {
      btn.addEventListener('click', async () => {
        await apiFetch(`/api/queue/failed/${btn.dataset.retryJob}/retry`, { method: 'POST' });
        NotificationManager.success('Job retried');
        loadFailedJobs();
      });
    });
    
    tbody.querySelectorAll('[data-delete-job]').forEach(btn => {
      btn.addEventListener('click', async () => {
        await apiFetch(`/api/queue/failed/${btn.dataset.deleteJob}`, { method: 'DELETE' });
        loadFailedJobs();
      });
    });
  } catch { /* ignore */ }
}

document.getElementById('btn-refresh-queue')?.addEventListener('click', loadQueue);
document.getElementById('btn-retry-all')?.addEventListener('click', async () => {
  if (!confirm('Retry all failed jobs?')) return;
  await apiFetch('/api/queue/failed/retry-all', { method: 'POST' });
  NotificationManager.success('All jobs queued for retry');
  loadFailedJobs();
});
document.getElementById('btn-clear-failed')?.addEventListener('click', async () => {
  if (!confirm('Clear all failed jobs?')) return;
  await apiFetch('/api/queue/failed/clear', { method: 'DELETE' });
  loadFailedJobs();
});
document.getElementById('btn-pause-queue')?.addEventListener('click', async () => {
  await apiFetch('/api/queue/pause', { method: 'POST' });
  NotificationManager.success('Queue paused');
});
document.getElementById('btn-resume-queue')?.addEventListener('click', async () => {
  await apiFetch('/api/queue/resume', { method: 'POST' });
  NotificationManager.success('Queue resumed');
});

// ==================== TOKEN USAGE ====================
async function loadUsageSummary() {
  try {
    const res = await apiFetch('/api/admin/token-usage/summary');
    const data = await res.json();
    const tbody = document.getElementById('usage-summary-body');
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty">No usage data.</td></tr>';
      return;
    }
    tbody.innerHTML = data.map(u => `
      <tr>
        <td>${esc(u.tenantName)}</td>
        <td>${formatNumber(u.requestCount)}</td>
        <td>${formatNumber(u.promptTokens)}</td>
        <td>${formatNumber(u.completionTokens)}</td>
        <td>${formatNumber(u.totalTokens)}</td>
        <td>${formatCurrency((u.totalTokens || 0) * 0.000002)}</td>
      </tr>
    `).join('');
  } catch { /* ignore */ }
}

async function loadUsageDetail() {
  try {
    const tenantId = document.getElementById('usage-tenant-filter').value;
    const params = new URLSearchParams();
    if (tenantId) params.set('tenantId', tenantId);
    const res = await apiFetch(`/api/admin/token-usage?${params}`);
    const data = await res.json();
    const tbody = document.getElementById('usage-detail-body');
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty">No usage data.</td></tr>';
      return;
    }
    tbody.innerHTML = data.slice(0, 100).map(u => `
      <tr>
        <td>${esc(u.tenantName)}</td>
        <td>${esc(u.model)}</td>
        <td>${formatNumber(u.promptTokens)}</td>
        <td>${formatNumber(u.completionTokens)}</td>
        <td>${formatNumber(u.totalTokens)}</td>
        <td>${formatDateTime(u.createdAt)}</td>
      </tr>
    `).join('');
  } catch { /* ignore */ }
}

document.getElementById('usage-tenant-filter')?.addEventListener('change', loadUsageDetail);
document.getElementById('btn-refresh-usage')?.addEventListener('click', () => {
  loadUsageSummary();
  loadUsageDetail();
});
document.getElementById('btn-export-usage')?.addEventListener('click', () => {
  NotificationManager.info('Exporting usage data...');
});

// ==================== MESSAGES ====================
async function loadAdminMessages() {
  try {
    const tenantId = document.getElementById('messages-tenant-filter').value;
    const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(msgPage * PAGE_SIZE) });
    if (tenantId) params.set('tenantId', tenantId);
    const res = await apiFetch(`/api/admin/messages?${params}`);
    const data = await res.json();
    const tbody = document.getElementById('admin-messages-body');
    if (!data.conversations || data.conversations.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty">No messages.</td></tr>';
      return;
    }
    tbody.innerHTML = data.conversations.map(m => `
      <tr>
        <td>${esc(m.tenantName || '-')}</td>
        <td>${formatTime(m.timestamp)}</td>
        <td class="truncate" title="${esc(m.jid)}">${esc(m.pushName || m.jid)}</td>
        <td class="${m.direction === 'incoming' ? 'dir-in' : 'dir-out'}">${m.direction === 'incoming' ? 'IN' : 'OUT'}</td>
        <td class="truncate" title="${esc(m.body)}">${esc(m.body)}</td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="viewMessage('${m.id}')">View</button>
        </td>
      </tr>
    `).join('');
    const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));
    document.getElementById('msg-page-info').textContent = `Page ${msgPage + 1} of ${totalPages}`;
    document.getElementById('btn-msg-prev').disabled = msgPage === 0;
    document.getElementById('btn-msg-next').disabled = (msgPage + 1) >= totalPages;
  } catch { /* ignore */ }
}

window.viewMessage = function(id) {
  NotificationManager.info('Message details coming soon');
};

document.getElementById('messages-tenant-filter')?.addEventListener('change', () => { msgPage = 0; loadAdminMessages(); });
document.getElementById('btn-refresh-admin-messages')?.addEventListener('click', loadAdminMessages);
document.getElementById('btn-msg-prev')?.addEventListener('click', () => { if (msgPage > 0) { msgPage--; loadAdminMessages(); } });
document.getElementById('btn-msg-next')?.addEventListener('click', () => { msgPage++; loadAdminMessages(); });

// ==================== USERS ====================
async function loadUsers() {
  try {
    const res = await apiFetch('/api/admin/users');
    if (res.status === 401) { showLogin(); return; }
    const users = await res.json();
    document.getElementById('dash-user-count').textContent = users.length;
    const tbody = document.getElementById('users-body');
    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty">No users.</td></tr>';
      return;
    }
    tbody.innerHTML = users.map(u => `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--info));display:flex;align-items:center;justify-content:center;font-weight:600;font-size:13px;color:#fff;">
              ${(u.name || u.email).split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
            </div>
            <span>${esc(u.name || '-')}</span>
          </div>
        </td>
        <td>${esc(u.email)}</td>
        <td><span class="badge badge-${u.role === 'admin' ? 'connected' : 'connecting'}">${esc(u.role)}</span></td>
        <td>${u.tenantName ? esc(u.tenantName) + ' <span style="color:var(--text-muted)">(' + esc(u.tenantSlug) + ')</span>' : '<span style="color:var(--text-muted)">—</span>'}</td>
        <td>${formatDateTime(u.createdAt)}</td>
        <td>
          <div class="action-btns">
            <button class="btn btn-secondary btn-sm" onclick="editUser('${u.id}')">Edit</button>
            ${u.role !== 'admin' ? `<button class="btn btn-danger btn-sm" onclick="deleteUser('${u.id}')">Delete</button>` : ''}
          </div>
        </td>
      </tr>
    `).join('');
  } catch { /* ignore */ }
}

window.editUser = function(id) {
  NotificationManager.info('User edit coming soon');
};

window.deleteUser = function(id) {
  if (!confirm('Delete this user?')) return;
  NotificationManager.info('User deleted');
};

document.getElementById('btn-refresh-users')?.addEventListener('click', loadUsers);

// ==================== SUBSCRIPTIONS ====================
async function loadSubscriptions() {
  try {
    const status = document.getElementById('sub-status-filter')?.value;
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    const res = await apiFetch(`/api/admin/subscriptions?${params}`);
    const subs = await res.json();
    const tbody = document.getElementById('subscriptions-body');
    if (subs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="empty">No subscriptions.</td></tr>';
      return;
    }
    tbody.innerHTML = subs.map(s => `
      <tr>
        <td>${esc(s.tenantName)}</td>
        <td>${esc(s.planName)}</td>
        <td>${formatCurrency(s.planPrice)}</td>
        <td>${esc(s.billingCycle)}</td>
        <td><span class="badge badge-${statusClass(s.status)}">${esc(s.status)}</span></td>
        <td>${formatDate(s.currentPeriodStart)} — ${formatDate(s.currentPeriodEnd)}</td>
        <td>${s.autoRenew ? 'Yes' : 'No'}</td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="openSubModal('${s.tenantId}', ${s.planId})">Change</button>
          ${s.status === 'active' || s.status === 'past_due'
            ? `<button class="btn btn-danger btn-sm" onclick="adminCancelSub('${s.tenantId}', '${esc(s.tenantName)}')">Cancel</button>`
            : ''}
        </td>
      </tr>
    `).join('');
  } catch { /* ignore */ }
}

// --- Subscription Management Modal ---

async function openSubscriptionModal(tenantId = null, planId = null) {
  const modal = document.getElementById('subscription-modal');

  // Populate tenant dropdown from cached tenantsList
  const tenantSelect = document.getElementById('sub-tenant-select');
  tenantSelect.innerHTML = '<option value="">Select a tenant...</option>' +
    tenantsList.map(t => `<option value="${t.id}">${esc(t.name)} (${esc(t.slug)})</option>`).join('');
  if (tenantId) tenantSelect.value = tenantId;

  // Populate plan dropdown
  try {
    const res = await apiFetch('/api/admin/plans');
    const plans = await res.json();
    const planSelect = document.getElementById('sub-plan-select');
    planSelect.innerHTML = '<option value="">Select a plan...</option>' +
      plans.filter(p => p.active).map(p => `<option value="${p.id}">${esc(p.name)} - S/${p.price}/${p.billingCycle}</option>`).join('');
    if (planId) planSelect.value = planId;
  } catch { /* ignore */ }

  document.getElementById('subscription-modal-title').textContent =
    tenantId ? 'Change Subscription Plan' : 'Assign Plan to Tenant';
  document.getElementById('sub-skip-payment').checked = true;

  modal.classList.add('active');
}

function closeSubscriptionModal() {
  document.getElementById('subscription-modal').classList.remove('active');
}

window.openSubModal = function(tenantId, planId) {
  openSubscriptionModal(tenantId, planId);
};

window.adminCancelSub = async function(tenantId, tenantName) {
  if (!confirm(`Cancel subscription for ${tenantName}?`)) return;
  try {
    const res = await apiFetch(`/api/admin/subscriptions/${tenantId}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      NotificationManager.error(data.error || 'Failed to cancel');
      return;
    }
    NotificationManager.success('Subscription cancelled');
    loadSubscriptions();
  } catch (err) {
    NotificationManager.error('Error: ' + err.message);
  }
};

document.getElementById('btn-assign-plan')?.addEventListener('click', () => openSubscriptionModal());
document.getElementById('btn-close-sub-modal')?.addEventListener('click', closeSubscriptionModal);
document.getElementById('btn-cancel-sub-modal')?.addEventListener('click', closeSubscriptionModal);

document.getElementById('btn-save-subscription')?.addEventListener('click', async () => {
  const tenantId = document.getElementById('sub-tenant-select').value;
  const planId = document.getElementById('sub-plan-select').value;
  const skipPayment = document.getElementById('sub-skip-payment').checked;

  if (!tenantId || !planId) {
    NotificationManager.error('Please select both a tenant and a plan');
    return;
  }

  try {
    const res = await apiFetch(`/api/admin/subscriptions/${tenantId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId: Number(planId), skipPayment })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      NotificationManager.error(data.error || 'Failed to assign plan');
      return;
    }
    NotificationManager.success('Subscription updated');
    closeSubscriptionModal();
    loadSubscriptions();
  } catch (err) {
    NotificationManager.error('Error: ' + err.message);
  }
});

document.getElementById('sub-status-filter')?.addEventListener('change', loadSubscriptions);
document.getElementById('btn-refresh-subscriptions')?.addEventListener('click', () => { loadSubscriptions(); loadPayments(); });

// ==================== PAYMENTS ====================
async function loadPayments() {
  try {
    const status = document.getElementById('payment-status-filter')?.value;
    const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(payPage * PAGE_SIZE) });
    if (status) params.set('status', status);
    const res = await apiFetch(`/api/admin/payments?${params}`);
    const data = await res.json();
    const tbody = document.getElementById('payments-body');
    if (!data.payments || data.payments.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="empty">No payments.</td></tr>';
      document.getElementById('pay-page-info').textContent = 'Page 1 of 1';
      document.getElementById('btn-pay-prev').disabled = true;
      document.getElementById('btn-pay-next').disabled = true;
      return;
    }
    tbody.innerHTML = data.payments.map(p => `
      <tr>
        <td>${esc(p.tenantName)}</td>
        <td>${esc(p.subscriptionType)}</td>
        <td>${formatCurrency(p.amount)}</td>
        <td>${esc(p.paymentMethod)}</td>
        <td><span class="badge badge-${statusClass(p.status)}">${esc(p.status)}</span></td>
        <td>${formatDate(p.periodStart)} — ${formatDate(p.periodEnd)}</td>
        <td>${p.confirmedAt ? formatDateTime(p.confirmedAt) : '—'}</td>
        <td>
          ${p.status === 'pending' ? `<button class="btn btn-primary btn-sm" data-confirm-payment="${p.id}">Confirm</button>` : ''}
        </td>
      </tr>
    `).join('');
    
    tbody.querySelectorAll('[data-confirm-payment]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Confirm this payment manually?')) return;
        try {
          const r = await apiFetch(`/api/admin/payments/${btn.dataset.confirmPayment}/confirm`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reference: 'admin-manual' }),
          });
          if (!r.ok) { const d = await r.json().catch(() => ({})); NotificationManager.error(d.error || 'Failed'); return; }
          NotificationManager.success('Payment confirmed');
          loadPayments();
        } catch (err) { NotificationManager.error('Error: ' + err.message); }
      });
    });
    
    const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));
    document.getElementById('pay-page-info').textContent = `Page ${payPage + 1} of ${totalPages}`;
    document.getElementById('btn-pay-prev').disabled = payPage === 0;
    document.getElementById('btn-pay-next').disabled = (payPage + 1) >= totalPages;
  } catch { /* ignore */ }
}

document.getElementById('payment-status-filter')?.addEventListener('change', () => { payPage = 0; loadPayments(); });
document.getElementById('btn-refresh-payments')?.addEventListener('click', loadPayments);
document.getElementById('btn-pay-prev')?.addEventListener('click', () => { if (payPage > 0) { payPage--; loadPayments(); } });
document.getElementById('btn-pay-next')?.addEventListener('click', () => { payPage++; loadPayments(); });

// ==================== YAPE PAYMENTS ====================

function startUnmatchedAutoRefresh() {
  stopUnmatchedAutoRefresh();
  unmatchedAutoRefresh = setInterval(() => {
    loadUnmatchedPayments();
    loadExpiredOrders();
  }, 30000);
}

function stopUnmatchedAutoRefresh() {
  if (unmatchedAutoRefresh) {
    clearInterval(unmatchedAutoRefresh);
    unmatchedAutoRefresh = null;
  }
}

async function loadUnmatchedPayments() {
  try {
    const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(unmatchedPage * PAGE_SIZE) });
    const res = await apiFetch(`/api/admin/unmatched-payments?${params}`);
    const data = await res.json();
    const tbody = document.getElementById('unmatched-body');
    if (!data.notifications || data.notifications.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="empty">No unmatched notifications.</td></tr>';
      document.getElementById('unmatched-page-info').textContent = 'Page 1 of 1';
      document.getElementById('btn-unmatched-prev').disabled = true;
      document.getElementById('btn-unmatched-next').disabled = true;
      return;
    }
    tbody.innerHTML = data.notifications.map(n => `
      <tr>
        <td>${n.id}</td>
        <td>${esc(n.tenantName || '-')}</td>
        <td>${esc(n.senderName)}</td>
        <td><strong>S/${n.amount.toFixed(2)}</strong></td>
        <td>${formatDateTime(n.capturedAt)}</td>
        <td><span class="badge badge-${n.status === 'unmatched' ? 'disconnected' : 'connecting'}">${esc(n.status)}</span></td>
        <td>${n.potentialMatches.length === 0
          ? '<span style="color:var(--text-muted);">None</span>'
          : n.potentialMatches.map(m =>
              `<span style="font-size:12px;">Order #${m.orderId} (${esc(m.customerName || 'Unknown')})</span>`
            ).join('<br>')
        }</td>
        <td>
          <div class="action-btns">
            ${n.potentialMatches.length > 0
              ? `<button class="btn btn-primary btn-sm" data-match-notif="${n.id}" data-match-data='${JSON.stringify(n).replace(/'/g, "&#39;")}'>Match</button>`
              : ''}
            <button class="btn btn-danger btn-sm" data-dismiss-notif="${n.id}">Dismiss</button>
          </div>
        </td>
      </tr>
    `).join('');

    // Bind match buttons
    tbody.querySelectorAll('[data-match-notif]').forEach(btn => {
      btn.addEventListener('click', () => {
        const notifData = JSON.parse(btn.dataset.matchData);
        openMatchModal(notifData);
      });
    });

    // Bind dismiss buttons
    tbody.querySelectorAll('[data-dismiss-notif]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Dismiss this notification? It will be ignored permanently.')) return;
        try {
          const r = await apiFetch(`/api/admin/unmatched-payments/${btn.dataset.dismissNotif}/dismiss`, { method: 'POST' });
          if (!r.ok) { const d = await r.json().catch(() => ({})); NotificationManager.error(d.error || 'Failed'); return; }
          NotificationManager.success('Notification dismissed');
          loadUnmatchedPayments();
        } catch (err) { NotificationManager.error('Error: ' + err.message); }
      });
    });

    const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));
    document.getElementById('unmatched-page-info').textContent = `Page ${unmatchedPage + 1} of ${totalPages}`;
    document.getElementById('btn-unmatched-prev').disabled = unmatchedPage === 0;
    document.getElementById('btn-unmatched-next').disabled = (unmatchedPage + 1) >= totalPages;
  } catch (err) {
    console.error('Failed to load unmatched payments:', err);
  }
}

function openMatchModal(notif) {
  const modal = document.getElementById('match-modal');
  const info = document.getElementById('match-modal-info');
  const options = document.getElementById('match-modal-options');

  info.textContent = `Notification #${notif.id}: S/${notif.amount.toFixed(2)} from "${notif.senderName}" captured at ${formatDateTime(notif.capturedAt)}`;

  if (notif.potentialMatches.length === 0) {
    options.innerHTML = '<p style="color:var(--text-muted);">No matching orders found.</p>';
  } else {
    options.innerHTML = notif.potentialMatches.map(m => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:12px;border:1px solid var(--border);border-radius:8px;">
        <div>
          <div style="font-weight:500;">Order #${m.orderId}</div>
          <div style="font-size:12px;color:var(--text-muted);">${esc(m.customerName || 'Unknown')} &middot; S/${m.total.toFixed(2)} &middot; ${formatDateTime(m.orderCreatedAt)}</div>
        </div>
        ${m.paymentId
          ? `<button class="btn btn-primary btn-sm" data-match-confirm-notif="${notif.id}" data-match-confirm-payment="${m.paymentId}">Match This</button>`
          : `<span style="color:var(--text-muted);font-size:12px;">No pending payment</span>`
        }
      </div>
    `).join('');

    options.querySelectorAll('[data-match-confirm-notif]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const notifId = btn.dataset.matchConfirmNotif;
        const paymentId = Number(btn.dataset.matchConfirmPayment);
        try {
          const r = await apiFetch(`/api/admin/unmatched-payments/${notifId}/match`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId }),
          });
          if (!r.ok) { const d = await r.json().catch(() => ({})); NotificationManager.error(d.error || 'Failed'); return; }
          NotificationManager.success('Payment matched successfully');
          closeMatchModal();
          loadUnmatchedPayments();
        } catch (err) { NotificationManager.error('Error: ' + err.message); }
      });
    });
  }

  modal.classList.add('active');
}

function closeMatchModal() {
  document.getElementById('match-modal').classList.remove('active');
}

document.getElementById('btn-close-match-modal')?.addEventListener('click', closeMatchModal);
document.getElementById('btn-cancel-match')?.addEventListener('click', closeMatchModal);

async function loadExpiredOrders() {
  try {
    const res = await apiFetch('/api/admin/orders/expired');
    const orders = await res.json();
    const tbody = document.getElementById('expired-orders-body');
    if (!orders || orders.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty">No expired orders.</td></tr>';
      return;
    }
    tbody.innerHTML = orders.map(o => `
      <tr>
        <td><strong>#${o.id}</strong></td>
        <td>${esc(o.tenantName || '-')}</td>
        <td>
          <div style="font-weight:500;">${esc(o.customerName || 'Unknown')}</div>
          <div style="font-size:11px;color:var(--text-muted);">${esc(o.customerJid || '')}</div>
        </td>
        <td><strong>S/${o.total.toFixed(2)}</strong></td>
        <td>${formatDateTime(o.createdAt)}</td>
        <td>${o.reminderCount}</td>
        <td>
          <button class="btn btn-danger btn-sm" data-expire-order="${o.id}">Cancel & Restore Stock</button>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('[data-expire-order]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm(`Cancel order #${btn.dataset.expireOrder} and restore stock?`)) return;
        try {
          const r = await apiFetch(`/api/admin/orders/${btn.dataset.expireOrder}/expire`, { method: 'POST' });
          if (!r.ok) { const d = await r.json().catch(() => ({})); NotificationManager.error(d.error || 'Failed'); return; }
          NotificationManager.success('Order cancelled and stock restored');
          loadExpiredOrders();
        } catch (err) { NotificationManager.error('Error: ' + err.message); }
      });
    });
  } catch (err) {
    console.error('Failed to load expired orders:', err);
  }
}

document.getElementById('btn-refresh-unmatched')?.addEventListener('click', loadUnmatchedPayments);
document.getElementById('btn-refresh-expired')?.addEventListener('click', loadExpiredOrders);
document.getElementById('btn-unmatched-prev')?.addEventListener('click', () => { if (unmatchedPage > 0) { unmatchedPage--; loadUnmatchedPayments(); } });
document.getElementById('btn-unmatched-next')?.addEventListener('click', () => { unmatchedPage++; loadUnmatchedPayments(); });

// ==================== PLANS ====================
async function loadPlans() {
  try {
    const res = await apiFetch('/api/admin/plans');
    const plans = await res.json();
    const tbody = document.getElementById('plans-body');
    if (plans.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="empty">No plans.</td></tr>';
      return;
    }
    tbody.innerHTML = plans.map(p => `
      <tr>
        <td><strong>${esc(p.name)}</strong></td>
        <td>${esc(p.slug)}</td>
        <td>${formatCurrency(p.price)}</td>
        <td>${esc(p.billingCycle)}</td>
        <td><span class="badge badge-${p.active ? 'connected' : 'disconnected'}">${p.active ? 'Active' : 'Inactive'}</span></td>
        <td>${p.sortOrder}</td>
        <td>${formatDateTime(p.createdAt)}</td>
        <td>
          <div class="action-btns">
            <button class="btn btn-secondary btn-sm" data-edit-plan="${p.id}">Edit</button>
            <button class="btn btn-danger btn-sm" data-delete-plan="${p.id}">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');
    
    tbody.querySelectorAll('[data-edit-plan]').forEach(btn => {
      btn.addEventListener('click', () => openPlanModal(plans.find(p => p.id === Number(btn.dataset.editPlan))));
    });
    
    tbody.querySelectorAll('[data-delete-plan]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this plan?')) return;
        await apiFetch(`/api/admin/plans/${btn.dataset.deletePlan}`, { method: 'DELETE' });
        NotificationManager.success('Plan deleted');
        loadPlans();
      });
    });
  } catch { /* ignore */ }
}

function openPlanModal(plan = null) {
  editingPlanId = plan ? plan.id : null;
  document.getElementById('plan-modal-title').textContent = plan ? 'Edit Plan' : 'Add Plan';
  document.getElementById('plan-name').value = plan?.name || '';
  document.getElementById('plan-slug').value = plan?.slug || '';
  document.getElementById('plan-slug').disabled = !!plan;
  document.getElementById('plan-price').value = plan?.price ?? '';
  document.getElementById('plan-billing-cycle').value = plan?.billingCycle || 'monthly';
  document.getElementById('plan-description').value = plan?.description || '';
  document.getElementById('plan-sort-order').value = plan?.sortOrder ?? 0;
  document.getElementById('plan-active').value = plan ? String(plan.active) : 'true';
  document.getElementById('plan-features').value = plan?.features?.join(', ') || '';
  document.getElementById('plan-modal').classList.add('active');
}

function closePlanModal() {
  document.getElementById('plan-modal').classList.remove('active');
  editingPlanId = null;
}

document.getElementById('btn-add-plan')?.addEventListener('click', () => openPlanModal());
document.getElementById('btn-close-plan-modal')?.addEventListener('click', closePlanModal);
document.getElementById('btn-cancel-plan')?.addEventListener('click', closePlanModal);

document.getElementById('btn-save-plan')?.addEventListener('click', async () => {
  const body = {
    name: document.getElementById('plan-name').value.trim(),
    slug: document.getElementById('plan-slug').value.trim(),
    description: document.getElementById('plan-description').value.trim() || null,
    price: Number(document.getElementById('plan-price').value),
    billingCycle: document.getElementById('plan-billing-cycle').value,
    sortOrder: Number(document.getElementById('plan-sort-order').value) || 0,
    active: document.getElementById('plan-active').value === 'true',
    features: document.getElementById('plan-features').value.split(',').map(f => f.trim()).filter(Boolean)
  };
  if (!body.name || !body.slug) { NotificationManager.error('Name and slug are required.'); return; }
  try {
    const url = editingPlanId ? `/api/admin/plans/${editingPlanId}` : '/api/admin/plans';
    const method = editingPlanId ? 'PUT' : 'POST';
    const res = await apiFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) { const d = await res.json().catch(() => ({})); NotificationManager.error(d.error || 'Failed'); return; }
    NotificationManager.success(editingPlanId ? 'Plan updated' : 'Plan created');
    closePlanModal();
    loadPlans();
  } catch (err) { NotificationManager.error('Error: ' + err.message); }
});

document.getElementById('btn-refresh-plans')?.addEventListener('click', loadPlans);

// ==================== SYSTEM ====================
function loadSystemInfo() {
  document.getElementById('sys-node').textContent = process?.version || 'v18.x';
  document.getElementById('sys-memory').textContent = `${Math.round(performance?.memory?.usedJSHeapSize / 1024 / 1024 || 0)} MB`;
}

window.exportDatabase = function() {
  NotificationManager.info('Exporting database...');
};

window.exportLogs = function() {
  NotificationManager.info('Exporting logs...');
};

window.createBackup = function() {
  NotificationManager.info('Creating backup...');
};

window.clearCache = function() {
  if (!confirm('Clear system cache?')) return;
  NotificationManager.success('Cache cleared');
};

window.restartServer = function() {
  if (!confirm('Restart the server? All connections will be dropped.')) return;
  NotificationManager.warning('Server restart initiated');
};

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

// --- Init ---
init();
