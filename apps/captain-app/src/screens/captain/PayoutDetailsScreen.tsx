import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, Alert, ActivityIndicator,
  TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { payoutDetailsApi } from '@ve/mobile-shared';
import type { PayoutType } from '@ve/mobile-shared';

const THEME = '#2196F3';

export default function PayoutDetailsScreen({ navigation }: any) {
  const [type, setType] = useState<PayoutType>('UPI');
  // UPI fields
  const [upiId, setUpiId]         = useState('');
  // Bank fields
  const [bankName, setBankName]           = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode]           = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');

  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [existing, setExisting] = useState(false);

  useEffect(() => {
    payoutDetailsApi.getPayoutDetails().then(res => {
      if (res.data) {
        setExisting(true);
        setType(res.data.type);
        setUpiId(res.data.upiId ?? '');
        setBankName(res.data.bankName ?? '');
        setAccountNumber(res.data.accountNumber ?? '');
        setIfscCode(res.data.ifscCode ?? '');
        setAccountHolderName(res.data.accountHolderName ?? '');
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (type === 'UPI') {
      if (!upiId.trim() || !upiId.includes('@')) { Alert.alert('Invalid', 'Enter a valid UPI ID (e.g. name@upi)'); return; }
    } else {
      if (!bankName.trim())          { Alert.alert('Required', 'Enter bank name'); return; }
      if (!accountNumber.trim())     { Alert.alert('Required', 'Enter account number'); return; }
      if (!ifscCode.trim())          { Alert.alert('Required', 'Enter IFSC code'); return; }
      if (!accountHolderName.trim()) { Alert.alert('Required', 'Enter account holder name'); return; }
    }

    setSaving(true);
    try {
      if (type === 'UPI') {
        await payoutDetailsApi.savePayoutDetails({ type: 'UPI', upiId: upiId.trim() });
      } else {
        await payoutDetailsApi.savePayoutDetails({
          type: 'BANK_TRANSFER',
          bankName: bankName.trim(),
          accountNumber: accountNumber.trim(),
          ifscCode: ifscCode.trim().toUpperCase(),
          accountHolderName: accountHolderName.trim(),
        });
      }
      Alert.alert('Saved', 'Payout details updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error ?? 'Could not save payout details');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={THEME} /></View>;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 {existing ? 'Update your' : 'Add your'} payout method. Withdrawals will be sent to this account within 2-3 business days.
          </Text>
        </View>

        {/* Type selector */}
        <Text style={styles.sectionTitle}>Payment Method</Text>
        <View style={styles.typeRow}>
          <TouchableOpacity style={[styles.typeChip, type === 'UPI' && styles.typeChipSelected]} onPress={() => setType('UPI')}>
            <Text style={styles.typeChipIcon}>📱</Text>
            <Text style={[styles.typeChipText, type === 'UPI' && styles.typeChipTextSelected]}>UPI</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.typeChip, type === 'BANK_TRANSFER' && styles.typeChipSelected]} onPress={() => setType('BANK_TRANSFER')}>
            <Text style={styles.typeChipIcon}>🏦</Text>
            <Text style={[styles.typeChipText, type === 'BANK_TRANSFER' && styles.typeChipTextSelected]}>Bank Transfer</Text>
          </TouchableOpacity>
        </View>

        {/* UPI fields */}
        {type === 'UPI' && (
          <View style={styles.card}>
            <Field label="UPI ID" value={upiId} onChangeText={setUpiId} autoCapitalize="none" keyboardType="email-address" placeholder="yourname@upi" />
            <Text style={styles.hint}>e.g. 9876543210@ybl, yourname@oksbi</Text>
          </View>
        )}

        {/* Bank Transfer fields */}
        {type === 'BANK_TRANSFER' && (
          <View style={styles.card}>
            <Field label="Account Holder Name" value={accountHolderName} onChangeText={setAccountHolderName} autoCapitalize="words" placeholder="Name as per bank records" />
            <Field label="Bank Name" value={bankName} onChangeText={setBankName} autoCapitalize="words" placeholder="e.g. State Bank of India" />
            <Field label="Account Number" value={accountNumber} onChangeText={setAccountNumber} keyboardType="number-pad" placeholder="Bank account number" />
            <Field label="IFSC Code" value={ifscCode} onChangeText={setIfscCode} autoCapitalize="characters" placeholder="e.g. SBIN0001234" />
          </View>
        )}

        <TouchableOpacity style={[styles.saveBtn, saving && styles.disabled]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{existing ? 'Update' : 'Save'} Payout Details</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, hint, ...props }: any) {
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
  infoBox: { backgroundColor: '#E3F2FD', borderWidth: 1, borderColor: '#BBDEFB', borderRadius: 12, padding: 14, marginBottom: 20 },
  infoText: { fontSize: 13, color: '#1565C0', lineHeight: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#888', textTransform: 'uppercase', marginBottom: 12 },
  typeRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  typeChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#ddd', backgroundColor: '#fff' },
  typeChipSelected: { backgroundColor: THEME, borderColor: THEME },
  typeChipIcon: { fontSize: 20 },
  typeChipText: { fontSize: 14, fontWeight: '600', color: '#555' },
  typeChipTextSelected: { color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#f8f8f8', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, padding: 13, fontSize: 15 },
  hint: { fontSize: 11, color: '#aaa', marginTop: 6 },
  saveBtn: { backgroundColor: THEME, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  disabled: { opacity: 0.6 },
});
