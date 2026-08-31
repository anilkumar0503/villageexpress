import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// Token storage interface - each app should implement this
export interface TokenStorage {
  getAccessToken(): Promise<string | null>;
  setAccessToken(token: string): Promise<void>;
  getRefreshToken(): Promise<string | null>;
  setRefreshToken(token: string): Promise<void>;
  clearTokens(): Promise<void>;
}

// Default token storage (in-memory, should be overridden by apps)
let tokenStorage: TokenStorage = {
  getAccessToken: async () => null,
  setAccessToken: async () => {},
  getRefreshToken: async () => null,
  setRefreshToken: async () => {},
  clearTokens: async () => {},
};

// Function to set the token storage implementation
export function setTokenStorage(storage: TokenStorage) {
  tokenStorage = storage;
}

// API base URL — resolved at build time by babel-preset-expo (inline env vars)
// Preview / Production EAS builds set API_BASE_URL in eas.json → env
// Local dev falls back to localhost (or use your LAN IP for a physical device)
const API_BASE_URL: string =
  (typeof process !== 'undefined' && process.env?.API_BASE_URL)
    ? process.env.API_BASE_URL
    : (__DEV__ ? 'http://localhost:3000/api' : 'https://villageexpress.in/api');

// Create axios instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await tokenStorage.getAccessToken();
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      return config;
    } catch (error) {
      return config;
    }
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and token refresh
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized - try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await tokenStorage.getRefreshToken();
        if (refreshToken) {
          const newAccessToken = await refreshAccessToken(refreshToken);
          
          if (newAccessToken) {
            await tokenStorage.setAccessToken(newAccessToken);
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return apiClient(originalRequest);
          }
        }
      } catch (refreshError) {
        // Refresh failed - logout user
        await tokenStorage.clearTokens();
        // Navigate to login (implementation depends on your navigation)
        return Promise.reject(error);
      }
    }

    // Handle other errors
    return Promise.reject(error);
  }
);

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
      refreshToken,
    });
    
    if (response.data.success && response.data.data.accessToken) {
      return response.data.data.accessToken;
    }
    return null;
  } catch (error) {
    return null;
  }
}

export default apiClient;