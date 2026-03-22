import axios from 'axios';

const PRODUCTION_API_URL = 'https://posbackendfastapi.vercel.app';

// Use env in build/runtime; fallback to production backend when deployed without env (e.g. Vercel)
const getBaseURL = (): string => {
  if (typeof process.env.NEXT_PUBLIC_API_URL === 'string' && process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.location?.hostname !== 'localhost' && window.location?.hostname !== '127.0.0.1') {
    return PRODUCTION_API_URL;
  }
  if (typeof process !== 'undefined' && process.env.VERCEL) {
    return PRODUCTION_API_URL;
  }
  return 'http://localhost:8000';
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

/** List endpoints return `{ value: T[]; Count: number }` or a raw array. */
export function unwrapList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (
    data !== null &&
    typeof data === 'object' &&
    'value' in data &&
    Array.isArray((data as { value: unknown }).value)
  ) {
    return (data as { value: T[] }).value;
  }
  return [];
}

export function getApiErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const detail = (error as { response?: { data?: { detail?: unknown } } }).response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      return detail
        .map((item: { msg?: string }) =>
          typeof item?.msg === 'string' ? item.msg : JSON.stringify(item)
        )
        .filter(Boolean)
        .join('; ');
    }
  }
  if (error instanceof Error) return error.message;
  return 'An error occurred';
}

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (error.response.status !== 404) {
        const message = error.response.data?.detail || 'An error occurred';
        console.error('API Error:', message);
      }
    } else if (error.request) {
      console.error('Network Error: No response received');
    } else {
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
