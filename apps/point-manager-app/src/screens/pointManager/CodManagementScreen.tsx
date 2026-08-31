import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { codApi, formatCurrency, formatDate } from '@ve/mobile-shared';
import type { CodCollection, CodRemittance } from '@ve/mobile-shared';

const THEME = '#FF9800';

const TABS = [
  { label: 'Collections', value: 'collections' },
  { label: 'Remittances', value: 'remittances' },
];

function CollectionItem({ item }: { item: CodCollection }) {
  return (
    <View style={styles.item}>
      <View style={styles.itemLeft}>
        <Text style={styles.itemBooking}>
          {item.booking?.bookingNumber ? `#${item.booking.bookingNumber}` : 'Booking'}
        </Text>
        <Text style={styles.itemCustomer}>{item.booking?.customer.name ?? ''}</Text>
        {item.collectedAt && <Text style={styles.itemDate}>{formatDate(item.collectedAt)}</Text>}
      </View>
      <View style={styles.itemRight}>
        <Text style={styles.itemAmount}>{formatCurrency(item.amount)}</Text>
        <View style={[styles.itemBadge, { backgroundColor: item.status === 'REMITTED' ? '#e8f5e9' : '#fff8e1' }]}>
          <Text style={[styles.itemBadgeText, { color: item.status === 'REMITTED' ? '#4CAF50' : '#FF9800' }]}>
            {item.status}
          </Text>
        </View>
      </View>
    </View>
  );
}

function RemittanceItem({ item }: { item: CodRemittance }) {
  return (
    <View style={styles.item}>
      <View style={styles.itemLeft}>
        <Text style={styles.itemBooking}>{item.collections.length} collections</Text>
        <Text style={styles.itemDate}>{formatDate(item.createdAt)}</Text>
      </View>
      <View style={styles.itemRight}>
        <Text style={styles.itemAmount}>{formatCurrency(item.totalAmount)}</Text>
        <View style={[styles.itemBadge, { backgroundColor: item.status === 'VERIFIED' ? '#e8f5e9' : '#fff8e1' }]}>
          <Text style={[styles.itemBadgeText, { color: item.status === 'VERIFIED' ? '#4CAF50' : '#FF9800' }]}>
            {item.status}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function CodManagementScreen() {
  const [activeTab, setActiveTab] = useState('collections');
  const [collections, setCollections] = useState<CodCollection[]>([]);
  const [remittances, setRemittances] = useState<CodRemittance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creatingRemittance, setCreatingRemittance] = useState(false);

  const load = async () => {
    try {
      const [colRes, remRes] = await Promise.all([
        codApi.getCollections(),
        codApi.getRemittances(),
      ]);
      setCollections(colRes.data ?? []);
      setRemittances(remRes.data ?? []);
    } catch {
      Alert.alert('Error', 'Could not load COD data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const pendingCollections = collections.filter(c => c.status === 'PENDING');
  const pendingTotal = pendingCollections.reduce((s, c) => s + c.amount, 0);

  const createRemittance = () => {
    if (pendingCollections.length === 0) {
      Alert.alert('No Pending', 'There are no pending COD collections to remit');
      return;
    }
    Alert.alert(
      'Create Remittance',
      `Remit ${formatCurrency(pendingTotal)} from ${pendingCollections.length} collection(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setCreatingRemittance(true);
            try {
              await codApi.createRemittance(pendingCollections.map(c => c.id));
              Alert.alert('Success', 'Remittance created successfully');
              load();
            } catch {
              Alert.alert('Error', 'Could not create remittance');
            } finally {
              setCreatingRemittance(false);
            }
          },
        },
      ],
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={THEME} /></View>;

  const data = activeTab === 'collections' ? collections : remittances;

  return (
    <View style={styles.root}>
      {/* Summary */}
      {pendingCollections.length > 0 && (
        <View style={styles.summaryBar}>
          <View>
            <Text style={styles.summaryLabel}>Pending COD</Text>
            <Text style={styles.summaryAmount}>{formatCurrency(pendingTotal)}</Text>
          </View>
          <TouchableOpacity
            style={[styles.remitBtn, creatingRemittance && { opacity: 0.6 }]}
            onPress={createRemittance}
            disabled={creatingRemittance}
          >
            {creatingRemittance ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.remitBtnText}>Remit Now</Text>}
          </TouchableOpacity>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.value}
            style={[styles.tab, activeTab === t.value && styles.tabActive]}
            onPress={() => setActiveTab(t.value)}
          >
            <Text style={[styles.tabText, activeTab === t.value && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={data as any[]}
        keyExtractor={item => item.id}
        renderItem={({ item }) =>
          activeTab === 'collections'
            ? <CollectionItem item={item as CodCollection} />
            : <RemittanceItem item={item as CodRemittance} />
        }
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[THEME]} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💵</Text>
            <Text style={styles.emptyTitle}>No {activeTab === 'collections' ? 'Collections' : 'Remittances'}</Text>
            <Text style={styles.emptyText}>
              {activeTab === 'collections' ? 'COD collections will appear here' : 'Remittance history will appear here'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  summaryBar: { backgroundColor: THEME, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  summaryLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 4 },
  summaryAmount: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  remitBtn: { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  remitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', padding: 12, gap: 10 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 16, backgroundColor: '#f0f0f0', alignItems: 'center' },
  tabActive: { backgroundColor: THEME },
  tabText: { fontSize: 13, color: '#666', fontWeight: '500' },
  tabTextActive: { color: '#fff', fontWeight: '700' },
  list: { padding: 12, paddingBottom: 30 },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8 },
  itemLeft: {},
  itemBooking: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 2 },
  itemCustomer: { fontSize: 12, color: '#666', marginBottom: 2 },
  itemDate: { fontSize: 12, color: '#999' },
  itemRight: { alignItems: 'flex-end' },
  itemAmount: { fontSize: 16, fontWeight: 'bold', color: THEME, marginBottom: 4 },
  itemBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  itemBadgeText: { fontSize: 11, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 6 },
  emptyText: { fontSize: 14, color: '#888' },
});
