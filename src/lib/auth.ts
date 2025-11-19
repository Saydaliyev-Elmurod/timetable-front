import axiosInstance from './axios';
import { API_CONFIG } from '../config/api';
export * from './token';

const AUTH_ENDPOINT = API_CONFIG.ENDPOINTS.AUTH;

export const getCode = async (email: string) => {
  const response = await axiosInstance.post(`${AUTH_ENDPOINT}/code`, { email });
  return response.data;
};

export const verify = async (payload: { name: string; surname: string; email: string; code: number; password: string }) => {
  const response = await axiosInstance.post(`${AUTH_ENDPOINT}/verify`, payload);
  return response.data;
};

export const login = async (payload: { email: string; password: string }) => {
  const response = await axiosInstance.post(`${AUTH_ENDPOINT}/login`, payload);
  return response.data;
};

// Deprecated: fetchWithAuth is no longer needed as axiosInstance handles it.
// Keeping it for backward compatibility if used elsewhere, but implementing it via axios.
export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  console.warn('fetchWithAuth is deprecated. Use axiosInstance instead.');
  // This is a rough compatibility layer. Better to refactor usages.
  const method = options.method || 'GET';
  const data = options.body ? JSON.parse(options.body as string) : undefined;

  const response = await axiosInstance({
    url,
    method,
    data,
    // Headers are handled by interceptor, but we can merge custom ones
    headers: options.headers as any,
  });
  return response.data;
};
