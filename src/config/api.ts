// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  USE_MOCK: import.meta.env.VITE_USE_MOCK_API === 'true',
  ENDPOINTS: {
    TEACHERS: '/api/teachers/v1',
    SUBJECTS: '/api/subjects/v1',
    ROOMS: '/api/rooms/v1',
    TIMETABLES: '/api/timetables',
  }
};

export const getApiUrl = (endpoint: keyof typeof API_CONFIG.ENDPOINTS) => {
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