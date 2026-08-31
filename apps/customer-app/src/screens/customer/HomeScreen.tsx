import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useAuth, bookingsApi, walletApi, notificationsApi, formatCurrency } from '@ve/mobile-shared';

const THEME = '#4CAF50';

export default function HomeScreen({ navigation }: any) {
  // navigation prop used for bell icon
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, active: 0, delivered: 0 });
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = async () => {
    try {
      const [bookingsRes, walletRes, notifRes] = await Promise.all([
        bookingsApi.getMyBookings({ pageSize: 100 }),
        walletApi.getWalletBalance(),
        notificationsApi.getNotifications(),
      ]);
      setUnreadCount((notifRes.data ?? []).filter((n: any) => !n.read).length);
      const items = bookingsRes.data?.items ?? [];
      setStats({
        total: items.length,
        active: items.filter(b => ['CONFIRMED', 'RECEIVED_AT_POINT', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(b.status)).length,
        delivered: items.filter(b => b.status === 'DELIVERED').length,
      });
      setWalletBalance(walletRes.data?.balance ?? 0);
    } catch {
      // Silent fail — show zeros rather than error on home
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  return (
    <ScrollView
      style={styles.root}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[THEME]} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {firstName} 👋</Text>
          <Text style={styles.subGreeting}>Your trusted logistics partner</Text>
        </View>
        <View style={styles.headerRight}>
          {walletBalance !== null && (
            <TouchableOpacity style={styles.walletChip} onPress={() => navigation.navigate('WalletTab')}>
              <Text style={styles.walletChipLabel}>Wallet</Text>
              <Text style={styles.walletChipAmount}>{formatCurrency(walletBalance)}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.bellBtn} onPress={() => navigation.navigate('Notifications')}>
            <Text style={styles.bellIcon}>🔔</Text>
            {unreadCount > 0 && (
              <View style={styles.bellBadge}><Text style={styles.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text></View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats */}
      {loading ? (
        <View style={styles.statsRow}>
          <ActivityIndicator color={THEME} style={{ flex: 1, paddingVertical: 24 }} />
        </View>
      ) : (
        <View style={styles.statsRow}>
          <StatCard label="Total Bookings" value={stats.total} color="#2196F3" />
          <StatCard label="Active" value={stats.active} color="#FF9800" />
          <StatCard label="Delivered" value={stats.delivered} color={THEME} />
        </View>
      )}

      {/* Quick actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <ActionCard
            icon="📦"
            label="New Booking"
            sublabel="Send a parcel"
            color="#E8F5E9"
            onPress={() => navigation.navigate('BookingsTab', { screen: 'Booking' })}
          />
          <ActionCard
            icon="🔍"
            label="Track Parcel"
            sublabel="View your bookings"
            color="#E3F2FD"
            onPress={() => navigation.navigate('BookingsTab')}
          />
          <ActionCard
            icon="💰"
            label="My Wallet"
            sublabel="Balance & transactions"
            color="#FFF9C4"
            onPress={() => navigation.navigate('WalletTab')}
          />
          <ActionCard
            icon="🎧"
            label="Support"
            sublabel="Get help"
            color="#FCE4EC"
            onPress={() => navigation.navigate('ProfileTab', { screen: 'Support' })}
          />
        </View>
      </View>

      {/* Features */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Why Village Express?</Text>
        <View style={styles.featuresCard}>
          {[
            ['⚡', 'Fast & reliable delivery to your doorstep'],
            ['📍', 'Real-time parcel tracking'],
            ['💵', 'COD (Cash on Delivery) support'],
            ['🔒', 'Secure & insured shipments'],
            ['🛵', 'Village-to-village coverage'],
          ].map(([icon, text]) => (
            <View key={text} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{icon}</Text>
              <Text style={styles.featureText}>{text}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      <Text style={[styles.statNumber, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ActionCard({ icon, label, sublabel, color, onPress }: any) {
  return (
    <TouchableOpacity style={[styles.actionCard, { backgroundColor: color }]} onPress={onPress} activeOpacity={0.85}>
      <Text style={styles.actionIcon}>{icon}</Text>
      <Text style={styles.actionLabel}>{label}</Text>
      <Text style={styles.actionSublabel}>{sublabel}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: THEME, padding: 20, paddingTop: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  subGreeting: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  walletChip: { backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 12, padding: 10, alignItems: 'center', minWidth: 80 },
  walletChipLabel: { fontSize: 10, color: 'rgba(255,255,255,0.8)', marginBottom: 2 },
  walletChipAmount: { fontSize: 14, fontWeight: 'bold', color: '#fff' },
  bellBtn: { position: 'relative', padding: 6 },
  bellIcon: { fontSize: 22 },
  bellBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#f44336', borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  bellBadgeText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', marginHorizontal: 12, marginTop: 14, gap: 10 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center', borderTopWidth: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  statNumber: { fontSize: 26, fontWeight: 'bold', marginBottom: 4 },
  statLabel: { fontSize: 11, color: '#888', textAlign: 'center' },
  section: { marginHorizontal: 12, marginTop: 18, marginBottom: 4 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard: { width: '47%', borderRadius: 14, padding: 16 },
  actionIcon: { fontSize: 28, marginBottom: 8 },
  actionLabel: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  actionSublabel: { fontSize: 11, color: '#666' },
  featuresCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16 },
  featureRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  featureIcon: { fontSize: 20, marginRight: 12, width: 28 },
  featureText: { fontSize: 14, color: '#444', flex: 1 },
});
