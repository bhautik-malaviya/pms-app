import axiosInstance from './axiosInstance';

export const getAllProjects = async () => {
  const response = await axiosInstance.get('/projects');
  return response.data;
};

export const getProjectById = async (id) => {
  const response = await axiosInstance.get(`/projects/${id}`);
  return response.data;
};

export const createProject = async (projectData) => {
  const response = await axiosInstance.post('/projects', projectData);
  return response.data;
};

export const updateProject = async (id, projectData) => {
  const response = await axiosInstance.put(`/projects/${id}`, projectData);
  return response.data;
};

export const deleteProject = async (id) => {
  const response = await axiosInstance.delete(`/projects/${id}`);
  return response.data;
};
