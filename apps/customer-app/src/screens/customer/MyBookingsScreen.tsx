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

const THEME = '#4CAF50';

const STATUS_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Active', value: 'CONFIRMED' },
  { label: 'Delivered', value: 'DELIVERED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

function BookingCard({ booking, onPress }: { booking: Booking; onPress: () => void }) {
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
        <View style={card.routeLine} />
        <View style={card.routePoint}>
          <View style={[card.dot, { backgroundColor: '#f44336' }]} />
          <Text style={card.routeText}>{booking.dropLocation.pointName}</Text>
        </View>
      </View>

      <View style={card.footer}>
        <Text style={card.meta}>{formatDate(booking.createdAt)}</Text>
        <Text style={card.meta}>
          {booking.parcelType} · {booking.parcelWeight} kg
        </Text>
        <Text style={card.price}>{formatCurrency(booking.calculatedPrice)}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function MyBookingsScreen({ navigation }: any) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchBookings = useCallback(async (reset = false) => {
    const currentPage = reset ? 1 : page;
    if (!reset) setLoadingMore(true);

    try {
      const res = await bookingsApi.getMyBookings({
        status: activeFilter || undefined,
        page: currentPage,
        pageSize: 15,
      });
      const items = res.data?.items ?? [];
      const total = res.data?.total ?? 0;

      if (reset) {
        setBookings(items);
        setPage(2);
      } else {
        setBookings(prev => [...prev, ...items]);
        setPage(p => p + 1);
      }
      setHasMore(bookings.length + items.length < total);
    } catch {
      Alert.alert('Error', 'Could not load bookings. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [activeFilter, page, bookings.length]);

  useEffect(() => {
    setLoading(true);
    setPage(1);
    fetchBookings(true);
  }, [activeFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchBookings(true);
  };

  const loadMore = () => {
    if (hasMore && !loadingMore) fetchBookings();
  };

  return (
    <View style={styles.root}>
      {/* Filter tabs */}
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
        <View style={styles.center}>
          <ActivityIndicator size="large" color={THEME} />
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <BookingCard
              booking={item}
              onPress={() => navigation.navigate('BookingDetails', { bookingId: item.id })}
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[THEME]} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyTitle}>No bookings yet</Text>
              <Text style={styles.emptyText}>Your bookings will appear here</Text>
              <TouchableOpacity
                style={styles.newBtn}
                onPress={() => navigation.navigate('Booking')}
              >
                <Text style={styles.newBtnText}>Create New Booking</Text>
              </TouchableOpacity>
            </View>
          }
          ListFooterComponent={loadingMore ? <ActivityIndicator color={THEME} style={{ padding: 16 }} /> : null}
        />
      )}

      {/* FAB - New Booking */}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('Booking')}>
        <Text style={styles.fabText}>+ New</Text>
      </TouchableOpacity>
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
  list: { padding: 12, paddingBottom: 80 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#888', marginBottom: 24 },
  newBtn: { backgroundColor: THEME, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 },
  newBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: THEME, borderRadius: 24, paddingHorizontal: 20, paddingVertical: 13, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 6 },
  fabText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});

const card = StyleSheet.create({
  container: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  number: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  badge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  route: { marginBottom: 12 },
  routePoint: { flexDirection: 'row', alignItems: 'center', marginVertical: 2 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  routeText: { fontSize: 14, color: '#333', fontWeight: '500' },
  routeLine: { width: 1, height: 10, backgroundColor: '#ccc', marginLeft: 3.5, marginVertical: 2 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 10 },
  meta: { fontSize: 11, color: '#999' },
  price: { fontSize: 14, fontWeight: 'bold', color: THEME },
});
