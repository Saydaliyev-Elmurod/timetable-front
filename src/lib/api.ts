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
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      const error: ApiError = new Error(data.message || 'API call failed');
      error.status = response.status;
      error.code = data.code;
      throw error;
    }

    return {
      data,
      status: response.status
    };
  } catch (error) {
    console.error('API call failed:', error);
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