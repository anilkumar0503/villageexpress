import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Alert, ActivityIndicator,
  TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { authApi, isValidEmail, isValidIndianPhone } from '@ve/mobile-shared';

const THEME = '#FF9800';

export default function RegisterScreen({ navigation }: any) {
  const [step, setStep] = useState(1);

  // Step 1: personal info
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Step 2: shop + location
  const [shopName, setShopName] = useState('');
  const [pointName, setPointName] = useState('');
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  const [loading, setLoading] = useState(false);

  const validateStep1 = () => {
    if (!name.trim() || name.trim().length < 2) { Alert.alert('Error', 'Enter your full name (min 2 chars)'); return false; }
    if (!isValidEmail(email)) { Alert.alert('Error', 'Enter a valid email'); return false; }
    if (!isValidIndianPhone(phone)) { Alert.alert('Error', 'Enter a valid 10-digit phone number'); return false; }
    if (password.length < 8) { Alert.alert('Error', 'Password must be at least 8 characters'); return false; }
    if (password !== confirmPassword) { Alert.alert('Error', 'Passwords do not match'); return false; }
    return true;
  };

  const validateStep2 = () => {
    if (!shopName.trim() || shopName.trim().length < 2) { Alert.alert('Error', 'Enter your shop name'); return false; }
    if (!pointName.trim() || pointName.trim().length < 2) { Alert.alert('Error', 'Enter the point/pickup name'); return false; }
    if (!village.trim() || village.trim().length < 2) { Alert.alert('Error', 'Enter your village name'); return false; }
    if (!district.trim() || district.trim().length < 2) { Alert.alert('Error', 'Enter your district'); return false; }
    if (!state.trim() || state.trim().length < 2) { Alert.alert('Error', 'Enter your state'); return false; }
    if (!/^\d{6}$/.test(pincode)) { Alert.alert('Error', 'Enter a valid 6-digit pincode'); return false; }
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await authApi.registerPointManager({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone,
        password,
        shopName: shopName.trim(),
        location: {
          pointName: pointName.trim(),
          village: village.trim(),
          district: district.trim(),
          state: state.trim(),
          pincode,
        },
      });
      Alert.alert(
        'Application Submitted!',
        'Your registration is under admin review. You will be notified once approved.',
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
          <Text style={styles.logo}>🏪</Text>
          <Text style={styles.title}>Become a Point Manager</Text>
          <Text style={styles.subtitle}>Register your collection point</Text>
        </View>

        {/* Step indicator */}
        <View style={styles.stepRow}>
          {[1, 2, 3].map((s, i) => (
            <React.Fragment key={s}>
              <View style={[styles.stepCircle, step >= s && styles.stepActive]}>
                <Text style={styles.stepNum}>{s}</Text>
              </View>
              {i < 2 && <View style={[styles.stepLine, step > s && styles.stepLineDone]} />}
            </React.Fragment>
          ))}
        </View>
        <View style={styles.stepLabels}>
          <Text style={styles.stepLabel}>Personal</Text>
          <Text style={styles.stepLabel}>Shop</Text>
          <Text style={styles.stepLabel}>Review</Text>
        </View>

        {/* STEP 1 */}
        {step === 1 && (
          <View style={styles.form}>
            <Text style={styles.sectionTitle}>Personal Information</Text>

            <FieldInput label="Full Name" placeholder="Your full name" value={name} onChangeText={setName} autoCapitalize="words" loading={loading} />
            <FieldInput label="Email Address" placeholder="Your email address" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" loading={loading} />
            <FieldInput label="Phone Number" placeholder="10-digit mobile number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={10} loading={loading} />

            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} placeholder="Minimum 8 characters" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} editable={!loading} />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(v => !v)}>
                <Text>{showPassword ? '🙈' : '👁'}</Text>
              </TouchableOpacity>
            </View>
            <View style={{ height: 16 }} />
            <FieldInput label="Confirm Password" placeholder="Re-enter password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showPassword} loading={loading} />

            <TouchableOpacity style={styles.nextBtn} onPress={() => { if (validateStep1()) setStep(2); }}>
              <Text style={styles.nextBtnText}>Next: Shop Details →</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLinkText}>Already registered? <Text style={styles.loginLinkBold}>Login</Text></Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <View style={styles.form}>
            <Text style={styles.sectionTitle}>Shop & Location Details</Text>

            <FieldInput label="Shop / Business Name" placeholder="Your shop name" value={shopName} onChangeText={setShopName} autoCapitalize="words" loading={loading} />
            <FieldInput label="Point / Pickup Counter Name" placeholder="e.g. Main Bus Stand Counter" value={pointName} onChangeText={setPointName} autoCapitalize="words" loading={loading} />
            <FieldInput label="Village / Town" placeholder="Village or town name" value={village} onChangeText={setVillage} autoCapitalize="words" loading={loading} />
            <FieldInput label="District" placeholder="District name" value={district} onChangeText={setDistrict} autoCapitalize="words" loading={loading} />
            <FieldInput label="State" placeholder="State name" value={state} onChangeText={setState} autoCapitalize="words" loading={loading} />
            <FieldInput label="Pincode" placeholder="6-digit pincode" value={pincode} onChangeText={setPincode} keyboardType="number-pad" maxLength={6} loading={loading} />

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>📍 Your location will be activated by an admin after approval. Customers in your area will see your point for bookings.</Text>
            </View>

            <TouchableOpacity style={styles.nextBtn} onPress={() => { if (validateStep2()) setStep(3); }}>
              <Text style={styles.nextBtnText}>Next: Review →</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.backLink} onPress={() => setStep(1)}>
              <Text style={styles.backLinkText}>← Back</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 3: Review */}
        {step === 3 && (
          <View style={styles.form}>
            <Text style={styles.sectionTitle}>Review & Submit</Text>

            <Text style={styles.reviewSection}>Personal</Text>
            <View style={styles.reviewCard}>
              <ReviewRow label="Name" value={name} />
              <ReviewRow label="Email" value={email} />
              <ReviewRow label="Phone" value={phone} />
            </View>

            <Text style={styles.reviewSection}>Shop & Location</Text>
            <View style={styles.reviewCard}>
              <ReviewRow label="Shop Name" value={shopName} />
              <ReviewRow label="Point Name" value={pointName} />
              <ReviewRow label="Village" value={village} />
              <ReviewRow label="District" value={district} />
              <ReviewRow label="State" value={state} />
              <ReviewRow label="Pincode" value={pincode} />
            </View>

            <View style={[styles.infoBox, { backgroundColor: '#FFF8E1', borderColor: '#FFD54F' }]}>
              <Text style={styles.infoText}>⚠️ Your application will be reviewed by an admin. Approval may take 1-2 business days.</Text>
            </View>

            <Text style={styles.terms}>
              By submitting, you agree to our Terms of Service, Privacy Policy, and Point Manager Partner Agreement.
            </Text>

            <TouchableOpacity
              style={[styles.nextBtn, loading && styles.disabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.nextBtnText}>Submit Application</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.backLink} onPress={() => setStep(2)}>
              <Text style={styles.backLinkText}>← Edit Details</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function FieldInput({ label, loading, ...props }: any) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} editable={!loading} {...props} />
    </>
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
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  stepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 24, marginBottom: 4, paddingHorizontal: 40 },
  stepCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#ddd', alignItems: 'center', justifyContent: 'center' },
  stepActive: { backgroundColor: THEME },
  stepNum: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  stepLine: { flex: 1, height: 2, backgroundColor: '#ddd', marginHorizontal: 6 },
  stepLineDone: { backgroundColor: THEME },
  stepLabels: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 30, marginBottom: 8 },
  stepLabel: { fontSize: 11, color: '#888' },
  form: { padding: 24 },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14, fontSize: 15, marginBottom: 16 },
  passwordRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingRight: 12 },
  eyeBtn: { padding: 6 },
  infoBox: { backgroundColor: '#E3F2FD', borderWidth: 1, borderColor: '#BBDEFB', borderRadius: 10, padding: 14, marginBottom: 20 },
  infoText: { fontSize: 13, color: '#1565C0', lineHeight: 20 },
  nextBtn: { backgroundColor: THEME, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 16 },
  nextBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  disabled: { opacity: 0.6 },
  loginLink: { alignItems: 'center', marginBottom: 16 },
  loginLinkText: { fontSize: 14, color: '#666' },
  loginLinkBold: { color: THEME, fontWeight: 'bold' },
  backLink: { alignItems: 'center', paddingVertical: 8 },
  backLinkText: { fontSize: 14, color: THEME, fontWeight: '600' },
  reviewSection: { fontSize: 13, fontWeight: '700', color: '#888', textTransform: 'uppercase', marginBottom: 8, marginTop: 8 },
  reviewCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 16 },
  terms: { fontSize: 12, color: '#aaa', textAlign: 'center', lineHeight: 18, marginBottom: 20 },
});

const review = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  label: { fontSize: 13, color: '#888' },
  value: { fontSize: 13, color: '#333', fontWeight: '600', maxWidth: '55%', textAlign: 'right' },
});
