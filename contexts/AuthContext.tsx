'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import type { User, LoginRequest, RegisterRequest, AuthTokens } from '@/types';
import { toast } from 'sonner';
import { APP_CONFIG } from '@/lib/config';

interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  updateUser: () => {},
});

const API_BASE_URL = APP_CONFIG.apiUrl;

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ---- Fetch authenticated user profile ----
  const fetchMe = useCallback(async (accessToken: string): Promise<User | null> => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return data.data;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  // ---- Refresh token flow ----
  const refreshTokens = useCallback(async (refreshToken: string): Promise<string | null> => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return data.data.accessToken;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  // ---- Initialize from storage ----
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = localStorage.getItem('cleanai_user');
        const storedTokensString = localStorage.getItem('cleanai_tokens');

        if (storedUser && storedTokensString) {
          const parsedTokens: AuthTokens = JSON.parse(storedTokensString);
          // Verify token against /me
          let currentUser = await fetchMe(parsedTokens.accessToken);

          if (!currentUser) {
            // Try refresh token
            const newAccessToken = await refreshTokens(parsedTokens.refreshToken);
            if (newAccessToken) {
              parsedTokens.accessToken = newAccessToken;
              localStorage.setItem('cleanai_tokens', JSON.stringify(parsedTokens));
              setTokens(parsedTokens);
              currentUser = await fetchMe(newAccessToken);
            }
          }

          if (currentUser) {
            setUser(currentUser);
            setTokens(parsedTokens);
            localStorage.setItem('cleanai_user', JSON.stringify(currentUser));
          } else {
            // Authentication failed
            localStorage.removeItem('cleanai_user');
            localStorage.removeItem('cleanai_tokens');
          }
        }
      } catch {
        localStorage.removeItem('cleanai_user');
        localStorage.removeItem('cleanai_tokens');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [fetchMe, refreshTokens]);

  // ---- Login ----
  const login = useCallback(
    async (credentials: LoginRequest) => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Login failed');
        }

        const loginUser: User = data.data.user;
        const loginTokens: AuthTokens = {
          accessToken: data.data.accessToken,
          refreshToken: data.data.refreshToken,
        };

        setUser(loginUser);
        setTokens(loginTokens);
        localStorage.setItem('cleanai_user', JSON.stringify(loginUser));
        localStorage.setItem('cleanai_tokens', JSON.stringify(loginTokens));

        toast.success(data.message || 'Login successful!');

        const redirectMap: Record<string, string> = {
          CUSTOMER: '/customer/dashboard',
          VENDOR: '/vendor/dashboard',
          ADMIN: '/admin/dashboard',
        };
        router.push(redirectMap[loginUser.role] || '/customer/dashboard');
      } catch (err) {
        const error = err as Error;
        toast.error(error.message || 'Failed to authenticate');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  // ---- Register ----
  const register = useCallback(
    async (params: RegisterRequest) => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Registration failed');
        }

        const registeredUser: User = data.data.user;
        const registerTokens: AuthTokens = {
          accessToken: data.data.accessToken,
          refreshToken: data.data.refreshToken,
        };

        setUser(registeredUser);
        setTokens(registerTokens);
        localStorage.setItem('cleanai_user', JSON.stringify(registeredUser));
        localStorage.setItem('cleanai_tokens', JSON.stringify(registerTokens));

        toast.success('Registration successful!');

        const redirectMap: Record<string, string> = {
          CUSTOMER: '/customer/dashboard',
          VENDOR: '/vendor/dashboard',
          ADMIN: '/admin/dashboard',
        };
        router.push(redirectMap[registeredUser.role] || '/customer/dashboard');
      } catch (err) {
        const error = err as Error;
        toast.error(error.message || 'Registration failed');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  // ---- Logout ----
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      if (tokens?.refreshToken) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: tokens.refreshToken }),
        });
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      setTokens(null);
      localStorage.removeItem('cleanai_user');
      localStorage.removeItem('cleanai_tokens');
      toast.success('Logged out successfully.');
      setIsLoading(false);
      router.push('/auth/login');
    }
  }, [tokens, router]);

  // ---- Update User ----
  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      localStorage.setItem('cleanai_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        tokens,
        isAuthenticated: !!user && !!tokens,
        isLoading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { AuthContext };
