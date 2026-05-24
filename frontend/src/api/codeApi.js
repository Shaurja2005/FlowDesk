import axiosInstance from './axiosInstance';

export const getFileTree = (owner, repo, path = '', branch = '') =>
  axiosInstance.get(`/integrations/github/repos/${owner}/${repo}/tree`, {
    params: { path, branch }
  });

export const getFileContent = (owner, repo, path, branch = '') =>
  axiosInstance.get(`/integrations/github/repos/${owner}/${repo}/file`, {
    params: { path, branch }
  });

export const getReadme = (owner, repo) =>
  axiosInstance.get(`/integrations/github/repos/${owner}/${repo}/readme`);
