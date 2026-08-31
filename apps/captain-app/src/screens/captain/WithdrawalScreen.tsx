import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert,
  ActivityIndicator, RefreshControl, Modal, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { withdrawalsApi, commissionsApi, formatCurrency, formatDate } from '@ve/mobile-shared';
import type { Withdrawal } from '@ve/mobile-shared';

const THEME = '#2196F3';

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  PENDING:   { color: '#FF9800', bg: '#FFF8E1' },
  APPROVED:  { color: '#2196F3', bg: '#E3F2FD' },
  PROCESSED: { color: '#4CAF50', bg: '#E8F5E9' },
  REJECTED:  { color: '#F44336', bg: '#FFEBEE' },
};

export default function WithdrawalScreen() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [pendingBalance, setPendingBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const [wRes, cRes] = await Promise.all([
        withdrawalsApi.getWithdrawals(),
        commissionsApi.getMyCommissions({ pageSize: 200 }),
      ]);
      setWithdrawals(wRes.data ?? []);
      const pending = (cRes.data?.items ?? [])
        .filter((c: any) => c.status === 'PENDING')
        .reduce((s: number, c: any) => s + c.amount, 0);
      setPendingBalance(pending);
    } catch {
      Alert.alert('Error', 'Could not load withdrawal data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRequest = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { Alert.alert('Invalid', 'Enter a valid amount'); return; }
    if (amt > pendingBalance) { Alert.alert('Insufficient', `Pending balance is ${formatCurrency(pendingBalance)}`); return; }
    if (!bankAccount.trim()) { Alert.alert('Required', 'Enter your bank account number'); return; }
    if (!ifscCode.trim()) { Alert.alert('Required', 'Enter your IFSC code'); return; }
    if (!accountHolder.trim()) { Alert.alert('Required', 'Enter the account holder name'); return; }

    setSubmitting(true);
    try {
      await withdrawalsApi.requestWithdrawal({
        amount: amt,
        bankAccount: bankAccount.trim(),
        ifscCode: ifscCode.trim().toUpperCase(),
        accountHolder: accountHolder.trim(),
      });
      Alert.alert('Request Submitted', 'Your withdrawal request has been submitted. Funds will be credited within 2-3 business days.');
      setShowModal(false);
      setAmount(''); setBankAccount(''); setIfscCode(''); setAccountHolder('');
      load();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error ?? 'Request failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={THEME} /></View>;

  return (
    <>
      <FlatList
        style={styles.root}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[THEME]} />}
        ListHeaderComponent={
          <>
            {/* Balance card */}
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Available to Withdraw</Text>
              <Text style={styles.balanceAmount}>{formatCurrency(pendingBalance)}</Text>
              <Text style={styles.balanceHint}>Pending commission earnings</Text>
              {pendingBalance > 0 && (
                <TouchableOpacity style={styles.withdrawBtn} onPress={() => setShowModal(true)}>
                  <Text style={styles.withdrawBtnText}>Request Withdrawal</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.historyTitle}>Withdrawal History</Text>
          </>
        }
        data={withdrawals}
        keyExtractor={w => w.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const s = STATUS_STYLE[item.status] ?? { color: '#888', bg: '#f5f5f5' };
          return (
            <View style={styles.item}>
              <View style={styles.itemLeft}>
                <Text style={styles.itemAmount}>{formatCurrency(item.amount)}</Text>
                <Text style={styles.itemDate}>{formatDate(item.createdAt)}</Text>
                {item.note && <Text style={styles.itemNote}>{item.note}</Text>}
              </View>
              <View style={[styles.itemBadge, { backgroundColor: s.bg }]}>
                <Text style={[styles.itemBadgeText, { color: s.color }]}>{item.status}</Text>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💳</Text>
            <Text style={styles.emptyTitle}>No Withdrawals Yet</Text>
            <Text style={styles.emptyText}>Your withdrawal history will appear here</Text>
          </View>
        }
      />

      {/* Request modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <KeyboardAvoidingView style={modal.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={modal.box}>
            <View style={modal.header}>
              <Text style={modal.title}>Request Withdrawal</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}><Text style={modal.close}>✕</Text></TouchableOpacity>
            </View>

            <Text style={modal.available}>Available: {formatCurrency(pendingBalance)}</Text>

            <Text style={modal.label}>Amount (₹)</Text>
            <TextInput style={modal.input} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="Enter amount" autoFocus />

            <Text style={modal.label}>Account Holder Name</Text>
            <TextInput style={modal.input} value={accountHolder} onChangeText={setAccountHolder} autoCapitalize="words" placeholder="Name as per bank records" />

            <Text style={modal.label}>Bank Account Number</Text>
            <TextInput style={modal.input} value={bankAccount} onChangeText={setBankAccount} keyboardType="number-pad" placeholder="Account number" />

            <Text style={modal.label}>IFSC Code</Text>
            <TextInput style={modal.input} value={ifscCode} onChangeText={setIfscCode} autoCapitalize="characters" placeholder="e.g. SBIN0001234" />

            <TouchableOpacity
              style={[modal.submitBtn, submitting && modal.disabled]}
              onPress={handleRequest}
              disabled={submitting}
            >
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={modal.submitText}>Submit Request</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  balanceCard: { backgroundColor: THEME, margin: 14, borderRadius: 16, padding: 20, alignItems: 'center' },
  balanceLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 6 },
  balanceAmount: { fontSize: 36, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  balanceHint: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 16 },
  withdrawBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1.5, borderColor: '#fff', borderRadius: 12, paddingHorizontal: 28, paddingVertical: 12 },
  withdrawBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  historyTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', marginHorizontal: 14, marginBottom: 8 },
  list: { paddingHorizontal: 14, paddingBottom: 30 },
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10 },
  itemLeft: {},
  itemAmount: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  itemDate: { fontSize: 12, color: '#999' },
  itemNote: { fontSize: 12, color: '#888', marginTop: 2 },
  itemBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  itemBadgeText: { fontSize: 12, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 6 },
  emptyText: { fontSize: 14, color: '#888' },
});

const modal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  box: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  close: { fontSize: 20, color: '#888', padding: 4 },
  available: { fontSize: 13, color: '#888', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#f8f8f8', borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 13, fontSize: 15 },
  submitBtn: { backgroundColor: THEME, borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 24 },
  submitText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  disabled: { opacity: 0.6 },
});
