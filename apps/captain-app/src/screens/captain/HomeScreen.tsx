import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl, Modal,
} from 'react-native';
import { profileApi, bookingsApi, notificationsApi, formatCurrency, getStatusColor, getStatusLabel } from '@ve/mobile-shared';
import type { Booking } from '@ve/mobile-shared';

const THEME = '#2196F3';

type AvailStatus = 'AVAILABLE' | 'BUSY' | 'OFF_DUTY';

const AVAIL_CONFIG: Record<AvailStatus, { emoji: string; label: string; color: string; bg: string }> = {
  AVAILABLE: { emoji: '✅', label: 'Available',  color: '#1B5E20', bg: '#43A047' },
  BUSY:      { emoji: '🟠', label: 'Busy',       color: '#E65100', bg: '#F57C00' },
  OFF_DUTY:  { emoji: '🔴', label: 'Off Duty',   color: '#B71C1C', bg: '#E53935' },
};

// ── 3-state availability picker modal ───────────────────────────────────────
function AvailabilityModal({ visible, current, onSelect, onClose }: {
  visible: boolean;
  current: AvailStatus;
  onSelect: (s: AvailStatus) => void;
  onClose: () => void;
}) {
  const options: AvailStatus[] = ['AVAILABLE', 'BUSY', 'OFF_DUTY'];
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={modal.overlay} activeOpacity={1} onPress={onClose}>
        <View style={modal.box}>
          <Text style={modal.title}>Set Availability</Text>
          {options.map(opt => {
            const cfg = AVAIL_CONFIG[opt];
            const active = opt === current;
            return (
              <TouchableOpacity
                key={opt}
                style={[modal.option, active && { backgroundColor: cfg.bg + '22', borderColor: cfg.bg, borderWidth: 1.5 }]}
                onPress={() => { onSelect(opt); onClose(); }}
              >
                <Text style={modal.optionEmoji}>{cfg.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[modal.optionLabel, active && { color: cfg.bg }]}>{cfg.label}</Text>
                  <Text style={modal.optionDesc}>
                    {opt === 'AVAILABLE' ? 'Ready to receive new deliveries' :
                     opt === 'BUSY' ? 'Currently handling a delivery' :
                     'Not accepting deliveries right now'}
                  </Text>
                </View>
                {active && <Text style={[modal.tick, { color: cfg.bg }]}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

export default function HomeScreen({ navigation }: any) {
  const [availability, setAvailability] = useState<AvailStatus>('OFF_DUTY');
  const [togglingAvail, setTogglingAvail] = useState(false);
  const [showAvailModal, setShowAvailModal] = useState(false);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(async () => {
    try {
      const [profileRes, bookingsRes, notifRes] = await Promise.all([
        profileApi.getProfile(),
        bookingsApi.getCaptainBookings({ pageSize: 5 }),
        notificationsApi.getNotifications(),
      ]);
      setProfile(profileRes.data);
      const avail = profileRes.data?.captainProfile?.availabilityStatus ?? 'OFF_DUTY';
      setAvailability(avail as AvailStatus);
      setRecentBookings(bookingsRes.data?.items ?? []);
      setUnreadCount((notifRes.data ?? []).filter((n: any) => !n.read).length);
    } catch {
      Alert.alert('Error', 'Could not load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSetAvailability = async (status: AvailStatus) => {
    setTogglingAvail(true);
    try {
      const res = await profileApi.setAvailability(status);
      setAvailability((res.data?.availabilityStatus ?? status) as AvailStatus);
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? 'Could not update availability';
      Alert.alert('Unavailable', msg);
    } finally {
      setTogglingAvail(false);
    }
  };

  const availCfg = AVAIL_CONFIG[availability];
  const activeCount = recentBookings.filter(b =>
    ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(b.status)
  ).length;

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={THEME} /></View>;
  }

  return (
    <>
      <ScrollView
        style={styles.root}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[THEME]} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Hello, {profile?.name?.split(' ')[0] ?? 'Captain'} 👋</Text>
            <Text style={styles.subGreeting}>{profile?.displayId ?? ''}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.bellBtn} onPress={() => navigation.navigate('Notifications')}>
              <Text style={styles.bellIcon}>🔔</Text>
              {unreadCount > 0 && (
                <View style={styles.bellBadge}><Text style={styles.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text></View>
              )}
            </TouchableOpacity>
            {/* 3-state availability pill */}
            <TouchableOpacity
              style={[styles.availPill, { backgroundColor: availCfg.bg }]}
              onPress={() => setShowAvailModal(true)}
              disabled={togglingAvail}
            >
              {togglingAvail
                ? <ActivityIndicator color="#fff" size="small" />
                : <>
                    <Text style={styles.availPillEmoji}>{availCfg.emoji}</Text>
                    <Text style={styles.availPillLabel}>{availCfg.label}</Text>
                    <Text style={styles.availPillCaret}>▾</Text>
                  </>}
            </TouchableOpacity>
          </View>
        </View>

        {/* Status banner */}
        <View style={[styles.statusBanner, { backgroundColor: availCfg.bg + 'dd' }]}>
          <Text style={styles.statusText}>
            {availability === 'AVAILABLE' ? '✓ You are available — ready to receive assignments'
             : availability === 'BUSY' ? '⏳ You are busy — complete current delivery first'
             : '✗ You are off duty — tap to change availability'}
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{activeCount}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {recentBookings.filter(b => b.status === 'DELIVERED').length}
            </Text>
            <Text style={styles.statLabel}>Delivered</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{recentBookings.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>

        {/* Quick actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('AssignmentsTab')}>
              <Text style={styles.actionIcon}>📋</Text>
              <Text style={styles.actionLabel}>My Assignments</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('AssignmentsTab', { screen: 'Segments' })}>
              <Text style={styles.actionIcon}>🚛</Text>
              <Text style={styles.actionLabel}>My Segments</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('EarningsTab')}>
              <Text style={styles.actionIcon}>💵</Text>
              <Text style={styles.actionLabel}>My Earnings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent assignments */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Assignments</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AssignmentsTab')}>
              <Text style={styles.seeAll}>See All →</Text>
            </TouchableOpacity>
          </View>
          {recentBookings.length === 0 ? (
            <View style={styles.emptySection}>
              <Text style={styles.emptyText}>No assignments yet. Set yourself as Available to receive deliveries.</Text>
            </View>
          ) : (
            recentBookings.map(b => {
              const statusColor = getStatusColor(b.status);
              return (
                <TouchableOpacity
                  key={b.id}
                  style={styles.assignmentCard}
                  onPress={() => navigation.navigate('AssignmentsTab', { screen: 'BookingDetails', params: { bookingId: b.id } })}
                >
                  <View style={styles.assignmentHeader}>
                    <Text style={styles.assignmentNum}>#{b.bookingNumber}</Text>
                    <View style={[styles.badge, { backgroundColor: statusColor + '22' }]}>
                      <Text style={[styles.badgeText, { color: statusColor }]}>{getStatusLabel(b.status)}</Text>
                    </View>
                  </View>
                  <Text style={styles.assignmentRoute}>
                    {b.pickupLocation.village} → {b.dropLocation.village}
                  </Text>
                  <Text style={styles.assignmentEarn}>{formatCurrency(b.calculatedPrice)}</Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      <AvailabilityModal
        visible={showAvailModal}
        current={availability}
        onSelect={handleSetAvailability}
        onClose={() => setShowAvailModal(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { backgroundColor: THEME, padding: 20, paddingTop: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bellBtn: { position: 'relative', padding: 6 },
  bellIcon: { fontSize: 22 },
  bellBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#f44336', borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  bellBadgeText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
  greeting: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  subGreeting: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  availPill: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 7, gap: 4, minWidth: 90 },
  availPillEmoji: { fontSize: 14 },
  availPillLabel: { color: '#fff', fontSize: 12, fontWeight: '700', flex: 1 },
  availPillCaret: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
  statusBanner: { paddingVertical: 10, paddingHorizontal: 16 },
  statusText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  statsRow: { flexDirection: 'row', padding: 16, gap: 12 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: THEME },
  statLabel: { fontSize: 12, color: '#666', marginTop: 4 },
  section: { padding: 16, paddingTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  seeAll: { fontSize: 13, color: THEME, fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: 12 },
  actionCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center' },
  actionIcon: { fontSize: 24, marginBottom: 6 },
  actionLabel: { fontSize: 11, fontWeight: '600', color: '#555', textAlign: 'center' },
  emptySection: { backgroundColor: '#fff', borderRadius: 12, padding: 24, alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#999', textAlign: 'center' },
  assignmentCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 },
  assignmentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  assignmentNum: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  assignmentRoute: { fontSize: 13, color: '#666', marginBottom: 4 },
  assignmentEarn: { fontSize: 15, fontWeight: 'bold', color: THEME },
});

const modal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  box: { backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  option: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: 'transparent', backgroundColor: '#f8f8f8', gap: 12 },
  optionEmoji: { fontSize: 22 },
  optionLabel: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 2 },
  optionDesc: { fontSize: 12, color: '#888' },
  tick: { fontSize: 20, fontWeight: 'bold' },
});
