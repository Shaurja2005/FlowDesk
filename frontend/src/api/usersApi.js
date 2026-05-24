import api from './axiosInstance';

export const usersApi = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  getPublicProfile: (id) => api.get(`/users/${id}/public`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  suspend: (id) => api.put(`/users/${id}/suspend`),
  unsuspend: (id) => api.put(`/users/${id}/unsuspend`),
  delete: (id) => api.delete(`/users/${id}`),
};

export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getMyTasks: (params) => api.get('/dashboard/my-tasks', { params }),
  getActivity: (params) => api.get('/dashboard/activity', { params }),
};
