// Unified API Configuration - Single source of truth

function getBaseUrl(): string {
  // Check for Vite environment variable first
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Handle cloud workstations (Google IDX)
  if (typeof window !== 'undefined' && window.location.host.includes('cloudworkstations.dev')) {
    const currentHost = window.location.host;
    const backendHost = currentHost.replace(/^\d+-/, '8080-');
    return `https://${backendHost}`;
  }

  return 'http://localhost:8080';
}

// Check if mock API should be used
function shouldUseMockApi(): boolean {
  if (typeof import.meta !== 'undefined') {
    return import.meta.env?.VITE_USE_MOCK_API === 'true';
  }
  return false;
}

// API Endpoints with version
export const API_ENDPOINTS = {
  TEACHERS: '/api/teachers/v1',
  SUBJECTS: '/api/subjects/v1',
  ROOMS: '/api/rooms/v1',
  TIMETABLES: '/api/timetables',
  AUTH: '/api/auth/v1',
  LESSONS: '/api/lessons/v1',
  CLASSES: '/api/classes/v1'
} as const;

export type ApiEndpoint = keyof typeof API_ENDPOINTS;

// API Configuration object
export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  USE_MOCK: shouldUseMockApi(),
  ENDPOINTS: API_ENDPOINTS
} as const;

// Get full URL for an endpoint
export const getApiUrl = (endpoint: ApiEndpoint): string => {
  return `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS[endpoint]}`;
};

// Utility for safe API calls with proper error handling
export async function safeApiCall<T>(
  apiCall: () => Promise<T>,
  errorMessage: string = 'API call failed'
): Promise<T> {
  try {
    return await apiCall();
  } catch (error) {
    console.error(`${errorMessage}:`, error);
    throw new Error(errorMessage);
  }
}
