const API_BASE = import.meta.env.VITE_API_URL || '';

function getToken() {
  return localStorage.getItem('token');
}

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  register: (body) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request('/api/auth/me'),
  getCategories: () => request('/api/complaints/categories'),
  getComplaints: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/complaints${qs ? `?${qs}` : ''}`);
  },
  getComplaint: (id) => request(`/api/complaints/${id}`),
  createComplaint: (formData) => request('/api/complaints', { method: 'POST', body: formData }),
  updateStatus: (id, body) => request(`/api/complaints/${id}/status`, { method: 'PATCH', body: JSON.stringify(body) }),
  updatePriority: (id, body) => request(`/api/complaints/${id}/priority`, { method: 'PATCH', body: JSON.stringify(body) }),
  flagOverdue: (id) => request(`/api/complaints/${id}/flag-overdue`, { method: 'PATCH', body: '{}' }),
  getNotices: () => request('/api/notices'),
  createNotice: (body) => request('/api/notices', { method: 'POST', body: JSON.stringify(body) }),
  getDashboard: () => request('/api/dashboard'),
  getOverdueDays: () => request('/api/dashboard/settings/overdue-days'),
  setOverdueDays: (overdueDays) => request('/api/dashboard/settings/overdue-days', {
    method: 'PUT',
    body: JSON.stringify({ overdueDays }),
  }),
};
