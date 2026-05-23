import api from './axiosInstance';

export const notificationsApi = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
};

export const createSSEStream = (token) => {
  const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  return new EventSource(`${BASE}/notifications/stream`, {
    // EventSource uses cookies automatically for withCredentials
  });
};
