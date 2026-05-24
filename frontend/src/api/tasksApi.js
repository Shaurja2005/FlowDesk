import api from './axiosInstance';

export const tasksApi = {
  getAll: (params) => api.get('/tasks', { params }),
  getById: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  search: (q, projectId) => api.get('/tasks/search', { params: { q, projectId } }),
  addComment: (id, data) => api.post(`/tasks/${id}/comments`, data),
  deleteComment: (taskId, commentId) => api.delete(`/tasks/${taskId}/comments/${commentId}`),
  logTime: (id, data) => api.put(`/tasks/${id}/log-time`, data),
  uploadAttachment: (id, formData) => api.post(`/tasks/${id}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};
