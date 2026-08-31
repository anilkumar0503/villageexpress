/**
 * Push Notification Service (expo-notifications + FCM)
 *
 * Setup steps for production:
 * 1. Android: Add google-services.json to apps/customer-app/android/app/
 * 2. iOS: Add GoogleService-Info.plist to apps/customer-app/ios/CustomerApp/
 * 3. Update app.json with:
 *      "plugins": [["expo-notifications", { "icon": "./assets/notification-icon.png" }]]
 * 4. Run: npx expo prebuild (bare workflow)
 * 5. FCM server key → stored in your backend .env as FCM_SERVER_KEY
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { profileApi } from '@ve/mobile-shared';

// Configure how notifications appear while app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const notificationService = {
  /**
   * Request permission and register device for push notifications.
   * Saves the Expo push token to the server via profileApi.
   */
  async registerForPushNotifications(): Promise<string | null> {
    try {
      const { status: existing } = await Notifications.getPermissionsAsync();
      let finalStatus = existing;

      if (existing !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('[Notifications] Permission not granted');
        return null;
      }

      // Get Expo push token (works without Firebase for Expo-managed push service)
      const tokenData = await Notifications.getExpoPushTokenAsync({
        // projectId is needed for bare workflow; set in app.json > extra > eas.projectId
        // projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });
      const token = tokenData.data;

      // Send token to backend
      try {
        await profileApi.updateFcmToken(token);
      } catch (err) {
        console.warn('[Notifications] Could not store push token on server:', err);
      }

      // Android channel setup
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Village Express',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#4CAF50',
        });
        await Notifications.setNotificationChannelAsync('orders', {
          name: 'Order Updates',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#2196F3',
        });
      }

      return token;
    } catch (err) {
      console.error('[Notifications] Registration failed:', err);
      return null;
    }
  },

  /**
   * Add a listener for notifications received while app is in foreground.
   * Returns an unsubscribe function — call it on component unmount.
   */
  addForegroundListener(
    onNotification: (notification: Notifications.Notification) => void,
  ): () => void {
    const sub = Notifications.addNotificationReceivedListener(onNotification);
    return () => sub.remove();
  },

  /**
   * Add a listener for when the user taps a notification.
   * Returns an unsubscribe function.
   */
  addResponseListener(
    onResponse: (response: Notifications.NotificationResponse) => void,
  ): () => void {
    const sub = Notifications.addNotificationResponseReceivedListener(onResponse);
    return () => sub.remove();
  },

  /**
   * Schedule a local notification (useful for testing or reminders).
   */
  async scheduleLocal(title: string, body: string, data?: Record<string, unknown>): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data: data ?? {} },
      trigger: null, // immediate
    });
  },

  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  },
};
