import axios from 'axios';
import { API_CONFIG } from '../config/api';
import { getToken, removeToken } from './token';
import { toast } from 'sonner';

const axiosInstance = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
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

// Response interceptor to handle errors
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            const data = error.response.data;
            if (data && data.errorDescription) {
                toast.error(data.errorDescription);
            } else if (data && data.error) {
                toast.error(data.error);
            }

            if (error.response.status === 401) {
                // Handle unauthorized access (e.g., redirect to login)
                removeToken();
                localStorage.removeItem('user');
                window.location.href = '/'; // Force redirect to landing/login
            }
        } else if (error.message) {
            toast.error(error.message);
        }
        
        return Promise.reject(error);
    }
);

export default axiosInstance;
