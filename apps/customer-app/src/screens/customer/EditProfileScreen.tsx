import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, Alert, ActivityIndicator,
  TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { profileApi, isValidEmail, isValidIndianPhone } from '@ve/mobile-shared';

const THEME = '#4CAF50';

export default function EditProfileScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changePassword, setChangePassword] = useState(false);

  useEffect(() => {
    profileApi.getProfile().then(res => {
      const d = res.data;
      setName(d?.name ?? '');
      setPhone(d?.phone ?? '');
      setEmail(d?.email ?? '');
    }).catch(() => {
      Alert.alert('Error', 'Could not load profile');
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!name.trim() || name.trim().length < 2) { Alert.alert('Error', 'Name must be at least 2 characters'); return; }
    if (phone && !isValidIndianPhone(phone)) { Alert.alert('Error', 'Invalid phone number'); return; }
    if (email && !isValidEmail(email)) { Alert.alert('Error', 'Invalid email address'); return; }
    if (changePassword) {
      if (!currentPassword) { Alert.alert('Error', 'Enter your current password'); return; }
      if (newPassword.length < 8) { Alert.alert('Error', 'New password must be at least 8 characters'); return; }
      if (newPassword !== confirmNewPassword) { Alert.alert('Error', 'New passwords do not match'); return; }
    }

    setSaving(true);
    try {
      await profileApi.updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        ...(changePassword && { currentPassword, newPassword }),
      });
      Alert.alert('Saved', 'Profile updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error ?? 'Could not update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={THEME} /></View>;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Section title="Personal Information">
          <Field label="Full Name" value={name} onChangeText={setName} autoCapitalize="words" />
          <Field label="Phone Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={10} />
          <Field label="Email Address" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        </Section>

        <Section title="Change Password">
          <TouchableOpacity style={styles.toggleBtn} onPress={() => setChangePassword(v => !v)}>
            <Text style={styles.toggleBtnText}>{changePassword ? '✕ Cancel' : '🔑 Change Password'}</Text>
          </TouchableOpacity>
          {changePassword && (
            <>
              <Field label="Current Password" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry={!showPwd} />
              <Field label="New Password (min 8 chars)" value={newPassword} onChangeText={setNewPassword} secureTextEntry={!showPwd} />
              <Field label="Confirm New Password" value={confirmNewPassword} onChangeText={setConfirmNewPassword} secureTextEntry={!showPwd} />
              <TouchableOpacity style={styles.showPwdLink} onPress={() => setShowPwd(v => !v)}>
                <Text style={styles.showPwdText}>{showPwd ? 'Hide passwords' : 'Show passwords'}</Text>
              </TouchableOpacity>
            </>
          )}
        </Section>

        <TouchableOpacity style={[styles.saveBtn, saving && styles.disabled]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Section({ title, children }: any) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function Field({ label, ...props }: any) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} placeholderTextColor="#bbb" {...props} />
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#888', textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: '#f8f8f8', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, padding: 13, fontSize: 15 },
  toggleBtn: { backgroundColor: '#f0f0f0', borderRadius: 10, padding: 12, alignItems: 'center', marginBottom: 4 },
  toggleBtnText: { fontSize: 14, fontWeight: '600', color: THEME },
  showPwdLink: { marginTop: 8, alignItems: 'flex-end' },
  showPwdText: { fontSize: 13, color: THEME, fontWeight: '600' },
  saveBtn: { backgroundColor: THEME, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  disabled: { opacity: 0.6 },
});
