import axiosInstance from './axiosInstance';

export const loginUser = async (email, password) => {
  const response = await axiosInstance.get(`/users?email=${email}&password=${password}`);
  const users = response.data;
  if(users.length > 0) return users[0];
  return undefined;
};

export const getAllUsers = async (params = {}) => {
  const response = await axiosInstance.get('/users', { params });
  return response.data;
};

export const createUser = async (userData) => {
  const response = await axiosInstance.post('/users', userData);
  return response.data;
};

export const updateUser = async (userId, userData) => {
  const response = await axiosInstance.patch(`/users/${userId}`, userData);
  return response.data;
};

export const deleteUser = async (userId) => {
  const response = await axiosInstance.delete(`/users/${userId}`);
  return response.data;
};
