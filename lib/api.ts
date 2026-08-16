import { APP_CONFIG } from './config';
import { readJson } from './read-json';

export async function apiCall(endpoint: string, options: RequestInit = {}) {
  const API_BASE_URL = APP_CONFIG.apiUrl;
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

  let res;
  try {
    res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (err: any) {
    // err is a TypeError from fetch (e.g. "Failed to fetch", "ECONNREFUSED")
    const errMsg = err?.message || String(err) || 'Connection refused';
    console.error(`[API] Cannot reach backend at ${API_BASE_URL}${endpoint} — ${errMsg}`);
    throw new Error(`Backend unreachable (${errMsg}). Make sure the server is running on port 4000.`);
  }

  if (res.status === 401 && typeof window !== 'undefined') {
    // If unauthorized, clear tokens and redirect to login
    localStorage.removeItem('cleanai_user');
    localStorage.removeItem('cleanai_tokens');
    // We can let the calling hook handle redirect or toast
  }

  const data = await readJson<any>(res);
  if (!res.ok) {
    throw new Error(data.message || `Request failed with status ${res.status}`);
  }

  return data;
}
