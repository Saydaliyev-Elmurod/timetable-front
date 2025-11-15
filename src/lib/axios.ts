import axios from 'axios';
import { getToken } from './auth';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
