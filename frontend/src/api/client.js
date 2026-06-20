// Central API client. Base URL is configurable via VITE_API_BASE_URL at build
// time; when empty (default) it uses relative '/api' paths, which work both
// behind the dev proxy and behind nginx in production.
const BASE = import.meta.env.VITE_API_BASE_URL || ''

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (res.status === 204) return null

  let body = null
  const text = await res.text()
  if (text) {
    try {
      body = JSON.parse(text)
    } catch {
      body = text
    }
  }

  if (!res.ok) {
    const detail =
      body && typeof body === 'object' && body.detail
        ? body.detail
        : `Request failed (${res.status})`
    throw new Error(Array.isArray(detail) ? JSON.stringify(detail) : detail)
  }
  return body
}

export const api = {
  // Products
  listProducts: () => request('/api/products'),
  createProduct: (data) =>
    request('/api/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) =>
    request(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id) => request(`/api/products/${id}`, { method: 'DELETE' }),

  // Customers
  listCustomers: () => request('/api/customers'),
  createCustomer: (data) =>
    request('/api/customers', { method: 'POST', body: JSON.stringify(data) }),
  updateCustomer: (id, data) =>
    request(`/api/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCustomer: (id) => request(`/api/customers/${id}`, { method: 'DELETE' }),

  // Orders
  listOrders: () => request('/api/orders'),
  createOrder: (data) =>
    request('/api/orders', { method: 'POST', body: JSON.stringify(data) }),

  // Analytics (LLM-generated dashboards)
  analyticsQuery: (prompt) =>
    request('/api/analytics/query', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    }),
}
