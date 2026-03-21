// HTML escape helper (inline to avoid circular import with utils.js)
function esc(str) {
  if (!str) return '';
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

// Theme Management
export const ThemeManager = {
  currentTheme: 'dark',
  
  init() {
    // Check for saved preference or system preference
    const savedTheme = localStorage.getItem('autobot-theme');
    if (savedTheme) {
      this.setTheme(savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      this.setTheme('light');
    }
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
      if (!localStorage.getItem('autobot-theme')) {
        this.setTheme(e.matches ? 'light' : 'dark');
      }
    });
  },
  
  setTheme(theme) {
    this.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('autobot-theme', theme);
    this.updateIcons();
  },
  
  toggle() {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
    return newTheme;
  },
  
  updateIcons() {
    const sunIcons = document.querySelectorAll('.theme-icon-sun');
    const moonIcons = document.querySelectorAll('.theme-icon-moon');
    
    sunIcons.forEach(icon => {
      icon.style.display = this.currentTheme === 'dark' ? 'block' : 'none';
    });
    
    moonIcons.forEach(icon => {
      icon.style.display = this.currentTheme === 'light' ? 'block' : 'none';
    });
  },
  
  getThemeIcon() {
    return this.currentTheme === 'dark' 
      ? `<svg class="theme-icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`
      : `<svg class="theme-icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
  }
};

// Notification System
export const NotificationManager = {
  show(message, type = 'info', duration = 5000) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <span>${esc(message)}</span>
      <button class="notification-close">&times;</button>
    `;
    
    let container = document.getElementById('notification-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'notification-container';
      document.body.appendChild(container);
    }
    container.appendChild(notification);
    
    // Auto-remove
    const timeout = setTimeout(() => {
      this.remove(notification);
    }, duration);
    
    // Close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
      clearTimeout(timeout);
      this.remove(notification);
    });
    
    return notification;
  },
  
  remove(notification) {
    notification.style.animation = 'slideInRight 0.3s ease reverse forwards';
    setTimeout(() => notification.remove(), 300);
  },
  
  success(message, duration) {
    return this.show(message, 'success', duration);
  },
  
  error(message, duration) {
    return this.show(message, 'error', duration);
  },
  
  warning(message, duration) {
    return this.show(message, 'warning', duration);
  },
  
  info(message, duration) {
    return this.show(message, 'info', duration);
  }
};

