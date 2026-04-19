import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  headers: { 'Content-Type': 'application/json' },
});

// Inject token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mb_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isAuthEndpoint = err.config?.url?.includes('/auth/login') || 
                           err.config?.url?.includes('/auth/register');
    
    if (err.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('mb_token');
      localStorage.removeItem('mb_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── Auth ─────────────────────────────────────────────
export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

// ─── Books ────────────────────────────────────────────
export const booksApi = {
  getAll: () => api.get('/books'),
  getById: (id) => api.get(`/books/${id}`),
  create: (data) => api.post('/books', data),
  update: (id, data) => api.put(`/books/${id}`, data),
  delete: (id) => api.delete(`/books/${id}`),
};

// ─── Entitlements ─────────────────────────────────────
export const entitlementApi = {
  subscribe: () => api.post('/entitlements/subscribe'),
  purchase: (book_id) => api.post('/entitlements/purchase', { book_id }),
  myBooks: () => api.get('/entitlements/my'),
};

export default api;
