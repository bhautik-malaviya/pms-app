import axios from 'axios';
import { store } from '../store';
import { logout } from '../store/authSlice';

const axiosInstance = axios.create({
  baseURL: 'https://pms-api-production-8829.up.railway.app',
});

axiosInstance.interceptors.request.use(
  (config) => {
    const storedUser = localStorage.getItem('protask_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user && user.id) {
          config.headers.Authorization = `Bearer ${user.id}`;
        }
      } catch (error) {
        console.error('Error parsing user from localStorage', error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      store.dispatch(logout());
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
