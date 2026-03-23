/**
 * Better Auth HTTP API wrapper for vanilla JS.
 * Uses fetch() with credentials: 'include' for cookie-based sessions.
 */
const AUTH_BASE = '/api/auth';

export async function signIn(email, password) {
  const res = await fetch(`${AUTH_BASE}/sign-in/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Sign-in failed');
  }
  const data = await res.json();
  // Unlock encryption keys with the same password (fire-and-forget)
  fetch('/api/v1/encryption/unlock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ password }),
  }).catch(() => {});
  return data;
}

export async function signUp(email, password, name) {
  const res = await fetch(`${AUTH_BASE}/sign-up/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password, name }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Sign-up failed');
  }
  return res.json();
}

export async function getSession() {
  try {
    const res = await fetch(`${AUTH_BASE}/get-session`, {
      credentials: 'include',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function register(email, password, name, businessName) {
  const res = await fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password, name, businessName }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Registration failed');
  }
  return data;
}

export async function signOut() {
  // Evict DEK from cache before signing out
  await fetch('/api/v1/encryption/lock', {
    method: 'POST',
    credentials: 'include',
  }).catch(() => {});
  await fetch(`${AUTH_BASE}/sign-out`, {
    method: 'POST',
    credentials: 'include',
  });
}
