// Contador Portal — Main App (Better Auth sessions)
import { getUser } from './shared/api.js';
import { isLoggedIn, initAuthUI, logout } from './shared/auth.js';
import * as dashboard from './pages/dashboard.js';
import * as clients from './pages/clients.js';
import * as commissions from './pages/commissions.js';
import * as referral from './pages/referral.js';

const pages = { dashboard, clients, commissions, referral };
let currentPage = null;
let currentPageName = null;

// ========== INIT ==========
async function init() {
  initAuthUI();
  setupNav();
  setupMobile();

  if (await isLoggedIn()) {
    showApp();
    navigateFromHash();
  } else {
    showLogin();
  }

  window.addEventListener('contador:login', () => {
    showApp();
    navigate('dashboard');
  });

  window.addEventListener('contador:logout', () => {
    showLogin();
  });

  window.addEventListener('hashchange', navigateFromHash);
}

// ========== AUTH STATE ==========
function showLogin() {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app').style.display = 'none';
}

function showApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  updateUserInfo();
}

function updateUserInfo() {
  const user = getUser();
  if (user) {
    const name = user.name || user.email || '';
    document.getElementById('sidebar-business').textContent = name;
    document.getElementById('user-name').textContent = user.email || '';
    const initials = name.slice(0, 2).toUpperCase() || 'CT';
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

  if (currentPage?.unmount) currentPage.unmount();

  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === pageName);
  });

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const container = document.getElementById(`page-${pageName}`);
  if (container) container.classList.add('active');

  currentPage = pages[pageName];
  currentPageName = pageName;
  if (currentPage?.mount) currentPage.mount(container);

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

// ========== GLOBAL MODAL ==========
window.ContadorModal = {
  open(title, bodyHTML, footerHTML) {
    const backdrop = document.getElementById('modal-backdrop');
    backdrop.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
          <button class="modal-close" onclick="ContadorModal.close()">&times;</button>
        </div>
        <div class="modal-body">${bodyHTML}</div>
        ${footerHTML ? `<div class="modal-footer">${footerHTML}</div>` : ''}
      </div>`;
    backdrop.classList.add('active');
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) ContadorModal.close();
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
