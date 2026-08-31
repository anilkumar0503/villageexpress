import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Alert, ActivityIndicator,
  TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { authApi, isValidEmail } from '@ve/mobile-shared';

const THEME = '#4CAF50';

export default function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!isValidEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    setLoading(true);
    try {
      await authApi.requestPasswordReset(email.trim().toLowerCase());
      setSent(true);
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? 'Could not send reset email. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>🔑</Text>
          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.subtitle}>We'll send a reset link to your email</Text>
        </View>

        <View style={styles.form}>
          {sent ? (
            <View style={styles.successBox}>
              <Text style={styles.successIcon}>✅</Text>
              <Text style={styles.successTitle}>Email Sent!</Text>
              <Text style={styles.successText}>
                A password reset link has been sent to{'\n'}
                <Text style={{ fontWeight: 'bold' }}>{email}</Text>
              </Text>
              <Text style={styles.successHint}>
                Check your inbox and follow the instructions. The link expires in 15 minutes.
              </Text>
              <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('ResetPassword')}>
                <Text style={styles.backBtnText}>Enter Reset Token</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.loginLink, { marginTop: 14 }]} onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLinkText}>← Back to Login</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.description}>
                Enter your registered email address and we'll send you a link to reset your password.
              </Text>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
                autoFocus
              />
              <TouchableOpacity
                style={[styles.sendBtn, loading && styles.disabled]}
                onPress={handleSend}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendBtnText}>Send Reset Link</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLinkText}>← Back to Login</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { paddingBottom: 40 },
  header: { backgroundColor: THEME, padding: 30, paddingTop: 60, alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  logo: { fontSize: 48, marginBottom: 10 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  form: { padding: 24, paddingTop: 32 },
  description: { fontSize: 14, color: '#666', lineHeight: 22, marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14, fontSize: 15, marginBottom: 20 },
  sendBtn: { backgroundColor: THEME, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 16 },
  sendBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  disabled: { opacity: 0.6 },
  loginLink: { alignItems: 'center' },
  loginLinkText: { color: THEME, fontWeight: '600', fontSize: 14 },
  successBox: { alignItems: 'center', padding: 10 },
  successIcon: { fontSize: 56, marginBottom: 16 },
  successTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  successText: { fontSize: 14, color: '#555', textAlign: 'center', lineHeight: 22, marginBottom: 12 },
  successHint: { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 20, marginBottom: 32 },
  backBtn: { backgroundColor: THEME, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 40, alignItems: 'center' },
  backBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
