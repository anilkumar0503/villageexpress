import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { authApi } from '@ve/mobile-shared';

const THEME = '#4CAF50';

export default function ResetPasswordScreen({ navigation }: any) {
  const [token, setToken]                   = useState('');
  const [password, setPassword]             = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading]               = useState(false);
  const [success, setSuccess]               = useState(false);

  const handleReset = async () => {
    if (!token.trim()) { Alert.alert('Required', 'Paste the reset token from your email'); return; }
    if (password.length < 8) { Alert.alert('Too Short', 'Password must be at least 8 characters'); return; }
    if (password !== confirmPassword) { Alert.alert('Mismatch', 'Passwords do not match'); return; }
    setLoading(true);
    try {
      const res = await authApi.resetPassword(token.trim(), password);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => navigation.navigate('Login'), 2500);
      } else {
        Alert.alert('Failed', (res as any).error ?? 'Could not reset password');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error ?? 'Invalid or expired token');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View style={styles.center}>
        <Text style={styles.successIcon}>✅</Text>
        <Text style={styles.successTitle}>Password Reset!</Text>
        <Text style={styles.successText}>Redirecting to login…</Text>
        <ActivityIndicator color={THEME} style={{ marginTop: 16 }} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.iconWrap}><Text style={styles.icon}>🔐</Text></View>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          Check your email for the password reset link. Copy the token from the link and paste it below.
        </Text>

        {/* Token info box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            📧 Token is in the reset email link after{'\n'}
            <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 12 }}>
              …/reset-password?token=
            </Text>
            <Text style={styles.infoHighlight}>PASTE_THIS_PART</Text>
          </Text>
        </View>

        <Text style={styles.label}>Reset Token</Text>
        <TextInput
          style={styles.input}
          value={token}
          onChangeText={setToken}
          placeholder="Paste token from email link"
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor="#bbb"
        />

        <Text style={styles.label}>New Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="At least 8 characters"
          secureTextEntry
          placeholderTextColor="#bbb"
        />

        <Text style={styles.label}>Confirm Password</Text>
        <TextInput
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Repeat new password"
          secureTextEntry
          placeholderTextColor="#bbb"
        />

        <TouchableOpacity
          style={[styles.btn, loading && styles.disabled]}
          onPress={handleReset}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Reset Password</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.backLink} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.backLinkText}>← Back to Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, paddingBottom: 48 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  iconWrap: { alignItems: 'center', marginBottom: 16 },
  icon: { fontSize: 54 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 14, color: '#777', textAlign: 'center', lineHeight: 21, marginBottom: 24 },
  infoBox: { backgroundColor: '#E8F5E9', borderRadius: 10, padding: 14, marginBottom: 24, borderWidth: 1, borderColor: '#A5D6A7' },
  infoText: { fontSize: 13, color: '#2E7D32', lineHeight: 20 },
  infoHighlight: { fontWeight: 'bold', color: THEME },
  label: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 8, marginTop: 16 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 14, fontSize: 15, color: '#333', backgroundColor: '#f9f9f9' },
  btn: { backgroundColor: THEME, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 28 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  disabled: { opacity: 0.6 },
  backLink: { alignItems: 'center', marginTop: 20 },
  backLinkText: { color: THEME, fontSize: 14 },
  successIcon: { fontSize: 64, marginBottom: 16 },
  successTitle: { fontSize: 22, fontWeight: 'bold', color: '#2E7D32', marginBottom: 8 },
  successText: { fontSize: 15, color: '#666' },
});
