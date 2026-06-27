/* ============================================================
   SBC API CLIENT — talks to the production Node/MongoDB backend
   ============================================================
   Single source of truth for HTTP calls. All other services and
   the legacy `DB` cache layer build on top of `apiCall`.
*/

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api';

const TOKEN_KEY = 'sbc_token';
const USER_KEY = 'sbc_user';

export const auth = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY)),
  getUser: () => {
    try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch { return null; }
  },
  setUser: (u) => (u ? localStorage.setItem(USER_KEY, JSON.stringify(u)) : localStorage.removeItem(USER_KEY)),
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const apiCall = async (path, { method = 'GET', body, headers = {}, signal } = {}) => {
  const url = `${API_BASE}${path}`;
  const token = auth.getToken();
  const finalHeaders = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };
  let resp;
  try {
    resp = await fetch(url, {
      method,
      headers: finalHeaders,
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (err) {
    throw new ApiError(0, `Network error: ${err.message}`);
  }
  let json = null;
  try { json = await resp.json(); } catch (_) { /* non-JSON */ }
  if (!resp.ok) {
    const msg = json?.message || `HTTP ${resp.status}`;
    throw new ApiError(resp.status, msg, json?.details);
  }
  return json;
};

// =========================================================
// Domain APIs
// =========================================================

export const authAPI = {
  register: (payload) => apiCall('/auth/register', { method: 'POST', body: payload }),
  login: (email, password) => apiCall('/auth/login', { method: 'POST', body: { email, password } }),
  me: () => apiCall('/auth/me'),
  logout: async () => {
    try { await apiCall('/auth/logout', { method: 'POST' }); } catch (_) { /* ignore */ }
    auth.clear();
  },
  updatePassword: (currentPassword, newPassword) =>
    apiCall('/auth/update-password', { method: 'POST', body: { currentPassword, newPassword } }),
};

export const userAPI = {
  list: (params = {}) => apiCall(`/users?${new URLSearchParams(params)}`),
  get: (id) => apiCall(`/users/${id}`),
  create: (data) => apiCall('/users', { method: 'POST', body: data }),
  update: (id, data) => apiCall(`/users/${id}`, { method: 'PUT', body: data }),
  remove: (id) => apiCall(`/users/${id}`, { method: 'DELETE' }),
  toggleBlock: (id) => apiCall(`/users/${id}/toggle-block`, { method: 'POST' }),
};

export const batchAPI = {
  list: (params = {}) => apiCall(`/batches?${new URLSearchParams(params)}`),
  listAllForAdmin: () => apiCall('/batches?all=1&limit=200'),
  get: (id) => apiCall(`/batches/${id}`),
  create: (data) => apiCall('/batches', { method: 'POST', body: data }),
  update: (id, data) => apiCall(`/batches/${id}`, { method: 'PUT', body: data }),
  remove: (id) => apiCall(`/batches/${id}`, { method: 'DELETE' }),
  togglePublish: (id) => apiCall(`/batches/${id}/toggle-publish`, { method: 'POST' }),
  checkAccess: (id) => apiCall(`/batches/${id}/access`),
};

export const planAPI = {
  list: (params = {}) => apiCall(`/plans?${new URLSearchParams(params)}`),
  get: (id) => apiCall(`/plans/${id}`),
  create: (data) => apiCall('/plans', { method: 'POST', body: data }),
  update: (id, data) => apiCall(`/plans/${id}`, { method: 'PUT', body: data }),
  remove: (id) => apiCall(`/plans/${id}`, { method: 'DELETE' }),
};

export const subscriptionAPI = {
  mine: () => apiCall('/subscriptions/me'),
  myAccess: (batchId) => apiCall(`/subscriptions/me/access/${batchId}`),
  adminList: (params = {}) => apiCall(`/subscriptions/admin?${new URLSearchParams(params)}`),
  adminGrant: (data) => apiCall('/subscriptions/admin/grant', { method: 'POST', body: data }),
  adminExtend: (id, days) =>
    apiCall(`/subscriptions/admin/${id}/extend`, { method: 'POST', body: { days } }),
  adminCancel: (id) => apiCall(`/subscriptions/admin/${id}/cancel`, { method: 'POST' }),
};

export const paymentAPI = {
  initiate: (data) => apiCall('/payments/initiate', { method: 'POST', body: data }),
  verify: (orderId) => apiCall('/payments/verify', { method: 'POST', body: { orderId } }),
  mine: () => apiCall('/payments/me'),
  adminList: (params = {}) => apiCall(`/payments/admin?${new URLSearchParams(params)}`),

  // Direct-UPI manual flow — student pays admin's UPI ID directly,
  // submits txn ID, admin approves from dashboard.
  upiConfig: () => apiCall('/payments/upi-config'),
  upiClaim:  (data) => apiCall('/payments/upi-claim', { method: 'POST', body: data }),
  adminUpiPending: () => apiCall('/payments/admin/upi/pending'),
  adminUpiApprove: (id) => apiCall(`/payments/admin/upi/${id}/approve`, { method: 'POST' }),
  adminUpiReject:  (id, reason) => apiCall(`/payments/admin/upi/${id}/reject`,  { method: 'POST', body: { reason } }),

  // PhonePe Standard Checkout. initiate returns { redirectUrl } —
  // frontend just does window.location = redirectUrl.
  phonepeConfig:   () => apiCall('/phonepe/config'),
  phonepeInitiate: (data) => apiCall('/phonepe/initiate', { method: 'POST', body: data }),
  phonepeVerify:   (orderId) => apiCall('/phonepe/verify', { method: 'POST', body: { merchantTransactionId: orderId } }),
};

export const noticeAPI = {
  list: (params = {}) => apiCall(`/notices?${new URLSearchParams(params)}`),
  create: (data) => apiCall('/notices', { method: 'POST', body: data }),
  update: (id, data) => apiCall(`/notices/${id}`, { method: 'PUT', body: data }),
  remove: (id) => apiCall(`/notices/${id}`, { method: 'DELETE' }),
};

export const contentAPI = {
  byBatch: (batchId) => apiCall(`/content/batch/${batchId}`),
  create: (data) => apiCall('/content', { method: 'POST', body: data }),
  update: (id, data) => apiCall(`/content/${id}`, { method: 'PUT', body: data }),
  remove: (id) => apiCall(`/content/${id}`, { method: 'DELETE' }),
};

export const adminAPI = {
  dashboard: () => apiCall('/admin/dashboard'),
};

export const profileAPI = {
  me: () => apiCall('/profiles/me'),
  getByEmail: (email) => apiCall(`/profiles?${new URLSearchParams({ email })}`),
};

export default {
  auth,
  apiCall,
  authAPI,
  userAPI,
  batchAPI,
  planAPI,
  subscriptionAPI,
  paymentAPI,
  noticeAPI,
  contentAPI,
  adminAPI,
  profileAPI,
};
