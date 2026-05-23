import { useState, useEffect, useCallback } from 'react';
import { projectsApi } from '../api/projectsApi';
import toast from 'react-hot-toast';

export const useProjects = (params = {}) => {
  const [projects, setProjects] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProjects = useCallback(async (queryParams = params) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await projectsApi.getAll(queryParams);
      setProjects(data.data);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  }, []); // eslint-disable-line

  useEffect(() => { fetchProjects(); }, []); // eslint-disable-line

  const createProject = async (projectData) => {
    const { data } = await projectsApi.create(projectData);
    setProjects((prev) => [data.data, ...prev]);
    toast.success('Project created!');
    return data.data;
  };

  const updateProject = async (id, updates) => {
    const { data } = await projectsApi.update(id, updates);
    setProjects((prev) => prev.map((p) => (p._id === id ? data.data : p)));
    toast.success('Project updated!');
    return data.data;
  };

  const deleteProject = async (id) => {
    await projectsApi.delete(id);
    setProjects((prev) => prev.filter((p) => p._id !== id));
    toast.success('Project deleted');
  };

  return { projects, pagination, isLoading, error, fetchProjects, createProject, updateProject, deleteProject };
};
