import React, { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { AuthProvider, setApiTokenStorage, setAuthTokenStorage, useAuth } from '@ve/mobile-shared';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppNavigator from './navigation/AppNavigator';
import { notificationService } from './utils/notifications';

// ── Token Storage ────────────────────────────────────────────────────────────
const ACCESS_TOKEN_KEY = '@ve_customer_access_token';
const REFRESH_TOKEN_KEY = '@ve_customer_refresh_token';
const USER_KEY = '@ve_customer_user';

const customerTokenStorage = {
  getAccessToken: () => AsyncStorage.getItem(ACCESS_TOKEN_KEY),
  setAccessToken: (t: string) => AsyncStorage.setItem(ACCESS_TOKEN_KEY, t),
  getRefreshToken: () => AsyncStorage.getItem(REFRESH_TOKEN_KEY),
  setRefreshToken: (t: string) => AsyncStorage.setItem(REFRESH_TOKEN_KEY, t),
  clearTokens: () => AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]),
  setUser: (u: any) => AsyncStorage.setItem(USER_KEY, JSON.stringify(u)),
  getUser: async () => { const j = await AsyncStorage.getItem(USER_KEY); return j ? JSON.parse(j) : null; },
  clearUser: () => AsyncStorage.removeItem(USER_KEY),
};

// ── Navigation Ref (for navigating from notification handlers) ───────────────
export const navigationRef = createNavigationContainerRef<any>();

function navigate(name: string, params?: object) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name as never, params as never);
  }
}

// ── Deep Linking Config ──────────────────────────────────────────────────────
// URL schemes: ve-customer:// (native) + https://villageexpress.in/app/customer/ (universal)
const linking = {
  prefixes: ['ve-customer://', 'https://villageexpress.in/app/customer'],
  config: {
    screens: {
      AuthStack: {
        screens: {
          Login: 'login',
          Register: 'register',
          ForgotPassword: 'forgot-password',
          ResetPassword: 'reset-password/:token',
        },
      },
      MainTabs: {
        screens: {
          HomeTab: 'home',
          BookingsTab: {
            screens: {
              MyBookings: 'bookings',
              BookingDetails: 'bookings/:bookingId',
              NewBooking: 'book',
            },
          },
          WalletTab: 'wallet',
          ProfileTab: {
            screens: {
              Profile: 'profile',
              Notifications: 'notifications',
              Referral: 'referral',
            },
          },
        },
      },
    },
  },
};

// ── Notification + Push Setup (runs once user is authenticated) ──────────────
function PushNotificationManager() {
  const { isAuthenticated } = useAuth();
  const cleanupRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    if (!isAuthenticated) return;

    notificationService.registerForPushNotifications();

    // Foreground notification handler
    const removeFg = notificationService.addForegroundListener(notification => {
      const { title, body } = notification.request.content;
      Alert.alert(title ?? 'Village Express', body ?? '');
    });

    // Tap on notification → navigate
    const removeResp = notificationService.addResponseListener(response => {
      const data = response.notification.request.content.data as any;
      if (data?.bookingId)    navigate('BookingDetails', { bookingId: data.bookingId });
      if (data?.screen === 'wallet')    navigate('WalletTab');
      if (data?.screen === 'notifications') navigate('Notifications');
    });

    cleanupRef.current = [removeFg, removeResp];
    return () => { cleanupRef.current.forEach(fn => fn()); };
  }, [isAuthenticated]);

  return null;
}

export default function App() {
  useEffect(() => {
    setApiTokenStorage(customerTokenStorage);
    setAuthTokenStorage(customerTokenStorage);
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