// Profile Dropdown Manager
export const ProfileManager = {
  init(user) {
    this.user = user;
    this.render();
    this.attachEvents();
  },
  
  render() {
    const container = document.querySelector('.profile-dropdown');
    if (!container) return;
    
    const initials = this.getInitials(this.user.name || this.user.email);
    
    container.innerHTML = `
      <button class="profile-btn" id="profile-btn" aria-haspopup="true" aria-expanded="false" title="Account menu">
        <div class="profile-avatar">${esc(initials)}</div>
        <span class="profile-name">${esc(this.user.name || this.user.email.split('@')[0])}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>
      <div class="profile-menu" id="profile-menu" role="menu">
        <div class="profile-menu-header">
          <div class="profile-name">${esc(this.user.name || 'User')}</div>
          <div class="profile-menu-email">${esc(this.user.email)}</div>
        </div>
        <div class="profile-menu-item" id="profile-settings" role="menuitem" tabindex="0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v6m0 6v6m4.22-10.22l4.24-4.24M6.34 17.66l-4.24 4.24M23 12h-6m-6 0H1m20.07 4.93l-4.24-4.24M6.34 6.34L2.1 2.1"/>
          </svg>
          <span>Profile Settings</span>
        </div>
        <div class="profile-menu-divider"></div>
        <div class="profile-menu-item profile-menu-item-logout" id="profile-logout" role="menuitem" tabindex="0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
          <span>Logout</span>
        </div>
      </div>
    `;
  },
  
  attachEvents() {
    const btn = document.getElementById('profile-btn');
    const menu = document.getElementById('profile-menu');
    
    if (!btn || !menu) return;
    
    const toggleOpen = (open) => {
      const isOpen = open ?? !btn.parentElement.classList.contains('open');
      btn.parentElement.classList.toggle('open', isOpen);
      btn.setAttribute('aria-expanded', String(isOpen));
    };

    // Toggle dropdown
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleOpen();
    });

    // Keyboard support
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleOpen();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') toggleOpen(false);
    });

    // Close on outside click
    document.addEventListener('click', () => {
      toggleOpen(false);
    });
    
    // Menu items
    const settingsBtn = document.getElementById('profile-settings');
    const logoutBtn = document.getElementById('profile-logout');
    
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        this.openProfileModal();
      });
    }
    
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        const { signOut } = await import('./auth.js');
        await signOut();
        window.location.reload();
      });
    }
  },
  
  getInitials(name) {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  },
  
  openProfileModal() {
    // Create modal if not exists
    let modal = document.getElementById('profile-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'profile-modal';
      modal.className = 'modal';
      document.body.appendChild(modal);
    }
    
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Profile Settings</h3>
          <button class="btn-icon" id="close-profile-modal">&times;</button>
        </div>
        <div class="profile-form">
          <div class="form-group">
            <label>Name</label>
            <input type="text" id="profile-name-input" value="${esc(this.user.name || '')}" placeholder="Your name">
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" value="${esc(this.user.email)}" disabled style="opacity: 0.6;">
          </div>
          <div class="form-group">
            <label>Role</label>
            <input type="text" value="${esc(this.user.role || 'User')}" disabled style="opacity: 0.6;">
          </div>
          <div class="form-group">
            <label>Change Password</label>
            <input type="password" id="profile-current-password" placeholder="Current password">
            <input type="password" id="profile-new-password" placeholder="New password" style="margin-top: 8px;">
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" id="cancel-profile">Cancel</button>
          <button class="btn btn-primary" id="save-profile">Save Changes</button>
        </div>
      </div>
    `;
    
    modal.classList.add('active');
    
    // Close handlers
    document.getElementById('close-profile-modal').addEventListener('click', () => {
      modal.classList.remove('active');
    });
    
    document.getElementById('cancel-profile').addEventListener('click', () => {
      modal.classList.remove('active');
    });
    
    // Save handler
    document.getElementById('save-profile').addEventListener('click', async () => {
      await this.saveProfile();
      modal.classList.remove('active');
    });
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  },
  
  async saveProfile() {
    const name = document.getElementById('profile-name-input').value;
    const currentPassword = document.getElementById('profile-current-password').value;
    const newPassword = document.getElementById('profile-new-password').value;
    
    try {
      const { apiFetch } = await import('./utils.js');
      
      // Update name
      if (name && name !== this.user.name) {
        await apiFetch('/api/account/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name })
        });
        this.user.name = name;
        this.render();
      }
      
      // Update password
      if (currentPassword && newPassword) {
        await apiFetch('/api/account/password', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentPassword, newPassword })
        });
      }
      
      NotificationManager.success('Profile updated successfully');
    } catch (err) {
      NotificationManager.error('Failed to update profile: ' + err.message);
    }
  }
};

// Confirmation Dialog
export const ConfirmDialog = {
  show({ title = 'Confirm', message = 'Are you sure?', confirmText = 'Confirm', cancelText = 'Cancel', danger = false } = {}) {
    return new Promise((resolve) => {
      // Remove existing dialog
      const existing = document.getElementById('confirm-dialog-overlay');
      if (existing) existing.remove();

      const overlay = document.createElement('div');
      overlay.id = 'confirm-dialog-overlay';
      overlay.className = 'confirm-overlay';
      overlay.innerHTML = `
        <div class="confirm-dialog">
          <h3 class="confirm-title">${esc(title)}</h3>
          <p class="confirm-message">${esc(message)}</p>
          <div class="confirm-actions">
            <button class="btn btn-secondary" id="confirm-cancel">${cancelText}</button>
            <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="confirm-ok">${confirmText}</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      // Force reflow then animate in
      requestAnimationFrame(() => overlay.classList.add('active'));

      const cleanup = (result) => {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 200);
        resolve(result);
      };

      overlay.querySelector('#confirm-ok').addEventListener('click', () => cleanup(true));
      overlay.querySelector('#confirm-cancel').addEventListener('click', () => cleanup(false));
      overlay.addEventListener('click', (e) => { if (e.target === overlay) cleanup(false); });
      document.addEventListener('keydown', function onKey(e) {
        if (e.key === 'Escape') { document.removeEventListener('keydown', onKey); cleanup(false); }
      });

      // Focus the confirm button
      overlay.querySelector('#confirm-ok').focus();
    });
  }
};

