import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, StyleSheet, Alert, ActivityIndicator,
  TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useAuth, isValidEmail, authApi } from '@ve/mobile-shared';
import { biometricService } from '../../utils/biometric';

const THEME = '#4CAF50';

type LoginTab = 'email' | 'otp';
type OtpStep = 'phone' | 'verify';

export default function LoginScreen({ navigation }: any) {
  // Email login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // OTP login
  const [tab, setTab] = useState<LoginTab>('email');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpStep, setOtpStep] = useState<OtpStep>('phone');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  // Biometric
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState<'fingerprint' | 'facial' | 'iris' | 'none'>('none');
  // Common
  const [isLoading, setIsLoading] = useState(false);
  const { login, refreshUser } = useAuth();

  // Init biometric state
  useEffect(() => {
    (async () => {
      const [avail, enabled, type] = await Promise.all([
        biometricService.isAvailable(),
        biometricService.isEnabled(),
        biometricService.getBiometricType(),
      ]);
      setBiometricAvailable(avail);
      setBiometricEnabled(enabled);
      setBiometricType(type);
    })();
  }, []);

  // OTP countdown timer
  useEffect(() => {
    if (otpCountdown <= 0) return;
    const t = setTimeout(() => setOtpCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [otpCountdown]);

  // ── Email Login ──────────────────────────────────────────────────────────
  const handleEmailLogin = async () => {
    if (!email.trim()) return Alert.alert('Error', 'Please enter your email');
    if (!isValidEmail(email)) return Alert.alert('Error', 'Please enter a valid email address');
    if (password.length < 6) return Alert.alert('Error', 'Password must be at least 6 characters');

    setIsLoading(true);
    try {
      await login(email.trim(), password);
      // Offer to enable biometric after first login
      if (biometricAvailable && !biometricEnabled) {
        const type = biometricType === 'facial' ? 'Face ID' : 'Fingerprint';
        Alert.alert(
          `Enable ${type}?`,
          `Use ${type} to log in faster next time.`,
          [
            { text: 'Not now', style: 'cancel' },
            { text: 'Enable', onPress: () => biometricService.setEnabled(true) },
          ],
        );
      }
    } catch (err: any) {
      Alert.alert('Login Failed', err.response?.data?.error ?? err.message ?? 'Please check your credentials');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Biometric Login ──────────────────────────────────────────────────────
  const handleBiometricLogin = useCallback(async () => {
    const label = biometricType === 'facial' ? 'Face ID' : 'Fingerprint';
    const success = await biometricService.authenticate(`Authenticate with ${label} to log in`);
    if (!success) return;
    setIsLoading(true);
    try {
      await refreshUser();
    } catch {
      Alert.alert('Session Expired', 'Please log in with your email and password.');
      await biometricService.setEnabled(false);
      setBiometricEnabled(false);
    } finally {
      setIsLoading(false);
    }
  }, [biometricType, refreshUser]);

  // ── OTP Login ────────────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 10) return Alert.alert('Error', 'Enter a valid 10-digit phone number');
    setSendingOtp(true);
    try {
      await authApi.sendOtp({ phone: cleaned });
      setOtpStep('verify');
      setOtpCountdown(60);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error ?? 'Could not send OTP');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) return Alert.alert('Error', 'Enter the 6-digit OTP sent to your phone');
    setIsLoading(true);
    try {
      const res = await authApi.verifyOtp({ phone: phone.replace(/\D/g, ''), otp });
      if (res.success) {
        await refreshUser();
      }
    } catch (err: any) {
      Alert.alert('Invalid OTP', err?.response?.data?.error ?? 'The OTP is incorrect or expired');
    } finally {
      setIsLoading(false);
    }
  };

  const biometricIcon = biometricType === 'facial' ? '👤' : '👆';
  const biometricLabel = biometricType === 'facial' ? 'Face ID' : 'Fingerprint';
  const showBiometric = biometricAvailable && biometricEnabled;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.root} keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Village Express</Text>
          <Text style={styles.subtitle}>Customer Login</Text>
        </View>

        <View style={styles.form}>
          {/* Tab switcher */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tab, tab === 'email' && styles.tabActive]}
              onPress={() => setTab('email')}
            >
              <Text style={[styles.tabText, tab === 'email' && styles.tabTextActive]}>Email</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, tab === 'otp' && styles.tabActive]}
              onPress={() => setTab('otp')}
            >
              <Text style={[styles.tabText, tab === 'otp' && styles.tabTextActive]}>Phone OTP</Text>
            </TouchableOpacity>
          </View>

          {/* Email Login */}
          {tab === 'email' && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
                editable={!isLoading}
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCorrect={false}
                editable={!isLoading}
              />
              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotBtn}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryBtn, isLoading && styles.disabled]}
                onPress={handleEmailLogin}
                disabled={isLoading}
              >
                {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Login</Text>}
              </TouchableOpacity>

              {/* Biometric button */}
              {showBiometric && !isLoading && (
                <TouchableOpacity style={styles.biometricBtn} onPress={handleBiometricLogin}>
                  <Text style={styles.biometricIcon}>{biometricIcon}</Text>
                  <Text style={styles.biometricText}>Login with {biometricLabel}</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {/* OTP Login */}
          {tab === 'otp' && (
            <>
              {otpStep === 'phone' ? (
                <>
                  <Text style={styles.otpHint}>We'll send a 6-digit OTP to your registered mobile number.</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Mobile Number (10 digits)"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    maxLength={10}
                    editable={!sendingOtp}
                  />
                  <TouchableOpacity
                    style={[styles.primaryBtn, sendingOtp && styles.disabled]}
                    onPress={handleSendOtp}
                    disabled={sendingOtp}
                  >
                    {sendingOtp ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Send OTP</Text>}
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.otpHint}>OTP sent to +91-{phone}. Enter the 6-digit code below.</Text>
                  <TextInput
                    style={[styles.input, styles.otpInput]}
                    placeholder="_ _ _ _ _ _"
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus
                  />
                  <TouchableOpacity
                    style={[styles.primaryBtn, isLoading && styles.disabled]}
                    onPress={handleVerifyOtp}
                    disabled={isLoading}
                  >
                    {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Verify OTP</Text>}
                  </TouchableOpacity>
                  <View style={styles.resendRow}>
                    {otpCountdown > 0 ? (
                      <Text style={styles.resendCountdown}>Resend OTP in {otpCountdown}s</Text>
                    ) : (
                      <TouchableOpacity onPress={() => { setOtp(''); handleSendOtp(); }}>
                        <Text style={styles.resendLink}>Resend OTP</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => { setOtpStep('phone'); setOtp(''); }}>
                      <Text style={styles.changePhone}>Change Number</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </>
          )}

          <TouchableOpacity style={styles.registerRow} onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerText}>Don't have an account? <Text style={styles.registerLink}>Register</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: THEME, padding: 30, paddingTop: 60, alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 5 },
  subtitle: { fontSize: 16, color: '#fff', opacity: 0.9 },
  form: { flex: 1, padding: 24 },
  tabRow: { flexDirection: 'row', backgroundColor: '#ebebeb', borderRadius: 12, padding: 4, marginBottom: 20, marginTop: 8 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 14, fontWeight: '600', color: '#888' },
  tabTextActive: { color: THEME },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 16, marginBottom: 16, fontSize: 16, elevation: 2 },
  otpInput: { textAlign: 'center', fontSize: 24, letterSpacing: 10, fontWeight: 'bold' },
  otpHint: { fontSize: 13, color: '#666', lineHeight: 20, marginBottom: 16, textAlign: 'center' },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 20 },
  forgotText: { color: THEME, fontSize: 14, fontWeight: '600' },
  primaryBtn: { backgroundColor: THEME, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 12 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  disabled: { opacity: 0.6 },
  biometricBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, borderWidth: 1.5, borderColor: THEME, borderRadius: 12, marginBottom: 12 },
  biometricIcon: { fontSize: 22 },
  biometricText: { color: THEME, fontSize: 15, fontWeight: '600' },
  resendRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, marginBottom: 16 },
  resendCountdown: { color: '#888', fontSize: 13 },
  resendLink: { color: THEME, fontSize: 13, fontWeight: '600' },
  changePhone: { color: '#888', fontSize: 13, textDecorationLine: 'underline' },
  registerRow: { alignItems: 'center', marginTop: 16 },
  registerText: { fontSize: 15, color: '#666' },
  registerLink: { color: THEME, fontWeight: 'bold' },
});
