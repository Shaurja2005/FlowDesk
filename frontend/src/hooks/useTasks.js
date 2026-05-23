import { useState, useEffect, useCallback } from 'react';
import { tasksApi } from '../api/tasksApi';
import toast from 'react-hot-toast';

export const useTasks = (params = {}) => {
  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTasks = useCallback(async (queryParams = params) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await tasksApi.getAll(queryParams);
      setTasks(data.data);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  }, []); // eslint-disable-line

  useEffect(() => { fetchTasks(); }, []); // eslint-disable-line

  const createTask = async (taskData) => {
    const { data } = await tasksApi.create(taskData);
    setTasks((prev) => [data.data, ...prev]);
    toast.success('Task created!');
    return data.data;
  };

  const updateTask = async (id, updates) => {
    // Optimistic update
    setTasks((prev) => prev.map((t) => (t._id === id ? { ...t, ...updates } : t)));
    try {
      const { data } = await tasksApi.update(id, updates);
      setTasks((prev) => prev.map((t) => (t._id === id ? data.data : t)));
      return data.data;
    } catch (err) {
      // Rollback on failure
      fetchTasks();
      throw err;
    }
  };

  const deleteTask = async (id) => {
    await tasksApi.delete(id);
    setTasks((prev) => prev.filter((t) => t._id !== id));
    toast.success('Task deleted');
  };

  return { tasks, setTasks, pagination, isLoading, error, fetchTasks, createTask, updateTask, deleteTask };
};
