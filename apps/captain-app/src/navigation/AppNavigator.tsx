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

// Captain screens
import HomeScreen from '../screens/captain/HomeScreen';
import MyBookingsScreen from '../screens/captain/MyBookingsScreen';
import BookingDetailsScreen from '../screens/captain/BookingDetailsScreen';
import EarningsScreen from '../screens/captain/EarningsScreen';
import ProfileScreen from '../screens/captain/ProfileScreen';
import SupportScreen from '../screens/captain/SupportScreen';
import EditProfileScreen from '../screens/captain/EditProfileScreen';
import OnboardingScreen from '../screens/captain/OnboardingScreen';
import KycStatusScreen from '../screens/captain/KycStatusScreen';
import WithdrawalScreen from '../screens/captain/WithdrawalScreen';
import NotificationsScreen from '../screens/captain/NotificationsScreen';
import PayoutDetailsScreen from '../screens/captain/PayoutDetailsScreen';
import SegmentsScreen from '../screens/captain/SegmentsScreen';
import ScanScreen from '../screens/captain/ScanScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const THEME = '#2196F3';
const HEADER_OPTS = {
  headerStyle: { backgroundColor: THEME },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: 'bold' as const },
};

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: '🏠', Assignments: '📋', Scan: '📷', Earnings: '💵', Profile: '👤',
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
    </Stack.Navigator>
  );
}

function AssignmentsStack() {
  return (
    <Stack.Navigator screenOptions={HEADER_OPTS}>
      <Stack.Screen name="MyBookings" component={MyBookingsScreen} options={{ title: 'My Assignments' }} />
      <Stack.Screen name="BookingDetails" component={BookingDetailsScreen} options={{ title: 'Assignment Details' }} />
      <Stack.Screen name="Segments" component={SegmentsScreen} options={{ title: 'My Segments' }} />
    </Stack.Navigator>
  );
}

function ScanStack() {
  return (
    <Stack.Navigator screenOptions={HEADER_OPTS}>
      <Stack.Screen name="ScanMain" component={ScanScreen} options={{ title: 'Scan Booking' }} />
      <Stack.Screen name="BookingDetails" component={BookingDetailsScreen} options={{ title: 'Assignment Details' }} />
    </Stack.Navigator>
  );
}

function EarningsStack() {
  return (
    <Stack.Navigator screenOptions={HEADER_OPTS}>
      <Stack.Screen name="EarningsMain" component={EarningsScreen} options={{ title: 'My Earnings' }} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={HEADER_OPTS}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} options={{ title: 'My Profile' }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile' }} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ title: 'Complete Onboarding' }} />
      <Stack.Screen name="KycStatus" component={KycStatusScreen} options={{ title: 'KYC Status' }} />
      <Stack.Screen name="Withdrawal" component={WithdrawalScreen} options={{ title: 'Withdrawals' }} />
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
        name="AssignmentsTab"
        component={AssignmentsStack}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Assignments" focused={focused} /> }}
      />
      <Tab.Screen
        name="ScanTab"
        component={ScanStack}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Scan" focused={focused} /> }}
      />
      <Tab.Screen
        name="EarningsTab"
        component={EarningsStack}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Earnings" focused={focused} /> }}
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
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Captain Login' }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Captain Registration' }} />
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