// Keyboard Shortcuts Manager
export const KeyboardShortcuts = {
  shortcuts: {},
  pendingPrefix: null,
  prefixTimeout: null,
  enabled: true,

  init(shortcuts) {
    this.shortcuts = shortcuts;
    document.addEventListener('keydown', (e) => this.handleKey(e));
  },

  handleKey(e) {
    if (!this.enabled) return;
    // Ignore when typing in inputs
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    // Ignore if modals are open
    if (document.querySelector('.modal.active, .confirm-overlay.active')) return;

    const key = e.key.toLowerCase();

    // Handle ? for help
    if (key === '?' || (e.shiftKey && key === '/')) {
      e.preventDefault();
      this.showHelp();
      return;
    }

    // Handle prefix sequences (g+key)
    if (this.pendingPrefix) {
      clearTimeout(this.prefixTimeout);
      const combo = this.pendingPrefix + '+' + key;
      this.pendingPrefix = null;
      if (this.shortcuts[combo]) {
        e.preventDefault();
        this.shortcuts[combo].action();
      }
      return;
    }

    if (key === 'g') {
      this.pendingPrefix = 'g';
      this.prefixTimeout = setTimeout(() => { this.pendingPrefix = null; }, 800);
      return;
    }

    // Single-key shortcuts
    if (this.shortcuts[key]) {
      e.preventDefault();
      this.shortcuts[key].action();
    }
  },

  showHelp() {
    let existing = document.getElementById('shortcuts-modal');
    if (existing) { existing.remove(); return; }

    const modal = document.createElement('div');
    modal.id = 'shortcuts-modal';
    modal.className = 'modal active';

    const entries = Object.entries(this.shortcuts);
    const rows = entries.map(([key, { label }]) => {
      const display = key.includes('+') ? key.split('+').map(k => `<kbd>${k}</kbd>`).join(' then ') : `<kbd>${key}</kbd>`;
      return `<div class="shortcut-row"><span class="shortcut-keys">${display}</span><span>${label}</span></div>`;
    });

    modal.innerHTML = `
      <div class="modal-content" style="max-width:400px;">
        <div class="modal-header">
          <h3>Keyboard Shortcuts</h3>
          <button class="btn-icon" id="close-shortcuts">&times;</button>
        </div>
        <div style="padding:16px;display:flex;flex-direction:column;gap:8px;">
          ${rows.join('')}
          <div class="shortcut-row"><span class="shortcut-keys"><kbd>?</kbd></span><span>Show this help</span></div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const close = () => modal.remove();
    document.getElementById('close-shortcuts').addEventListener('click', close);
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
  }
};

// Animation utilities
export const AnimationUtils = {
  animateIn(element, animation = 'fadeInUp', delay = 0) {
    element.style.opacity = '0';
    element.style.animation = `${animation} 0.4s ease ${delay}ms forwards`;
  },
  
  stagger(elements, animation = 'fadeInUp', baseDelay = 50) {
    elements.forEach((el, i) => {
      this.animateIn(el, animation, i * baseDelay);
    });
  },
  
  fadeOut(element, callback) {
    element.style.animation = 'fadeIn 0.3s ease reverse forwards';
    setTimeout(() => {
      if (callback) callback();
    }, 300);
  }
};

// Export for use in modules
export function initTheme() {
  ThemeManager.init();
}

export function initProfile(user) {
  ProfileManager.init(user);
}

export function showNotification(message, type, duration) {
  return NotificationManager.show(message, type, duration);
}
