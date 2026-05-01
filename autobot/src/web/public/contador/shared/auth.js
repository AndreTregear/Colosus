// Contador Portal — Auth Module (Better Auth / cookie sessions)
import { setSession, toast } from './api.js';

const AUTH_BASE = '/api/auth';
const CONTADOR_API = '/api/contador';

export async function login(email, password) {
  const res = await fetch(`${AUTH_BASE}/sign-in/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Error al iniciar sesion');
  }
  // Verify this user has contador role
  const session = await fetchSession();
  if (session?.user?.role !== 'contador') {
    await fetch(`${AUTH_BASE}/sign-out`, { method: 'POST', credentials: 'include' });
    setSession(null);
    throw new Error('Esta cuenta no es de contador. Usa el dashboard principal.');
  }
  return session;
}

export async function register(name, email, password, companyName, taxId, phone) {
  const res = await fetch(`${CONTADOR_API}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password, name, companyName, taxId, phone }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || data.message || 'Error al registrarse');
  }
  // Auto-login after registration
  await login(email, password);
  return data;
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
    await fetch(`${AUTH_BASE}/sign-out`, { method: 'POST', credentials: 'include' });
  } catch { /* ok */ }
  setSession(null);
  window.location.hash = '';
  window.location.reload();
}

export async function isLoggedIn() {
  const session = await fetchSession();
  return session?.user?.role === 'contador';
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
      loginError.textContent = 'Ingresa tu email y contrasena';
      loginError.style.display = 'block';
      return;
    }
    try {
      await login(email, password);
      window.dispatchEvent(new CustomEvent('contador:login'));
    } catch (err) {
      loginError.textContent = err.message || 'Error al iniciar sesion';
      loginError.style.display = 'block';
    }
  });

  // Register submit
  document.getElementById('form-register')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    registerError.style.display = 'none';
    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const companyName = document.getElementById('register-company').value.trim();
    const taxId = document.getElementById('register-ruc').value.trim();
    const phone = document.getElementById('register-phone').value.trim();
    if (!name || !email || !password) {
      registerError.textContent = 'Completa los campos requeridos';
      registerError.style.display = 'block';
      return;
    }
    if (password.length < 6) {
      registerError.textContent = 'La contrasena debe tener al menos 6 caracteres';
      registerError.style.display = 'block';
      return;
    }
    try {
      await register(name, email, password, companyName, taxId, phone);
      window.dispatchEvent(new CustomEvent('contador:login'));
    } catch (err) {
      registerError.textContent = err.message || 'Error al registrarse';
      registerError.style.display = 'block';
    }
  });
}
