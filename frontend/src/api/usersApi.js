import api from './axiosInstance';

export const usersApi = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getMyTasks: (params) => api.get('/dashboard/my-tasks', { params }),
  getActivity: (params) => api.get('/dashboard/activity', { params }),
};
