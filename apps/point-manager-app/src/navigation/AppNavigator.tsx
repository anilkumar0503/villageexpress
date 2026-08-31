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

// Point Manager screens
import HomeScreen from '../screens/pointManager/HomeScreen';
import LocationBookingsScreen from '../screens/pointManager/LocationBookingsScreen';
import BookingDetailsScreen from '../screens/pointManager/BookingDetailsScreen';
import CodManagementScreen from '../screens/pointManager/CodManagementScreen';
import CommissionScreen from '../screens/pointManager/CommissionScreen';
import ProfileScreen from '../screens/pointManager/ProfileScreen';
import SupportScreen from '../screens/pointManager/SupportScreen';
import WorkingHoursScreen from '../screens/pointManager/WorkingHoursScreen';
import EditProfileScreen from '../screens/pointManager/EditProfileScreen';
import NotificationsScreen from '../screens/pointManager/NotificationsScreen';
import PayoutDetailsScreen from '../screens/pointManager/PayoutDetailsScreen';
import ScanScreen from '../screens/pointManager/ScanScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const THEME = '#FF9800';
const HEADER_OPTS = {
  headerStyle: { backgroundColor: THEME },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: 'bold' as const },
};

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: '🏠', Bookings: '📦', Scan: '📷', COD: '💵', Profile: '👤',
  };
  return (
    <View style={styles.tabIconWrap}>
      <Text style={styles.tabIconText}>{icons[label] ?? '●'}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={HEADER_OPTS}>
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
      <Stack.Screen name="Commission" component={CommissionScreen} options={{ title: 'My Commission' }} />
    </Stack.Navigator>
  );
}

function BookingsStack() {
  return (
    <Stack.Navigator screenOptions={HEADER_OPTS}>
      <Stack.Screen name="LocationBookings" component={LocationBookingsScreen} options={{ title: 'Location Bookings' }} />
      <Stack.Screen name="BookingDetails" component={BookingDetailsScreen} options={{ title: 'Booking Details' }} />
    </Stack.Navigator>
  );
}

function ScanStack() {
  return (
    <Stack.Navigator screenOptions={HEADER_OPTS}>
      <Stack.Screen name="ScanMain" component={ScanScreen} options={{ title: 'Scan Booking' }} />
      <Stack.Screen name="BookingDetails" component={BookingDetailsScreen} options={{ title: 'Booking Details' }} />
    </Stack.Navigator>
  );
}

function CodStack() {
  return (
    <Stack.Navigator screenOptions={HEADER_OPTS}>
      <Stack.Screen name="CodManagement" component={CodManagementScreen} options={{ title: 'COD Management' }} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={HEADER_OPTS}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} options={{ title: 'My Profile' }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile' }} />
      <Stack.Screen name="WorkingHours" component={WorkingHoursScreen} options={{ title: 'Working Hours' }} />
      <Stack.Screen name="PayoutDetails" component={PayoutDetailsScreen} options={{ title: 'Payout Details' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
      <Stack.Screen name="Support" component={SupportScreen} options={{ title: 'Support' }} />
    </Stack.Navigator>
  );
}

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
        name="ScanTab"
        component={ScanStack}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Scan" focused={focused} /> }}
      />
      <Tab.Screen
        name="CodTab"
        component={CodStack}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="COD" focused={focused} /> }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Profile" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={HEADER_OPTS}>
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Point Manager Login' }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'PM Registration' }} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: 'Forgot Password' }} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ title: 'Reset Password' }} />
    </Stack.Navigator>
  );
}

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
  tabIconWrap: { alignItems: 'center', justifyContent: 'center' },
  tabIconText: { fontSize: 20 },
  tabLabel: { fontSize: 10, color: '#999', marginTop: 2 },
  tabLabelActive: { color: THEME, fontWeight: '600' },
});
