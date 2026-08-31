import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator,
  Alert, TouchableOpacity, TextInput, Modal, ScrollView, Platform,
} from 'react-native';
import { walletApi, formatCurrency, formatDateTime, useAuth } from '@ve/mobile-shared';
import type { WalletTransaction } from '@ve/mobile-shared';

// Razorpay — installed via: npm install react-native-razorpay
// Needs native rebuild: npx expo run:android / npx expo run:ios
let RazorpayCheckout: any = null;
try {
  RazorpayCheckout = require('react-native-razorpay').default;
} catch {
  // Not linked yet — payment sheet will show order ID instead
}

const THEME = '#4CAF50';

// ─── Transaction type filter chips ───────────────────────────────────────────
const TX_TYPES = ['ALL', 'RECHARGE', 'BOOKING', 'REFUND', 'CASHBACK', 'COMMISSION', 'WITHDRAWAL'];
const TX_LABELS: Record<string, string> = {
  ALL: 'All',
  RECHARGE: '↓ Recharge',
  BOOKING: '📦 Booking',
  REFUND: '↩ Refund',
  CASHBACK: '🎁 Cashback',
  COMMISSION: '💼 Commission',
  WITHDRAWAL: '↑ Withdrawal',
};

function txMatchesFilter(tx: WalletTransaction, filter: string): boolean {
  if (filter === 'ALL') return true;
  const desc = (tx.description ?? '').toLowerCase();
  const ref = (tx.referenceType ?? '').toUpperCase();
  if (filter === 'RECHARGE')    return desc.includes('recharge') || desc.includes('top') || ref === 'RECHARGE';
  if (filter === 'BOOKING')     return desc.includes('booking') || desc.includes('payment') || ref === 'BOOKING';
  if (filter === 'REFUND')      return desc.includes('refund') || ref === 'REFUND';
  if (filter === 'CASHBACK')    return desc.includes('cashback') || desc.includes('referral');
  if (filter === 'COMMISSION')  return desc.includes('commission') || ref === 'COMMISSION_PAYOUT';
  if (filter === 'WITHDRAWAL')  return desc.includes('withdrawal') || ref === 'WITHDRAWAL';
  return true;
}

// ─── Preset recharge amounts ───────────────────────────────────────────────
const PRESET_AMOUNTS = [100, 200, 500, 1000, 2000];

