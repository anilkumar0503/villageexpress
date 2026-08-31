import { apiClient } from './client';
import { z } from 'zod';

// Zod schemas matching backend validation
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Invalid phone number'),
});

export const otpSchema = z.object({
  phone: z.string().min(10, 'Invalid phone number'),
});

export const verifyOtpSchema = z.object({
  phone: z.string().min(10, 'Invalid phone number'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

// TypeScript types
export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  phone: string;
}

export interface OtpInput {
  phone: string;
}

export interface VerifyOtpInput {
  phone: string;
  otp: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    accessToken: string;
    user: {
      id: string;
      displayId: string;
      name: string;
      email: string;
      roles: string[];
    };
  };
}

export interface User {
  id: string;
  displayId: string;
  name: string;
  email: string;
  phone?: string;
  roles: string[];
  isActive?: boolean;
  approvalStatus?: string;
}

// API functions
export const authApi = {
  async login(input: LoginInput): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', input);
    return response.data;
  },

  async register(input: RegisterInput): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', input);
    return response.data;
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  async getCurrentUser(): Promise<{ success: boolean; data: User }> {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  async sendOtp(input: OtpInput): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/auth/otp/send', input);
    return response.data;
  },

  async verifyOtp(input: VerifyOtpInput): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/otp/verify', input);
    return response.data;
  },

  async refreshToken(refreshToken: string): Promise<{ success: boolean; data: { accessToken: string } }> {
    const response = await apiClient.post('/auth/refresh', { refreshToken });
    return response.data;
  },

  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/auth/password-reset/request', { email });
    return response.data;
  },

  async resetPassword(token: string, password: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/auth/password-reset/reset', { token, password });
    return response.data;
  },

  async getPermissions(): Promise<{ success: boolean; data: string[] }> {
    const response = await apiClient.get('/auth/permissions');
    return response.data;
  },

  // Captain-specific registration endpoint
  async registerCaptain(input: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }): Promise<{ success: boolean; message: string; data: { id: string; displayId: string } }> {
    const response = await apiClient.post('/users/register/captain', input);
    return response.data;
  },

  // Point Manager-specific registration endpoint
  async registerPointManager(input: {
    name: string;
    email: string;
    phone: string;
    password: string;
    shopName: string;
    location: {
      pointName: string;
      village: string;
      district: string;
      state: string;
      pincode: string;
    };
  }): Promise<{ success: boolean; message: string; data: { id: string; displayId: string } }> {
    const response = await apiClient.post('/users/register/point-manager', input);
    return response.data;
  },
};