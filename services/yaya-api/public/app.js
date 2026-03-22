// Yaya Platform — Main App
import { getToken, getUser } from './shared/api.js';
import { isLoggedIn, initAuthUI, logout } from './shared/auth.js';
import * as dashboard from './pages/dashboard.js';
import * as chat from './pages/chat.js';
import * as analytics from './pages/analytics.js';
import * as orders from './pages/orders.js';
import * as customers from './pages/customers.js';
import * as products from './pages/products.js';
import * as payments from './pages/payments.js';
import * as expenses from './pages/expenses.js';
import * as settings from './pages/settings.js';

const pages = { dashboard, chat, analytics, orders, customers, products, payments, expenses, settings };
let currentPage = null;
let currentPageName = null;
let sseSource = null;

// ========== INIT ==========
function init() {
  initAuthUI();
  setupNav();
  setupMobile();

  if (isLoggedIn()) {
    showApp();
    navigateFromHash();
  } else {
    showLogin();
  }

  // Listen for auth events
  window.addEventListener('yaya:login', () => {
    showApp();
    navigate('dashboard');
  });

  window.addEventListener('yaya:logout', () => {
    showLogin();
  });

  // Hash change
  window.addEventListener('hashchange', navigateFromHash);
}

// ========== AUTH STATE ==========
function showLogin() {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app').style.display = 'none';
  disconnectSSE();
}

function showApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  updateUserInfo();
  connectSSE();
}

// ========== SSE (real-time events) ==========
function connectSSE() {
  disconnectSSE();
  const token = getToken();
  if (!token) return;

  sseSource = new EventSource(`/api/v1/events?token=${token}`);

  sseSource.onmessage = (e) => {
    try {
      const payload = JSON.parse(e.data);
      handleSSEvent(payload);
    } catch { /* skip */ }
  };

  sseSource.onerror = () => {
    // Reconnect after 5s
    disconnectSSE();
    setTimeout(() => {
      if (isLoggedIn()) connectSSE();
    }, 5000);
  };
}

function disconnectSSE() {
  if (sseSource) {
    sseSource.close();
    sseSource = null;
  }
}

function handleSSEvent(payload) {
  const { event, data } = payload;
  switch (event) {
    case 'wa:status':
      if (chat.onWaStatusChange) chat.onWaStatusChange(data);
      break;
    case 'wa:message':
      if (chat.onWaMessage) chat.onWaMessage(data);
      break;
    case 'wa:qr':
      // QR updates handled by polling in chat.js
      break;
  }
}

function updateUserInfo() {
  const user = getUser();
  if (user) {
    const name = user.business_name || user.email || '';
    document.getElementById('sidebar-business').textContent = name;
    document.getElementById('user-name').textContent = user.email || '';
    const initials = name.slice(0, 2).toUpperCase() || 'YA';
    document.getElementById('user-avatar').textContent = initials;
  }
}

// ========== NAVIGATION ==========
function setupNav() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const page = item.dataset.page;
      window.location.hash = '#' + page;
    });
  });

  document.getElementById('btn-logout').addEventListener('click', logout);
}

function navigateFromHash() {
  const hash = window.location.hash.slice(1) || 'dashboard';
  navigate(hash);
}

function navigate(pageName) {
  if (!pages[pageName]) pageName = 'dashboard';

  // Unmount current
  if (currentPage?.unmount) currentPage.unmount();

  // Update nav active state
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === pageName);
  });

  // Show correct page container
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const container = document.getElementById(`page-${pageName}`);
  if (container) container.classList.add('active');

  // Mount new page
  currentPage = pages[pageName];
  currentPageName = pageName;
  if (currentPage?.mount) currentPage.mount(container);

  // Close mobile sidebar
  closeSidebar();
}

// ========== MOBILE ==========
function setupMobile() {
  document.getElementById('btn-hamburger').addEventListener('click', openSidebar);
  document.getElementById('sidebar-overlay').addEventListener('click', closeSidebar);
}

function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebar-overlay').classList.add('open');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('open');
}

// ========== GLOBAL MODAL HELPERS ==========
window.YayaModal = {
  open(title, bodyHTML, footerHTML) {
    const backdrop = document.getElementById('modal-backdrop');
    backdrop.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
          <button class="modal-close" onclick="YayaModal.close()">&times;</button>
        </div>
        <div class="modal-body">${bodyHTML}</div>
        ${footerHTML ? `<div class="modal-footer">${footerHTML}</div>` : ''}
      </div>`;
    backdrop.classList.add('active');
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) YayaModal.close();
    });
  },
  close() {
    const backdrop = document.getElementById('modal-backdrop');
    backdrop.classList.remove('active');
    backdrop.innerHTML = '';
  }
};

// ========== START ==========
document.addEventListener('DOMContentLoaded', init);
