// Agente Platform — Auth Module
import { apiPost, apiGet, setToken, clearToken, setUser, getToken, toast } from './api.js';

export async function login(email, password) {
  const data = await apiPost('/auth/login', { email, password });
  if (data.token) {
    setToken(data.token);
    // Fetch user profile
    try {
      const me = await apiGet('/auth/me');
      setUser(me);
    } catch { /* profile fetch optional */ }
  }
  return data;
}

export async function register(email, password, businessName, phone) {
  const data = await apiPost('/auth/register', {
    email,
    password,
    business_name: businessName,
    phone
  });
  if (data.token) {
    setToken(data.token);
    try {
      const me = await apiGet('/auth/me');
      setUser(me);
    } catch { /* ok */ }
  }
  return data;
}

export function logout() {
  clearToken();
  window.location.hash = '';
  window.location.reload();
}

export function isLoggedIn() {
  return !!getToken();
}

export function initAuthUI() {
  const loginScreen = document.getElementById('login-screen');
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
      loginScreen.style.display = 'none';
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
    const phone = document.getElementById('register-phone').value.trim();
    if (!email || !password) {
      registerError.textContent = 'Completa los campos requeridos';
      registerError.style.display = 'block';
      return;
    }
    try {
      await register(email, password, businessName, phone);
      loginScreen.style.display = 'none';
      window.dispatchEvent(new CustomEvent('yaya:login'));
    } catch (err) {
      registerError.textContent = err.message || 'Error al registrarse';
      registerError.style.display = 'block';
    }
  });
}
