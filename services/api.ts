import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { ApiResponse } from '@/types';
import { APP_CONFIG } from '@/lib/config';

export const apiClient: AxiosInstance = axios.create({
  baseURL: APP_CONFIG.apiUrl,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Request interceptor — attach access token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const tokensStr = localStorage.getItem('cleanai_tokens');
      if (tokensStr) {
        try {
          const tokens = JSON.parse(tokensStr);
          config.headers.Authorization = `Bearer ${tokens.accessToken}`;
        } catch {
          // Invalid tokens in storage
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 and refresh
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const tokensStr = localStorage.getItem('cleanai_tokens');
        if (tokensStr) {
          const tokens = JSON.parse(tokensStr);
          const response = await axios.post(
            `${APP_CONFIG.apiUrl}/auth/refresh`,
            { refreshToken: tokens.refreshToken }
          );
          // Merge rather than replace: if the server ever omits a field, keeping
          // the existing refresh token is what allows the session to continue.
          const newTokens = { ...tokens, ...response.data.data };
          localStorage.setItem('cleanai_tokens', JSON.stringify(newTokens));
          if (typeof newTokens.expiresIn === 'number') {
            localStorage.setItem(
              'cleanai_token_expiry',
              String(Date.now() + newTokens.expiresIn * 1000)
            );
          }
          originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
          return apiClient(originalRequest);
        }
      } catch {
        // Refresh failed, redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('cleanai_user');
          localStorage.removeItem('cleanai_tokens');
          localStorage.removeItem('cleanai_token_expiry');
          window.location.href = '/auth/login';
        }
      }
    }

    const message =
      error.response?.data?.message || error.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

// Generic HTTP methods
export async function get<T>(
  url: string,
  params?: Record<string, unknown>
): Promise<ApiResponse<T>> {
  const response = await apiClient.get<ApiResponse<T>>(url, { params });
  return response.data;
}

export async function post<T>(
  url: string,
  data?: unknown
): Promise<ApiResponse<T>> {
  const response = await apiClient.post<ApiResponse<T>>(url, data);
  return response.data;
}

export async function put<T>(
  url: string,
  data?: unknown
): Promise<ApiResponse<T>> {
  const response = await apiClient.put<ApiResponse<T>>(url, data);
  return response.data;
}

export async function patch<T>(
  url: string,
  data?: unknown
): Promise<ApiResponse<T>> {
  const response = await apiClient.patch<ApiResponse<T>>(url, data);
  return response.data;
}

export async function del<T>(url: string): Promise<ApiResponse<T>> {
  const response = await apiClient.delete<ApiResponse<T>>(url);
  return response.data;
}
