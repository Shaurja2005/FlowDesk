import api from './axiosInstance';

export const githubApi = {
  disconnect: () => api.delete('/integrations/github/disconnect'),
  getRepos: () => api.get('/integrations/github/repos'),
  getCommits: (owner, repo) => api.get(`/integrations/github/repos/${owner}/${repo}/commits`),
  getPulls: (owner, repo) => api.get(`/integrations/github/repos/${owner}/${repo}/pulls`),
  getBranches: (owner, repo) => api.get(`/integrations/github/repos/${owner}/${repo}/branches`),
};
