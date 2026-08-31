import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '@ve/mobile-shared';

// Auth screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';

// Customer screens
import HomeScreen from '../screens/customer/HomeScreen';
import BookingScreen from '../screens/customer/BookingScreen';
import MyBookingsScreen from '../screens/customer/MyBookingsScreen';
import BookingDetailsScreen from '../screens/customer/BookingDetailsScreen';
import WalletScreen from '../screens/customer/WalletScreen';
import ProfileScreen from '../screens/customer/ProfileScreen';
import SupportScreen from '../screens/customer/SupportScreen';
import EditProfileScreen from '../screens/customer/EditProfileScreen';
import NotificationsScreen from '../screens/customer/NotificationsScreen';
import FavoriteLocationsScreen from '../screens/customer/FavoriteLocationsScreen';
import ReferralScreen from '../screens/customer/ReferralScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const THEME = '#4CAF50';
const HEADER_OPTS = {
  headerStyle: { backgroundColor: THEME },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: 'bold' as const },
};

// ── Tab icon component (text-based, no icon library needed) ──────────────────
function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: '🏠', Bookings: '📦', Wallet: '💰', Profile: '👤',
  };
  return (
    <View style={styles.tabIconWrap}>
      <Text style={styles.tabIconText}>{icons[label] ?? '●'}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

// ── Nested stacks for each tab ───────────────────────────────────────────────
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={HEADER_OPTS}>
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
      <Stack.Screen name="FavoriteLocations" component={FavoriteLocationsScreen} options={{ title: 'Favorite Locations' }} />
    </Stack.Navigator>
  );
}

function BookingsStack() {
  return (
    <Stack.Navigator screenOptions={HEADER_OPTS}>
      <Stack.Screen name="MyBookings" component={MyBookingsScreen} options={{ title: 'My Bookings' }} />
      <Stack.Screen name="Booking" component={BookingScreen} options={{ title: 'New Booking' }} />
      <Stack.Screen name="BookingDetails" component={BookingDetailsScreen} options={{ title: 'Booking Details' }} />
    </Stack.Navigator>
  );
}

function WalletStack() {
  return (
    <Stack.Navigator screenOptions={HEADER_OPTS}>
      <Stack.Screen name="WalletMain" component={WalletScreen} options={{ title: 'My Wallet' }} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={HEADER_OPTS}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} options={{ title: 'My Profile' }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile' }} />
      <Stack.Screen name="FavoriteLocations" component={FavoriteLocationsScreen} options={{ title: 'Favorite Locations' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
      <Stack.Screen name="Referral" component={ReferralScreen} options={{ title: 'Refer & Earn' }} />
      <Stack.Screen name="Support" component={SupportScreen} options={{ title: 'Support' }} />
    </Stack.Navigator>
  );
}

// ── Main bottom tab navigator ────────────────────────────────────────────────
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false, tabBarShowLabel: false, tabBarStyle: styles.tabBar }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Home" focused={focused} /> }}
      />
      <Tab.Screen
        name="BookingsTab"
        component={BookingsStack}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Bookings" focused={focused} /> }}
      />
      <Tab.Screen
        name="WalletTab"
        component={WalletStack}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Wallet" focused={focused} /> }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Profile" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}

// ── Auth stack ───────────────────────────────────────────────────────────────
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={HEADER_OPTS}>
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Login' }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Create Account' }} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: 'Forgot Password' }} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ title: 'Reset Password' }} />
    </Stack.Navigator>
  );
}

// ── Root navigator ───────────────────────────────────────────────────────────
export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;

  return isAuthenticated ? <MainTabs /> : <AuthStack />;
}

const styles = StyleSheet.create({
  tabBar: {
    height: 65,
    paddingBottom: 8,
    paddingTop: 6,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  tabIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconText: {
    fontSize: 20,
  },
  tabLabel: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  tabLabelActive: {
    color: THEME,
    fontWeight: '600',
  },
});
