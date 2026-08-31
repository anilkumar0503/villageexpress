import React, { useState, useEffect, useCallback } from 'react';
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
import { bookingsApi, getStatusColor, getStatusLabel, formatCurrency, formatDate } from '@ve/mobile-shared';
import type { Booking } from '@ve/mobile-shared';

const THEME = '#2196F3';

const STATUS_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Assigned', value: 'ASSIGNED' },
  { label: 'Active', value: 'PICKED_UP' },
  { label: 'Delivered', value: 'DELIVERED' },
];

function AssignmentCard({ booking, onPress }: { booking: Booking; onPress: () => void }) {
  const statusColor = getStatusColor(booking.status);
  return (
    <TouchableOpacity style={card.container} onPress={onPress} activeOpacity={0.85}>
      <View style={card.header}>
        <Text style={card.number}>#{booking.bookingNumber}</Text>
        <View style={[card.badge, { backgroundColor: statusColor + '22' }]}>
          <Text style={[card.badgeText, { color: statusColor }]}>{getStatusLabel(booking.status)}</Text>
        </View>
      </View>

      <View style={card.route}>
        <View style={card.routePoint}>
          <View style={[card.dot, { backgroundColor: THEME }]} />
          <Text style={card.routeText}>{booking.pickupLocation.pointName}</Text>
        </View>
        <View style={card.routePoint}>
          <View style={[card.dot, { backgroundColor: '#f44336' }]} />
          <Text style={card.routeText}>{booking.dropLocation.pointName}</Text>
        </View>
      </View>

      <View style={card.footer}>
        <Text style={card.meta}>Customer: {booking.customer.name}</Text>
        <Text style={card.meta}>{formatDate(booking.createdAt)}</Text>
        <Text style={card.earn}>{formatCurrency(booking.calculatedPrice)}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function MyBookingsScreen({ navigation }: any) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await bookingsApi.getCaptainBookings({
        status: activeFilter || undefined,
        pageSize: 50,
      });
      setBookings(res.data?.items ?? []);
    } catch {
      Alert.alert('Error', 'Could not load assignments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  return (
    <View style={styles.root}>
      <View style={styles.filterBar}>
        {STATUS_FILTERS.map(f => (
          <TouchableOpacity
            key={f.value}
            style={[styles.filterTab, activeFilter === f.value && styles.filterTabActive]}
            onPress={() => setActiveFilter(f.value)}
          >
            <Text style={[styles.filterText, activeFilter === f.value && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={THEME} /></View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <AssignmentCard booking={item} onPress={() => navigation.navigate('BookingDetails', { bookingId: item.id })} />
          )}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[THEME]} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No Assignments</Text>
              <Text style={styles.emptyText}>Go online to receive delivery assignments</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  filterBar: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee', gap: 6 },
  filterTab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#f0f0f0' },
  filterTabActive: { backgroundColor: THEME },
  filterText: { fontSize: 12, color: '#666', fontWeight: '500' },
  filterTextActive: { color: '#fff', fontWeight: '700' },
  list: { padding: 12, paddingBottom: 30 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#888', textAlign: 'center', paddingHorizontal: 30 },
});

const card = StyleSheet.create({
  container: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  number: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  badge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  route: { marginBottom: 12, gap: 6 },
  routePoint: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  routeText: { fontSize: 14, color: '#333', fontWeight: '500' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 10 },
  meta: { fontSize: 11, color: '#999' },
  earn: { fontSize: 14, fontWeight: 'bold', color: THEME },
});
