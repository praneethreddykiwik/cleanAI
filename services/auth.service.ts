import { get, post, patch } from './api';
import type { ApiResponse, AuthTokens, LoginRequest, RegisterRequest, User } from '@/types';

interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

interface RegisterResponse {
  user: User;
  tokens: AuthTokens;
}

export const authApi = {
  login: (data: LoginRequest) =>
    post<LoginResponse>('/auth/login', data),

  register: (data: RegisterRequest) =>
    post<RegisterResponse>('/auth/register', data),

  logout: () =>
    post('/auth/logout'),

  refreshToken: (refreshToken: string) =>
    post<AuthTokens>('/auth/refresh', { refreshToken }),

  forgotPassword: (email: string) =>
    post('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string, confirmPassword: string) =>
    post('/auth/reset-password', { token, password, confirmPassword }),

  verifyEmail: (token: string) =>
    post('/auth/verify-email', { token }),

  verifyOtp: (phone: string, otp: string) =>
    post('/auth/verify-otp', { phone, otp }),

  resendOtp: (phone: string) =>
    post('/auth/resend-otp', { phone }),

  me: (): Promise<ApiResponse<User>> =>
    get<User>('/auth/me'),

  updateProfile: (data: Partial<User>) =>
    patch<User>('/auth/profile', data),

  changePassword: (currentPassword: string, newPassword: string) =>
    post('/auth/change-password', { currentPassword, newPassword }),
};
