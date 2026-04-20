import axiosInstance from './axiosInstance';

export const getAllTasks = async (params = {}) => {
  const response = await axiosInstance.get('/tasks', { params });
  return response.data;
};

export const getTasksByProjectId = async (projectId) => {
  const response = await axiosInstance.get('/tasks');
  return response.data.filter(t => String(t.projectId) === String(projectId));
};

export const getTaskById = async (id) => {
  const response = await axiosInstance.get(`/tasks/${id}`);
  return response.data;
};

export const createTask = async (taskData) => {
  const response = await axiosInstance.post('/tasks', taskData);
  return response.data;
};

export const updateTask = async (id, taskData) => {
  const response = await axiosInstance.put(`/tasks/${id}`, taskData);
  return response.data;
};

export const deleteTask = async (id) => {
  const response = await axiosInstance.delete(`/tasks/${id}`);
  return response.data;
};

export const deleteTasksByProjectId = async (projectId) => {
  const tasks = await getTasksByProjectId(projectId);
  const deletePromises = tasks.map((task) => deleteTask(task.id));
  await Promise.all(deletePromises);
};
