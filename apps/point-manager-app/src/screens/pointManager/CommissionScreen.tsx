import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { commissionsApi, formatCurrency, formatDate } from '@ve/mobile-shared';
import type { Commission } from '@ve/mobile-shared';

const THEME = '#FF9800';

export default function CommissionScreen() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [requestingPayout, setRequestingPayout] = useState(false);

  const load = async () => {
    try {
      const res = await commissionsApi.getMyCommissions({ pageSize: 100 });
      setCommissions(res.data?.items ?? []);
    } catch {
      Alert.alert('Error', 'Could not load commissions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const totalEarned = commissions.filter(c => c.status === 'PAID').reduce((s, c) => s + c.amount, 0);
  const totalPending = commissions.filter(c => c.status === 'PENDING').reduce((s, c) => s + c.amount, 0);

  const requestPayout = async () => {
    const amount = parseFloat(payoutAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Invalid', 'Please enter a valid amount');
      return;
    }
    if (amount > totalPending) {
      Alert.alert('Insufficient Balance', `Pending balance is only ${formatCurrency(totalPending)}`);
      return;
    }
    setRequestingPayout(true);
    try {
      await commissionsApi.requestPayout(amount);
      Alert.alert('Success', 'Payout request submitted successfully');
      setShowPayoutModal(false);
      setPayoutAmount('');
      load();
    } catch {
      Alert.alert('Error', 'Could not process payout request');
    } finally {
      setRequestingPayout(false);
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
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Total Earned</Text>
                  <Text style={[styles.summaryAmount, { color: THEME }]}>{formatCurrency(totalEarned)}</Text>
                </View>
                <View style={[styles.summaryItem, styles.divider]}>
                  <Text style={styles.summaryLabel}>Pending</Text>
                  <Text style={[styles.summaryAmount, { color: '#4CAF50' }]}>{formatCurrency(totalPending)}</Text>
                </View>
              </View>
              {totalPending > 0 && (
                <TouchableOpacity style={styles.payoutBtn} onPress={() => setShowPayoutModal(true)}>
                  <Text style={styles.payoutBtnText}>Request Payout</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.sectionTitle}>Commission History</Text>
          </>
        }
        data={commissions}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={styles.itemLeft}>
              <Text style={styles.itemBooking}>
                {item.booking?.bookingNumber ? `#${item.booking.bookingNumber}` : 'Booking'}
              </Text>
              {item.booking?.calculatedPrice && (
                <Text style={styles.itemBookingPrice}>Order: {formatCurrency(item.booking.calculatedPrice)}</Text>
              )}
              <Text style={styles.itemDate}>{formatDate(item.createdAt)}</Text>
            </View>
            <View style={styles.itemRight}>
              <Text style={styles.itemAmount}>{formatCurrency(item.amount)}</Text>
              <View style={[styles.itemBadge, { backgroundColor: item.status === 'PAID' ? '#e8f5e9' : '#fff8e1' }]}>
                <Text style={[styles.itemBadgeText, { color: item.status === 'PAID' ? '#4CAF50' : '#FF9800' }]}>
                  {item.status}
                </Text>
              </View>
            </View>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyTitle}>No Commissions</Text>
            <Text style={styles.emptyText}>Commissions from bookings will appear here</Text>
          </View>
        }
      />

      {/* Payout modal */}
      <Modal visible={showPayoutModal} transparent animationType="slide">
        <KeyboardAvoidingView style={modal.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={modal.box}>
            <Text style={modal.title}>Request Payout</Text>
            <Text style={modal.subtitle}>Available: {formatCurrency(totalPending)}</Text>
            <TextInput
              style={modal.input}
              placeholder="Enter amount"
              value={payoutAmount}
              onChangeText={setPayoutAmount}
              keyboardType="decimal-pad"
              autoFocus
            />
            <TouchableOpacity
              style={[modal.confirmBtn, requestingPayout && { opacity: 0.6 }]}
              onPress={requestPayout}
              disabled={requestingPayout}
            >
              {requestingPayout ? <ActivityIndicator color="#fff" /> : <Text style={modal.confirmText}>Confirm Payout</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={modal.cancelBtn} onPress={() => { setShowPayoutModal(false); setPayoutAmount(''); }}>
              <Text style={modal.cancelText}>Cancel</Text>
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
  summaryCard: { backgroundColor: '#fff', margin: 12, borderRadius: 12, overflow: 'hidden' },
  summaryRow: { flexDirection: 'row' },
  summaryItem: { flex: 1, alignItems: 'center', padding: 20 },
  divider: { borderLeftWidth: 1, borderLeftColor: '#f0f0f0' },
  summaryLabel: { fontSize: 13, color: '#888', marginBottom: 6 },
  summaryAmount: { fontSize: 24, fontWeight: 'bold' },
  payoutBtn: { backgroundColor: THEME, margin: 12, marginTop: 0, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  payoutBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', marginHorizontal: 12, marginBottom: 6 },
  listContent: { paddingBottom: 30 },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 12, marginBottom: 8, borderRadius: 10, padding: 14 },
  itemLeft: {},
  itemBooking: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 2 },
  itemBookingPrice: { fontSize: 12, color: '#888', marginBottom: 2 },
  itemDate: { fontSize: 12, color: '#999' },
  itemRight: { alignItems: 'flex-end' },
  itemAmount: { fontSize: 16, fontWeight: 'bold', color: THEME, marginBottom: 4 },
  itemBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  itemBadgeText: { fontSize: 11, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 6 },
  emptyText: { fontSize: 14, color: '#888' },
});

const modal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  box: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 20 },
  input: { borderWidth: 1.5, borderColor: THEME, borderRadius: 10, padding: 14, fontSize: 18, marginBottom: 16 },
  confirmBtn: { backgroundColor: THEME, borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginBottom: 10 },
  confirmText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  cancelBtn: { alignItems: 'center', paddingVertical: 10 },
  cancelText: { color: '#999', fontSize: 14 },
});
