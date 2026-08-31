import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { profileApi, bookingsApi, notificationsApi, formatCurrency, getStatusColor, getStatusLabel } from '@ve/mobile-shared';
import type { Booking } from '@ve/mobile-shared';

const THEME = '#FF9800';

export default function HomeScreen({ navigation }: any) {
  const [profile, setProfile] = useState<any>(null);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = async () => {
    try {
      const [profileRes, bookingsRes, notifRes] = await Promise.all([
        profileApi.getProfile(),
        bookingsApi.getPointManagerBookings({ pageSize: 5 }),
        notificationsApi.getNotifications(),
      ]);
      setProfile(profileRes.data);
      setRecentBookings(bookingsRes.data?.items ?? []);
      setUnreadCount((notifRes.data ?? []).filter((n: any) => !n.read).length);
    } catch {
      Alert.alert('Error', 'Could not load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const pendingCount = recentBookings.filter(b => ['PENDING', 'CONFIRMED'].includes(b.status)).length;
  const activeCount = recentBookings.filter(b => ['RECEIVED_AT_POINT', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(b.status)).length;
  const deliveredCount = recentBookings.filter(b => b.status === 'DELIVERED').length;

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={THEME} /></View>;

  return (
    <ScrollView
      style={styles.root}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[THEME]} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Hello, {profile?.name?.split(' ')[0] ?? 'Manager'} 👋</Text>
          <Text style={styles.subGreeting}>Point Manager · {profile?.displayId ?? ''}</Text>
        </View>
        <TouchableOpacity style={styles.bellBtn} onPress={() => navigation.navigate('Notifications')}>
          <Text style={styles.bellIcon}>🔔</Text>
          {unreadCount > 0 && (
            <View style={styles.bellBadge}><Text style={styles.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text></View>
          )}
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#FF9800' }]}>{pendingCount}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#2196F3' }]}>{activeCount}</Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#4CAF50' }]}>{deliveredCount}</Text>
          <Text style={styles.statLabel}>Delivered</Text>
        </View>
      </View>

      {/* Quick actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('BookingsTab')}>
            <Text style={styles.actionIcon}>📦</Text>
            <Text style={styles.actionLabel}>Location Bookings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('CodTab')}>
            <Text style={styles.actionIcon}>💵</Text>
            <Text style={styles.actionLabel}>COD Management</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('HomeMain', { screen: 'Commission' })}>
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionLabel}>My Commission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('ProfileTab')}>
            <Text style={styles.actionIcon}>👤</Text>
            <Text style={styles.actionLabel}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent bookings */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Bookings</Text>
          <TouchableOpacity onPress={() => navigation.navigate('BookingsTab')}>
            <Text style={styles.seeAll}>See All →</Text>
          </TouchableOpacity>
        </View>
        {recentBookings.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No bookings at your location yet</Text>
          </View>
        ) : (
          recentBookings.map(b => {
            const statusColor = getStatusColor(b.status);
            return (
              <TouchableOpacity
                key={b.id}
                style={styles.bookingCard}
                onPress={() => navigation.navigate('BookingsTab', { screen: 'BookingDetails', params: { bookingId: b.id } })}
              >
                <View style={styles.bookingHeader}>
                  <Text style={styles.bookingNum}>#{b.bookingNumber}</Text>
                  <View style={[styles.badge, { backgroundColor: statusColor + '22' }]}>
                    <Text style={[styles.badgeText, { color: statusColor }]}>{getStatusLabel(b.status)}</Text>
                  </View>
                </View>
                <Text style={styles.bookingCustomer}>{b.customer.name} · {b.customer.phone}</Text>
                <Text style={styles.bookingRoute}>
                  {b.pickupLocation.village} → {b.dropLocation.village}
                </Text>
                <Text style={styles.bookingAmount}>{formatCurrency(b.calculatedPrice)}</Text>
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { backgroundColor: THEME, padding: 20, paddingTop: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flex: 1 },
  bellBtn: { position: 'relative', padding: 6 },
  bellIcon: { fontSize: 22 },
  bellBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#f44336', borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  bellBadgeText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  subGreeting: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  statsRow: { flexDirection: 'row', margin: 12, gap: 10 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  statNumber: { fontSize: 28, fontWeight: 'bold' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 4 },
  section: { marginHorizontal: 12, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  seeAll: { fontSize: 13, color: THEME, fontWeight: '600' },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard: { width: '47%', backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  actionIcon: { fontSize: 28, marginBottom: 8 },
  actionLabel: { fontSize: 12, color: '#333', textAlign: 'center', fontWeight: '500' },
  bookingCard: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8 },
  bookingHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  bookingNum: { fontSize: 13, fontWeight: 'bold', color: '#333' },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  bookingCustomer: { fontSize: 13, color: '#555', marginBottom: 4 },
  bookingRoute: { fontSize: 12, color: '#888', marginBottom: 4 },
  bookingAmount: { fontSize: 14, fontWeight: 'bold', color: THEME },
  emptyCard: { backgroundColor: '#fff', borderRadius: 12, padding: 24, alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#999' },
});
