const API_BASE = 'http://localhost:3001/api';

/**
 * Register a new customer account (stored in MySQL with hashed password).
 */
export async function apiRegister(name, email, password) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  return res.json();
}

/**
 * Login (works for both admin and customer).
 */
export async function apiLogin(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

/**
 * Fetch the full queue and current serving index.
 */
export async function fetchQueue() {
  const res = await fetch(`${API_BASE}/queue`);
  if (!res.ok) throw new Error('Failed to fetch queue');
  return res.json();
}

/**
 * Customer joins the queue.
 */
export async function apiJoinQueue(name, email) {
  const res = await fetch(`${API_BASE}/queue/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email }),
  });
  if (!res.ok) throw new Error('Failed to join queue');
  return res.json();
}

/**
 * Admin: serve next customer.
 */
export async function apiNextCustomer(email, password) {
  const res = await fetch(`${API_BASE}/queue/next`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${btoa(`${email}:${password}`)}`,
    },
  });
  if (!res.ok) throw new Error('Failed to advance queue');
  return res.json();
}

/**
 * Admin: skip current customer.
 */
export async function apiSkipCustomer(email, password) {
  const res = await fetch(`${API_BASE}/queue/skip`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${btoa(`${email}:${password}`)}`,
    },
  });
  if (!res.ok) throw new Error('Failed to skip customer');
  return res.json();
}
