import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { commissionsApi, formatCurrency, formatDate } from '@ve/mobile-shared';
import type { Commission } from '@ve/mobile-shared';

const THEME = '#2196F3';

const PERIOD_TABS = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Paid', value: 'PAID' },
];

function CommissionItem({ item }: { item: Commission }) {
  return (
    <View style={styles.item}>
      <View style={styles.itemLeft}>
        <Text style={styles.itemBooking}>
          {item.booking?.bookingNumber ? `#${item.booking.bookingNumber}` : `Booking`}
        </Text>
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
  );
}

export default function EarningsScreen() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const load = async () => {
    try {
      const res = await commissionsApi.getMyCommissions({ pageSize: 100 });
      setCommissions(res.data?.items ?? []);
    } catch {
      Alert.alert('Error', 'Could not load earnings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = activeTab === 'all' ? commissions : commissions.filter(c => c.status === activeTab);

  const totalEarned = commissions.filter(c => c.status === 'PAID').reduce((s, c) => s + c.amount, 0);
  const totalPending = commissions.filter(c => c.status === 'PENDING').reduce((s, c) => s + c.amount, 0);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={THEME} /></View>;

  return (
    <FlatList
      style={styles.root}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[THEME]} />}
      ListHeaderComponent={
        <>
          {/* Summary */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Earned</Text>
              <Text style={[styles.summaryAmount, { color: THEME }]}>{formatCurrency(totalEarned)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Pending</Text>
              <Text style={[styles.summaryAmount, { color: '#FF9800' }]}>{formatCurrency(totalPending)}</Text>
            </View>
          </View>

          {/* Filter tabs */}
          <View style={styles.tabBar}>
            {PERIOD_TABS.map(t => (
              <TouchableOpacity
                key={t.value}
                style={[styles.tab, activeTab === t.value && styles.tabActive]}
                onPress={() => setActiveTab(t.value)}
              >
                <Text style={[styles.tabText, activeTab === t.value && styles.tabTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Commission History</Text>
        </>
      }
      data={filtered}
      keyExtractor={item => item.id}
      renderItem={({ item }) => <CommissionItem item={item} />}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>💵</Text>
          <Text style={styles.emptyTitle}>No Earnings Yet</Text>
          <Text style={styles.emptyText}>Complete deliveries to earn commissions</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  summaryCard: { backgroundColor: THEME, flexDirection: 'row', padding: 20, paddingVertical: 28 },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 6 },
  summaryAmount: { color: '#fff', fontSize: 26, fontWeight: 'bold' },
  divider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)', marginVertical: 4 },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', padding: 12, gap: 8 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 16, backgroundColor: '#f0f0f0', alignItems: 'center' },
  tabActive: { backgroundColor: THEME },
  tabText: { fontSize: 13, color: '#666', fontWeight: '500' },
  tabTextActive: { color: '#fff', fontWeight: '700' },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', marginHorizontal: 12, marginTop: 16, marginBottom: 6 },
  listContent: { paddingBottom: 30 },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 12, marginBottom: 8, borderRadius: 10, padding: 14 },
  itemLeft: {},
  itemBooking: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 4 },
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
