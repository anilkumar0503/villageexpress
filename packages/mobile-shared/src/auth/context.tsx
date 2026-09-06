import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, User } from '../api';

// Token storage interface - each app should provide this
export interface TokenStorage {
  getAccessToken(): Promise<string | null>;
  setAccessToken(token: string): Promise<void>;
  getRefreshToken(): Promise<string | null>;
  setRefreshToken(token: string): Promise<void>;
  clearTokens(): Promise<void>;
  setUser(user: any): Promise<void>;
  getUser(): Promise<any | null>;
  clearUser(): Promise<void>;
}

// Default token storage (in-memory, should be overridden by apps)
let tokenStorage: TokenStorage = {
  getAccessToken: async () => null,
  setAccessToken: async () => {},
  getRefreshToken: async () => null,
  setRefreshToken: async () => {},
  clearTokens: async () => {},
  setUser: async () => {},
  getUser: async () => null,
  clearUser: async () => {},
};

// Function to set the token storage implementation
export function setTokenStorage(storage: TokenStorage) {
  tokenStorage = storage;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithOtp: (email: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await tokenStorage.getAccessToken();
      const storedUser = await tokenStorage.getUser();

      if (token && storedUser) {
        setUser(storedUser);
      } else if (token) {
        // Token exists but no user data, fetch from API
        const response = await authApi.getCurrentUser();
        if (response.success) {
          setUser(response.data);
          await tokenStorage.setUser(response.data);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      await tokenStorage.clearTokens();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    
    if (response.success) {
      const { accessToken, refreshToken, user: userData } = response.data;
      
      await tokenStorage.setAccessToken(accessToken);
      if (refreshToken) await tokenStorage.setRefreshToken(refreshToken);
      await tokenStorage.setUser(userData);
      setUser(userData);
    }
  };

  const loginWithOtp = async (email: string, code: string) => {
    const response = await authApi.verifyOtp({ email, code });
    
    if (response.success) {
      const { accessToken, refreshToken, user: userData } = response.data;
      
      await tokenStorage.setAccessToken(accessToken);
      if (refreshToken) await tokenStorage.setRefreshToken(refreshToken);
      await tokenStorage.setUser(userData);
      setUser(userData);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      await tokenStorage.clearTokens();
      setUser(null);
    }
  };

  const refreshUser = async () => {
    // Throws on failure — callers should handle errors
    const response = await authApi.getCurrentUser();
    if (response.success) {
      setUser(response.data);
      await tokenStorage.setUser(response.data);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        loginWithOtp,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}