// ─── Recharge Modal ───────────────────────────────────────────────────────────
function RechargeModal({ visible, onClose, onSuccess }: {
  visible: boolean; onClose: () => void; onSuccess: () => void;
}) {
  const [amount, setAmount] = useState(500);
  const [custom, setCustom] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const finalAmount = custom.trim() ? Number(custom) : amount;

  const handlePay = async () => {
    if (!finalAmount || finalAmount < 10) {
      Alert.alert('Invalid', 'Minimum recharge is ₹10');
      return;
    }
    setLoading(true);
    try {
      const res = await walletApi.createRechargeOrder(finalAmount);
      if (!res.success) {
        Alert.alert('Error', 'Could not create recharge order');
        return;
      }
      const { orderId, keyId } = res.data;

      // ── Native Razorpay sheet ─────────────────────────────────────────────
      if (RazorpayCheckout) {
        const options = {
          description: 'Village Express Wallet Recharge',
          currency: 'INR',
          key: keyId,
          amount: finalAmount * 100, // paise
          name: 'Village Express',
          order_id: orderId,
          prefill: {
            email: user?.email ?? '',
            contact: user?.phone ?? '',
            name: user?.name ?? '',
          },
          theme: { color: THEME },
        };
        try {
          const data = await RazorpayCheckout.open(options);
          // Verify on backend
          const verify = await walletApi.verifyRecharge({
            razorpayOrderId: data.razorpay_order_id,
            razorpayPaymentId: data.razorpay_payment_id,
            razorpaySignature: data.razorpay_signature,
          });
          if (verify.success) {
            Alert.alert('Recharge Successful!', `₹${finalAmount} added to your wallet.`);
            setCustom(''); setAmount(500);
            onSuccess();
            onClose();
          } else {
            Alert.alert('Verification Failed', 'Payment received but verification failed. Contact support with Order ID: ' + orderId);
          }
        } catch (payErr: any) {
          // User dismissed or payment failed
          if (payErr?.code !== 'PAYMENT_CANCELLED') {
            Alert.alert('Payment Failed', payErr?.description ?? 'Payment could not be completed.');
          }
        }
      } else {
        // Fallback: Razorpay not linked yet — show order ID
        Alert.alert(
          'Order Created',
          `Order ID: ${orderId}\n\nRazorpay native module is not linked yet. After running npx expo run:android/ios, the payment sheet will open automatically.`,
          [{ text: 'OK' }],
        );
      }
    } catch {
      Alert.alert('Error', 'Could not initiate recharge. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modal.overlay}>
        <View style={modal.sheet}>
          <View style={modal.handle} />
          <Text style={modal.title}>Add Money to Wallet</Text>

          <Text style={modal.label}>Select Amount</Text>
          <View style={modal.presets}>
            {PRESET_AMOUNTS.map(a => (
              <TouchableOpacity
                key={a}
                style={[modal.preset, amount === a && !custom && modal.presetActive]}
                onPress={() => { setAmount(a); setCustom(''); }}
              >
                <Text style={[modal.presetText, amount === a && !custom && modal.presetTextActive]}>
                  ₹{a}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={modal.label}>Or enter custom amount (₹)</Text>
          <TextInput
            style={modal.input}
            value={custom}
            onChangeText={setCustom}
            keyboardType="numeric"
            placeholder="e.g. 750"
            placeholderTextColor="#bbb"
          />

          <View style={modal.summaryRow}>
            <Text style={modal.summaryLabel}>You will add</Text>
            <Text style={modal.summaryAmount}>{formatCurrency(finalAmount)}</Text>
          </View>

          <TouchableOpacity style={[modal.btn, loading && modal.disabled]} onPress={handlePay} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={modal.btnText}>Pay {formatCurrency(finalAmount)}</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={modal.cancelBtn} onPress={onClose}>
            <Text style={modal.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Transaction Item ─────────────────────────────────────────────────────────
function TransactionItem({ tx }: { tx: WalletTransaction }) {
  const isCredit = tx.type === 'CREDIT';
  return (
    <View style={styles.txItem}>
      <View style={[styles.txIcon, { backgroundColor: isCredit ? '#e8f5e9' : '#ffebee' }]}>
        <Text style={styles.txIconText}>{isCredit ? '↓' : '↑'}</Text>
      </View>
      <View style={styles.txInfo}>
        <Text style={styles.txDesc}>{tx.description}</Text>
        <Text style={styles.txDate}>{formatDateTime(tx.createdAt)}</Text>
      </View>
      <Text style={[styles.txAmount, { color: isCredit ? THEME : '#f44336' }]}>
        {isCredit ? '+' : '-'}{formatCurrency(tx.amount)}
      </Text>
    </View>
  );
}

// ─── WalletScreen ─────────────────────────────────────────────────────────────
export default function WalletScreen() {
  const [balance, setBalance]         = useState(0);
  const [transactions, setTx]         = useState<WalletTransaction[]>([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [rechargeVisible, setRecharge] = useState(false);
  const [txFilter, setTxFilter]       = useState('ALL');

  const load = useCallback(async () => {
    try {
      const res = await walletApi.getWallet();
      setBalance(res.data?.balance ?? 0);
      setTx(res.data?.transactions ?? []);
    } catch {
      Alert.alert('Error', 'Could not load wallet information');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = transactions.filter(t => txMatchesFilter(t, txFilter));

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={THEME} /></View>;
  }

  return (
    <>
      <FlatList
        style={styles.root}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[THEME]} />}
        ListHeaderComponent={
          <>
            {/* Balance card */}
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Wallet Balance</Text>
              <Text style={styles.balanceAmount}>{formatCurrency(balance)}</Text>
              <TouchableOpacity style={styles.rechargeBtn} onPress={() => setRecharge(true)}>
                <Text style={styles.rechargeBtnText}>+ Add Money</Text>
              </TouchableOpacity>
            </View>

            {/* Quick stats */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {formatCurrency(transactions.filter(t => t.type === 'CREDIT').reduce((s, t) => s + t.amount, 0))}
                </Text>
                <Text style={styles.statLabel}>Total Credited</Text>
              </View>
              <View style={[styles.statBox, { borderLeftWidth: 1, borderLeftColor: '#eee' }]}>
                <Text style={[styles.statValue, { color: '#f44336' }]}>
                  {formatCurrency(transactions.filter(t => t.type === 'DEBIT').reduce((s, t) => s + t.amount, 0))}
                </Text>
                <Text style={styles.statLabel}>Total Spent</Text>
              </View>
            </View>

            {/* Type filter chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterWrap} contentContainerStyle={styles.filterContent}>
              {TX_TYPES.map(f => (
                <TouchableOpacity
                  key={f}
                  style={[styles.filterChip, txFilter === f && styles.filterChipActive]}
                  onPress={() => setTxFilter(f)}
                >
                  <Text style={[styles.filterChipText, txFilter === f && styles.filterChipTextActive]}>
                    {TX_LABELS[f]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.sectionTitle}>
              Transactions {txFilter !== 'ALL' && `(${TX_LABELS[txFilter]})`}
            </Text>
          </>
        }
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <TransactionItem tx={item} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💰</Text>
            <Text style={styles.emptyTitle}>No Transactions</Text>
            <Text style={styles.emptyText}>
              {txFilter !== 'ALL' ? `No "${TX_LABELS[txFilter]}" transactions yet` : 'Your transaction history will appear here'}
            </Text>
          </View>
        }
        contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : undefined}
      />

      <RechargeModal
        visible={rechargeVisible}
        onClose={() => setRecharge(false)}
        onSuccess={() => { setLoading(true); load(); }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  balanceCard: { backgroundColor: THEME, padding: 28, alignItems: 'center' },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 8 },
  balanceAmount: { color: '#fff', fontSize: 40, fontWeight: 'bold', marginBottom: 16 },
  rechargeBtn: { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 20, paddingHorizontal: 24, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' },
  rechargeBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  statsRow: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 12, marginTop: 12, borderRadius: 12, overflow: 'hidden' },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: THEME, marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#888' },
  filterWrap: { marginTop: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  filterContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f0f0f0' },
  filterChipActive: { backgroundColor: THEME },
  filterChipText: { fontSize: 12, color: '#666' },
  filterChipTextActive: { color: '#fff', fontWeight: 'bold' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginHorizontal: 16, marginTop: 20, marginBottom: 8 },
  txItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 14, marginHorizontal: 12, marginBottom: 8, borderRadius: 10 },
  txIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  txIconText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  txInfo: { flex: 1 },
  txDesc: { fontSize: 14, color: '#333', fontWeight: '500' },
  txDate: { fontSize: 12, color: '#999', marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: 'bold' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 6 },
  emptyText: { fontSize: 14, color: '#888', textAlign: 'center', paddingHorizontal: 32 },
  emptyContainer: { flexGrow: 1 },
});

const modal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 28 },
  handle: { width: 40, height: 4, backgroundColor: '#ddd', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 10 },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  preset: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#f9f9f9' },
  presetActive: { backgroundColor: THEME, borderColor: THEME },
  presetText: { fontSize: 15, color: '#555', fontWeight: '600' },
  presetTextActive: { color: '#fff' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 14, fontSize: 16, color: '#333', marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 12, padding: 16, marginBottom: 20 },
  summaryLabel: { fontSize: 14, color: '#666' },
  summaryAmount: { fontSize: 20, fontWeight: 'bold', color: THEME },
  btn: { backgroundColor: THEME, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 10 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  disabled: { opacity: 0.6 },
  cancelBtn: { alignItems: 'center', paddingVertical: 8 },
  cancelBtnText: { color: '#888', fontSize: 14 },
  successBox: { alignItems: 'center', paddingVertical: 16, marginBottom: 16 },
  successIcon: { fontSize: 48, marginBottom: 10 },
  successTitle: { fontSize: 20, fontWeight: 'bold', color: '#2E7D32', marginBottom: 8 },
  successText: { fontSize: 14, color: '#555', textAlign: 'center', lineHeight: 22 },
  detailBox: { backgroundColor: '#f5f5f5', borderRadius: 12, padding: 16, marginBottom: 20 },
  detailLabel: { fontSize: 12, color: '#888', marginBottom: 4 },
  detailValue: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  detailNote: { fontSize: 12, color: '#888', lineHeight: 18 },
  row: { flexDirection: 'row', gap: 10 },
});
