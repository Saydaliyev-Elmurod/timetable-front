import { getToken } from './auth';
import { toast } from 'sonner';

// API Configuration
const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  USE_MOCK: import.meta.env.VITE_USE_MOCK_API === 'true',
  VERSION: 'v1',
  ENDPOINTS: {
    TEACHERS: '/api/teachers',
    SUBJECTS: '/api/subjects',
    ROOMS: '/api/rooms',
    TIMETABLES: '/api/timetables',
    CLASSES: '/api/classes',
    LESSONS: '/api/lessons'
  }
} as const;

export type ApiEndpoint = keyof typeof API_CONFIG.ENDPOINTS;

// URL builder
export const getApiUrl = (endpoint: ApiEndpoint, version: boolean = true) => {
  const base = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS[endpoint]}`;
  return version ? `${base}/${API_CONFIG.VERSION}` : base;
};

// Error types
export interface ApiError extends Error {
  status?: number;
  code?: string;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  status: number;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

// Generic API caller with error handling
export async function apiCall<T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const token = getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      (headers as any)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const rawData = await response.json();

    if (!response.ok) {
      // Prefer structured server message when available
      const serverMessage = rawData?.errorDescription || rawData?.error || rawData?.message || response.statusText || 'API call failed';
      // show user-facing alert/toast for 4xx/5xx
      try {
        toast.error(String(serverMessage));
      } catch (e) {
        // ignore toast errors
      }
      const error: ApiError = new Error(serverMessage);
      error.status = response.status;
      error.code = rawData?.code;
      throw error;
    }

    // Handle new API wrapper format: { error, errorDescription, response }
    let data = rawData;
    if (rawData && typeof rawData === 'object' && 'response' in rawData && 'error' in rawData && 'errorDescription' in rawData) {
      // If the backend wrapper contains an error field, surface it to the user
      if (rawData.error) {
        const serverMessage = rawData.errorDescription || rawData.error || 'API call failed';
        try {
          toast.error(String(serverMessage));
        } catch (e) {
          // ignore toast errors
        }
        const error: ApiError = new Error(serverMessage);
        error.status = response.status;
        throw error;
      }
      // Extract the actual response data
      data = rawData.response;
    }

    return {
      data: data as T,
      status: response.status
    };
  } catch (error) {
    console.error('API call failed:', error);
    // Show a generic toast if the error has a message
    try {
      const msg = (error as ApiError)?.message || 'Request failed';
      if (msg) toast.error(String(msg));
    } catch (e) {
      // ignore
    }
    return {
      error: error as ApiError,
      status: (error as ApiError).status || 500
    };
  }
}

// API Configuration
export const API = {
  config: API_CONFIG,
  url: getApiUrl,
  call: apiCall,
};

export default API;