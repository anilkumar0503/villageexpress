// Token storage utilities
// Note: This is a placeholder implementation. Each mobile app should implement
// its own storage using AsyncStorage or SecureStorage based on its needs.

const ACCESS_TOKEN_KEY = '@ve_access_token';
const REFRESH_TOKEN_KEY = '@ve_refresh_token';
const USER_KEY = '@ve_user';

// In-memory storage for development (replace with AsyncStorage in production)
let memoryStorage: Record<string, string> = {};

export const tokenStorage = {
  async setAccessToken(token: string): Promise<void> {
    // TODO: Replace with AsyncStorage.setItem(ACCESS_TOKEN_KEY, token);
    memoryStorage[ACCESS_TOKEN_KEY] = token;
  },

  async getAccessToken(): Promise<string | null> {
    // TODO: Replace with AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    return memoryStorage[ACCESS_TOKEN_KEY] || null;
  },

  async setRefreshToken(token: string): Promise<void> {
    // TODO: Replace with AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
    memoryStorage[REFRESH_TOKEN_KEY] = token;
  },

  async getRefreshToken(): Promise<string | null> {
    // TODO: Replace with AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    return memoryStorage[REFRESH_TOKEN_KEY] || null;
  },

  async clearTokens(): Promise<void> {
    // TODO: Replace with AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
    delete memoryStorage[ACCESS_TOKEN_KEY];
    delete memoryStorage[REFRESH_TOKEN_KEY];
    delete memoryStorage[USER_KEY];
  },

  async setUser(user: any): Promise<void> {
    // TODO: Replace with AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    memoryStorage[USER_KEY] = JSON.stringify(user);
  },

  async getUser(): Promise<any | null> {
    // TODO: Replace with AsyncStorage.getItem(USER_KEY);
    const userJson = memoryStorage[USER_KEY];
    return userJson ? JSON.parse(userJson) : null;
  },

  async clearUser(): Promise<void> {
    // TODO: Replace with AsyncStorage.removeItem(USER_KEY);
    delete memoryStorage[USER_KEY];
  },
};