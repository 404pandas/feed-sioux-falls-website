const API_URL = import.meta.env.VITE_API_URL;
const TOKEN_KEY = 'fsf_auth_token';

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// Central request function. Every API call in the app goes through this,
// so auth headers and error handling are handled in exactly one place.
async function request(path, { method = 'GET', body, requiresAuth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };

  if (requiresAuth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong. Please try again.');
  }

  return data;
}

export const api = {
  // Auth
  getNames: () => request('/api/auth/names', { requiresAuth: false }),
  login: (userId, pin) => request('/api/auth/login', { method: 'POST', body: { userId, pin }, requiresAuth: false }),
  me: () => request('/api/auth/me'),

  // Items / inventory
  getItems: (lowStockOnly = false) => request(`/api/items${lowStockOnly ? '?lowStock=true' : ''}`),
  createItem: (item) => request('/api/items', { method: 'POST', body: item }),
  updateItem: (id, updates) => request(`/api/items/${id}`, { method: 'PATCH', body: updates }),
  deleteItem: (id) => request(`/api/items/${id}`, { method: 'DELETE' }),
  adjustStock: (id, payload) => request(`/api/items/${id}/adjust-stock`, { method: 'POST', body: payload }),
  getForecast: () => request('/api/items/insights/forecast'),

  // Distribution events + tallies
  createEvent: (payload) => request('/api/events', { method: 'POST', body: payload }),
  getEvents: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/events${qs ? `?${qs}` : ''}`);
  },
  getEvent: (id) => request(`/api/events/${id}`),
  updateEvent: (id, updates) => request(`/api/events/${id}`, { method: 'PATCH', body: updates }),
  tally: (eventId, payload) => request(`/api/events/${eventId}/tally`, { method: 'POST', body: payload }),

  // Budget
  getCurrentBudget: () => request('/api/budget/current'),
  updateBudget: (totalBudget) => request('/api/budget/current', { method: 'PATCH', body: { totalBudget } }),
  logPurchase: (payload) => request('/api/budget/purchases', { method: 'POST', body: payload }),

  // Reports
  getWeeklyReport: (date) => request(`/api/reports/weekly${date ? `?date=${date}` : ''}`),
  getMonthlyReport: (month) => request(`/api/reports/monthly${month ? `?month=${month}` : ''}`),
  getCustomReport: (params) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/reports/custom?${qs}`);
  },

  // Guest - donations
  createPaymentIntent: (amount, donorName, donorEmail) =>
    request('/api/donate/create-payment-intent', {
      method: 'POST',
      body: { amount, donorName, donorEmail },
      requiresAuth: false,
    }),

  // Guest - contact
  submitContact: (payload) =>
    request('/api/contact', { method: 'POST', body: payload, requiresAuth: false }),
};
