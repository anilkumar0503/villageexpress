import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BIOMETRIC_ENABLED_KEY = '@ve_biometric_enabled';

export type BiometricType = 'fingerprint' | 'facial' | 'iris' | 'none';

export const biometricService = {
  async isHardwareAvailable(): Promise<boolean> {
    try {
      return await LocalAuthentication.hasHardwareAsync();
    } catch {
      return false;
    }
  },

  async isEnrolled(): Promise<boolean> {
    try {
      return await LocalAuthentication.isEnrolledAsync();
    } catch {
      return false;
    }
  },

  async isAvailable(): Promise<boolean> {
    const [hw, enrolled] = await Promise.all([
      biometricService.isHardwareAvailable(),
      biometricService.isEnrolled(),
    ]);
    return hw && enrolled;
  },

  async isEnabled(): Promise<boolean> {
    try {
      const val = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
      return val === 'true';
    } catch {
      return false;
    }
  },

  async setEnabled(enabled: boolean): Promise<void> {
    await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, enabled ? 'true' : 'false');
  },

  async getBiometricType(): Promise<BiometricType> {
    try {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return 'facial';
      if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return 'fingerprint';
      if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) return 'iris';
    } catch {}
    return 'none';
  },

  async authenticate(promptMessage = 'Authenticate to continue'): Promise<boolean> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        fallbackLabel: 'Use PIN',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });
      return result.success;
    } catch {
      return false;
    }
  },
};
