// Tiny wrapper around fetch(): adds the JWT token and turns errors into exceptions
export const getToken = () => localStorage.getItem('token');

export async function api(path, { method = 'GET', body, raw } = {}) {
  const res = await fetch('/api' + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(getToken() ? { Authorization: 'Bearer ' + getToken() } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (raw) return res;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Something went wrong');
    err.status = res.status;
    throw err;
  }
  return data;
}

export const today = () => new Date().toISOString().slice(0, 10);
export const qs = (obj) => {
  const p = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => v && p.set(k, v));
  const s = p.toString();
  return s ? '?' + s : '';
};
