import React, { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { AuthProvider, setApiTokenStorage, setAuthTokenStorage, useAuth } from '@ve/mobile-shared';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppNavigator from './navigation/AppNavigator';
import { notificationService } from './utils/notifications';

const ACCESS_TOKEN_KEY = '@ve_pm_access_token';
const REFRESH_TOKEN_KEY = '@ve_pm_refresh_token';
const USER_KEY = '@ve_pm_user';

const pmTokenStorage = {
  getAccessToken: () => AsyncStorage.getItem(ACCESS_TOKEN_KEY),
  setAccessToken: (t: string) => AsyncStorage.setItem(ACCESS_TOKEN_KEY, t),
  getRefreshToken: () => AsyncStorage.getItem(REFRESH_TOKEN_KEY),
  setRefreshToken: (t: string) => AsyncStorage.setItem(REFRESH_TOKEN_KEY, t),
  clearTokens: () => AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]),
  setUser: (u: any) => AsyncStorage.setItem(USER_KEY, JSON.stringify(u)),
  getUser: async () => { const j = await AsyncStorage.getItem(USER_KEY); return j ? JSON.parse(j) : null; },
  clearUser: () => AsyncStorage.removeItem(USER_KEY),
};

export const navigationRef = createNavigationContainerRef<any>();

function navigate(name: string, params?: object) {
  if (navigationRef.isReady()) navigationRef.navigate(name as never, params as never);
}

const linking = {
  prefixes: ['ve-pm://', 'https://villageexpress.in/app/pm'],
  config: {
    screens: {
      AuthStack: { screens: { Login: 'login', Register: 'register', ForgotPassword: 'forgot-password', ResetPassword: 'reset-password/:token' } },
      MainTabs: {
        screens: {
          HomeTab: 'home',
          BookingsTab: { screens: { LocationBookings: 'bookings', BookingDetails: 'bookings/:bookingId' } },
          CodTab: 'cod',
          ProfileTab: { screens: { Profile: 'profile', Notifications: 'notifications' } },
        },
      },
    },
  },
};

function PushNotificationManager() {
  const { isAuthenticated } = useAuth();
  const cleanupRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    if (!isAuthenticated) return;
    notificationService.registerForPushNotifications();
    const removeFg = notificationService.addForegroundListener(n => {
      Alert.alert(n.request.content.title ?? 'Village Express', n.request.content.body ?? '');
    });
    const removeResp = notificationService.addResponseListener(r => {
      const data = r.notification.request.content.data as any;
      if (data?.bookingId)    navigate('BookingDetails', { bookingId: data.bookingId });
      if (data?.screen === 'cod') navigate('CodTab');
    });
    cleanupRef.current = [removeFg, removeResp];
    return () => { cleanupRef.current.forEach(fn => fn()); };
  }, [isAuthenticated]);

  return null;
}

export default function App() {
  useEffect(() => {
    setApiTokenStorage(pmTokenStorage);
    setAuthTokenStorage(pmTokenStorage);
  }, []);

  return (
    <AuthProvider>
      <NavigationContainer ref={navigationRef} linking={linking}>
        <PushNotificationManager />
        <AppNavigator />
        <StatusBar style="auto" />
      </NavigationContainer>
    </AuthProvider>
  );
}
