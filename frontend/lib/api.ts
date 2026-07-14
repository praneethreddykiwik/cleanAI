import { APP_CONFIG } from './config';

const API_BASE_URL = APP_CONFIG.apiUrl;

export async function apiCall(endpoint: string, options: RequestInit = {}) {
  let token = null;
  if (typeof window !== 'undefined') {
    const tokensStr = localStorage.getItem('cleanai_tokens');
    if (tokensStr) {
      try {
        const parsed = JSON.parse(tokensStr);
        token = parsed.accessToken;
      } catch (e) {
        console.error('Failed to parse tokens', e);
      }
    }
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401 && typeof window !== 'undefined') {
    // If unauthorized, clear tokens and redirect to login
    localStorage.removeItem('cleanai_user');
    localStorage.removeItem('cleanai_tokens');
    // We can let the calling hook handle redirect or toast
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `Request failed with status ${res.status}`);
  }

  return data;
}
