export async function getSession() {
  try {
    const res = await fetch('/api/auth/get-session', {
      credentials: 'include',
    })
    if (!res.ok) return null
    const data = await res.json()
    return data?.session ? data : null
  } catch {
    return null
  }
}

export async function signIn(email: string, password: string) {
  const res = await fetch('/api/auth/sign-in/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data?.message || 'Invalid credentials')
  }
  return res.json()
}

export async function signOut() {
  await fetch('/api/auth/sign-out', {
    method: 'POST',
    credentials: 'include',
  })
}
