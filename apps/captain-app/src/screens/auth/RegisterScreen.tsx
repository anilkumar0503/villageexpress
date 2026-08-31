import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Alert, ActivityIndicator,
  TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { authApi, isValidEmail, isValidIndianPhone } from '@ve/mobile-shared';

const THEME = '#2196F3';

// 2-step: Step 1 = basic info, Step 2 = review + submit
export default function RegisterScreen({ navigation }: any) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateStep1 = () => {
    if (!name.trim() || name.trim().length < 2) {
      Alert.alert('Error', 'Please enter your full name (min 2 characters)'); return false;
    }
    if (!isValidEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address'); return false;
    }
    if (!isValidIndianPhone(phone)) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number'); return false;
    }
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters'); return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match'); return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await authApi.registerCaptain({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone,
        password,
      });
      Alert.alert(
        'Registration Submitted!',
        'Your application is under review. You will be notified once approved. Please complete your KYC after approval.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }],
      );
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? 'Registration failed. Please try again.';
      Alert.alert('Registration Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>🏍</Text>
          <Text style={styles.title}>Become a Captain</Text>
          <Text style={styles.subtitle}>Join Village Express delivery team</Text>
        </View>

        {/* Step indicator */}
        <View style={styles.stepRow}>
          <View style={[styles.stepCircle, styles.stepActive]}><Text style={styles.stepNum}>1</Text></View>
          <View style={[styles.stepLine, step >= 2 && styles.stepLineDone]} />
          <View style={[styles.stepCircle, step >= 2 && styles.stepActive]}><Text style={styles.stepNum}>2</Text></View>
        </View>
        <View style={styles.stepLabels}>
          <Text style={styles.stepLabel}>Basic Info</Text>
          <Text style={styles.stepLabel}>Review & Submit</Text>
        </View>

        {/* STEP 1 */}
        {step === 1 && (
          <View style={styles.form}>
            <Text style={styles.sectionTitle}>Personal Information</Text>

            <Text style={styles.label}>Full Name</Text>
            <TextInput style={styles.input} placeholder="Enter your full name" value={name} onChangeText={setName} autoCapitalize="words" editable={!loading} />

            <Text style={styles.label}>Email Address</Text>
            <TextInput style={styles.input} placeholder="Enter your email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" editable={!loading} />

            <Text style={styles.label}>Phone Number</Text>
            <TextInput style={styles.input} placeholder="10-digit mobile number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={10} editable={!loading} />

            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} placeholder="Minimum 8 characters" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} editable={!loading} />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(v => !v)}>
                <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁'}</Text>
              </TouchableOpacity>
            </View>
            <View style={{ height: 16 }} />

            <Text style={styles.label}>Confirm Password</Text>
            <TextInput style={styles.input} placeholder="Re-enter password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showPassword} editable={!loading} />

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>📋 After registration, you will need to complete KYC (Aadhaar + Driving Licence) through the admin portal before you can accept deliveries.</Text>
            </View>

            <TouchableOpacity style={styles.nextBtn} onPress={() => { if (validateStep1()) setStep(2); }}>
              <Text style={styles.nextBtnText}>Next →</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLinkText}>Already have an account? <Text style={styles.loginLinkBold}>Login</Text></Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 2: Review */}
        {step === 2 && (
          <View style={styles.form}>
            <Text style={styles.sectionTitle}>Review Your Details</Text>

            <View style={styles.reviewCard}>
              <ReviewRow label="Full Name" value={name} />
              <ReviewRow label="Email" value={email} />
              <ReviewRow label="Phone" value={phone} />
              <ReviewRow label="Password" value="••••••••" />
            </View>

            <View style={[styles.infoBox, { backgroundColor: '#FFF8E1', borderColor: '#FFD54F' }]}>
              <Text style={styles.infoText}>⚠️ Your account will be pending admin approval. You will receive a notification once approved.</Text>
            </View>

            <Text style={styles.terms}>
              By submitting, you agree to our Terms of Service, Privacy Policy, and Captain Partner Agreement.
            </Text>

            <TouchableOpacity
              style={[styles.nextBtn, loading && styles.disabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.nextBtnText}>Submit Application</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.backLink} onPress={() => setStep(1)}>
              <Text style={styles.backLinkText}>← Go Back</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={review.row}>
      <Text style={review.label}>{label}</Text>
      <Text style={review.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { paddingBottom: 40 },
  header: { backgroundColor: THEME, padding: 30, paddingTop: 50, alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  logo: { fontSize: 40, marginBottom: 8 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  stepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 24, marginBottom: 4, paddingHorizontal: 60 },
  stepCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#ddd', alignItems: 'center', justifyContent: 'center' },
  stepActive: { backgroundColor: THEME },
  stepNum: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  stepLine: { flex: 1, height: 2, backgroundColor: '#ddd', marginHorizontal: 8 },
  stepLineDone: { backgroundColor: THEME },
  stepLabels: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 40, marginBottom: 8 },
  stepLabel: { fontSize: 11, color: '#888' },
  form: { padding: 24 },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14, fontSize: 15, marginBottom: 16 },
  passwordRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingRight: 12 },
  eyeBtn: { padding: 4 },
  eyeText: { fontSize: 18 },
  infoBox: { backgroundColor: '#E3F2FD', borderWidth: 1, borderColor: '#BBDEFB', borderRadius: 10, padding: 14, marginBottom: 20 },
  infoText: { fontSize: 13, color: '#1565C0', lineHeight: 20 },
  nextBtn: { backgroundColor: THEME, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 16 },
  nextBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  disabled: { opacity: 0.6 },
  loginLink: { alignItems: 'center', marginBottom: 16 },
  loginLinkText: { fontSize: 14, color: '#666' },
  loginLinkBold: { color: THEME, fontWeight: 'bold' },
  reviewCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 },
  terms: { fontSize: 12, color: '#aaa', textAlign: 'center', lineHeight: 18, marginBottom: 20 },
  backLink: { alignItems: 'center', paddingVertical: 8 },
  backLinkText: { fontSize: 14, color: THEME, fontWeight: '600' },
});

const review = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  label: { fontSize: 13, color: '#888' },
  value: { fontSize: 13, color: '#333', fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
});
