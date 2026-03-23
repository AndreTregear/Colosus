// Yaya Dashboard — Auth Module (Better Auth / cookie sessions)
import { setSession, toast } from './api.js';

const AUTH_BASE = '/api/auth';

export async function login(email, password) {
  const res = await fetch(`${AUTH_BASE}/sign-in/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Error al iniciar sesión');
  }
  const data = await res.json();
  // Unlock encryption keys with the same password (fire-and-forget)
  fetch('/api/v1/encryption/unlock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ password }),
  }).catch(() => {});
  // Fetch session to populate user info
  const session = await fetchSession();
  return session || data;
}

export async function register(email, password, businessName) {
  const res = await fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password, name: businessName, businessName }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || data.message || 'Error al registrarse');
  }
  const session = await fetchSession();
  return session || data;
}

export async function fetchSession() {
  try {
    const res = await fetch(`${AUTH_BASE}/get-session`, { credentials: 'include' });
    if (!res.ok) return null;
    const session = await res.json();
    setSession(session);
    return session;
  } catch {
    return null;
  }
}

export async function logout() {
  try {
    // Evict DEK from cache before signing out
    await fetch('/api/v1/encryption/lock', { method: 'POST', credentials: 'include' }).catch(() => {});
    await fetch(`${AUTH_BASE}/sign-out`, { method: 'POST', credentials: 'include' });
  } catch { /* ok */ }
  setSession(null);
  window.location.hash = '';
  window.location.reload();
}

export async function isLoggedIn() {
  const session = await fetchSession();
  return !!session;
}

export function initAuthUI() {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const loginError = document.getElementById('login-error');
  const registerError = document.getElementById('register-error');
  const showRegister = document.getElementById('show-register');
  const showLogin = document.getElementById('show-login');

  showRegister?.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
  });

  showLogin?.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
  });

  // Login submit
  document.getElementById('form-login')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.style.display = 'none';
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    if (!email || !password) {
      loginError.textContent = 'Ingresa tu email y contraseña';
      loginError.style.display = 'block';
      return;
    }
    try {
      await login(email, password);
      window.dispatchEvent(new CustomEvent('yaya:login'));
    } catch (err) {
      loginError.textContent = err.message || 'Error al iniciar sesión';
      loginError.style.display = 'block';
    }
  });

  // Register submit
  document.getElementById('form-register')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    registerError.style.display = 'none';
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const businessName = document.getElementById('register-business').value.trim();
    if (!email || !password) {
      registerError.textContent = 'Completa los campos requeridos';
      registerError.style.display = 'block';
      return;
    }
    try {
      await register(email, password, businessName);
      window.dispatchEvent(new CustomEvent('yaya:login'));
    } catch (err) {
      registerError.textContent = err.message || 'Error al registrarse';
      registerError.style.display = 'block';
    }
  });
}
