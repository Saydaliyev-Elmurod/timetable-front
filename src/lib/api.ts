import { getToken } from './auth';
import { getLanguage } from './lang';
import { toast } from 'sonner';
import { API_CONFIG, getApiUrl, ApiEndpoint } from '@/config/api';
import { logger } from '../lib/logger';

// Re-export for convenience
export { API_CONFIG, getApiUrl, type ApiEndpoint };

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
      // Backend localizes error messages by this header.
      'Accept-Language': getLanguage(),
      ...options.headers,
    };

    if (token) {
      (headers as any)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    const rawData = isJson ? await response.json() : null;

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
    logger.error('API call failed:', error);
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

// ─── Generic CRUD service factory ────────────────────────────────────────
// Removes the identical "build URL → apiCall → throw on error → return data!"
// boilerplate that every entity service (Class/Room/Subject/Teacher) repeated.
// Each entity service spreads the base methods it needs and adds/aliases its
// own divergent ones (custom getPaginated, getTemplates, renamed bulk methods).

async function getJson<R>(url: string): Promise<R> {
  const res = await apiCall<R>(url);
  if (res.error) throw res.error;
  return res.data!;
}

async function sendJson(url: string, method: string, body?: unknown): Promise<void> {
  const res = await apiCall(url, {
    method,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  if (res.error) throw res.error;
}

/** Build `base?key=val&...`, skipping nullish/empty values and url-encoding. */
export function buildQuery(
  base: string,
  params: Record<string, string | number | undefined | null>,
): string {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&');
  return qs ? `${base}?${qs}` : base;
}

export function createCrudService<TRes, TReq = TRes, TUpdateReq = TReq>(
  endpointKey: ApiEndpoint,
) {
  const endpoint = () => getApiUrl(endpointKey);
  return {
    /** Base endpoint URL, for composing custom routes. */
    endpoint,
    /** GET helper: throws on error, returns unwrapped data. */
    get: getJson,
    /** Body helper (POST/PUT/DELETE): throws on error. */
    send: sendJson,
    getAll: () => getJson<TRes[]>(`${endpoint()}/all`),
    getById: (id: number) => getJson<TRes>(`${endpoint()}/${id}`),
    create: (data: TReq) => sendJson(endpoint(), 'POST', data),
    bulkCreate: (data: TReq[]) => sendJson(`${endpoint()}/bulk`, 'POST', data),
    update: (id: number, data: TUpdateReq) => sendJson(`${endpoint()}/${id}`, 'PUT', data),
    bulkUpdate: <T>(data: T) => sendJson(`${endpoint()}/bulk`, 'PUT', data),
    delete: (id: number) => sendJson(`${endpoint()}/${id}`, 'DELETE'),
    bulkDelete: (ids: number[]) => sendJson(`${endpoint()}/bulk`, 'DELETE', ids),
  };
}

// API Configuration
export const API = {
  config: API_CONFIG,
  url: getApiUrl,
  call: apiCall,
};

export default API;