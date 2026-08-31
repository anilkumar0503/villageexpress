import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { notificationsApi } from '@ve/mobile-shared';
import type { Notification } from '@ve/mobile-shared';
import { formatDate } from '@ve/mobile-shared';

const THEME = '#4CAF50';

const TYPE_ICON: Record<string, string> = {
  BOOKING_CONFIRMED: '📦', BOOKING_CANCELLED: '❌', BOOKING_DELIVERED: '✅',
  PAYMENT_SUCCESS: '💰', PAYMENT_FAILED: '⚠️', WALLET_CREDITED: '💰',
  WALLET_DEBITED: '💸', CAPTAIN_ASSIGNED: '🛵', KYC_APPROVED: '✅',
  KYC_REJECTED: '❌', GENERAL: '🔔',
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (silent = false) => {
    try {
      const res = await notificationsApi.getNotifications();
      const items = res.data ?? [];
      setNotifications(items);
      // Mark all as read automatically
      const unread = items.filter(n => !n.read).map(n => n.id);
      if (unread.length) await notificationsApi.markAsRead(unread);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={THEME} /></View>;

  return (
    <FlatList
      style={styles.root}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[THEME]} />}
      data={notifications}
      keyExtractor={n => n.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <View style={[styles.item, !item.read && styles.itemUnread]}>
          <Text style={styles.itemIcon}>{TYPE_ICON[item.type] ?? '🔔'}</Text>
          <View style={styles.itemBody}>
            <Text style={[styles.itemTitle, !item.read && styles.boldText]}>{item.title}</Text>
            <Text style={styles.itemMsg} numberOfLines={2}>{item.message}</Text>
            <Text style={styles.itemDate}>{formatDate(item.createdAt)}</Text>
          </View>
          {!item.read && <View style={[styles.dot, { backgroundColor: THEME }]} />}
        </View>
      )}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text style={styles.emptyTitle}>No Notifications</Text>
          <Text style={styles.emptyText}>You're all caught up!</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 12, paddingBottom: 30 },
  item: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, gap: 12 },
  itemUnread: { borderLeftWidth: 3, borderLeftColor: THEME },
  itemIcon: { fontSize: 26, width: 34 },
  itemBody: { flex: 1 },
  itemTitle: { fontSize: 14, color: '#333', marginBottom: 3 },
  boldText: { fontWeight: 'bold' },
  itemMsg: { fontSize: 13, color: '#666', lineHeight: 19, marginBottom: 5 },
  itemDate: { fontSize: 11, color: '#bbb' },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 6 },
  emptyText: { fontSize: 14, color: '#888' },
});
