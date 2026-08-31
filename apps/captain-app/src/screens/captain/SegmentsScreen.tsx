import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl, Linking,
} from 'react-native';
import { segmentsApi, bookingsApi, getStatusColor, getStatusLabel, formatCurrency } from '@ve/mobile-shared';
import type { BookingSegment } from '@ve/mobile-shared';
import * as ImagePicker from 'expo-image-picker';

const THEME = '#2196F3';

const NEXT_STATUS: Record<string, string | null> = {
  ASSIGNED:        'PICKED_UP',
  PICKED_UP:       'IN_TRANSIT',
  IN_TRANSIT:      'OUT_FOR_DELIVERY',
  OUT_FOR_DELIVERY: null,  // needs OTP delivery
};

const ACTION_LABEL: Record<string, string> = {
  ASSIGNED:        '📦 Mark Picked Up',
  PICKED_UP:       '🚛 Mark In Transit',
  IN_TRANSIT:      '🏘️ Mark Out for Delivery',
};

const STATUS_TABS = ['ALL', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'];

// ── SegmentCard ───────────────────────────────────────────────────────────────

interface SegmentCardProps {
  seg: BookingSegment;
  onUpdate: () => void;
  onCaptureChange: (segmentId: string | null) => void;
}

function SegmentCard({ seg, onUpdate, onCaptureChange }: SegmentCardProps) {
  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [collectingCod, setCollectingCod] = useState(false);

  const nextStatus = NEXT_STATUS[seg.status] ?? null;
  const actionLabel = ACTION_LABEL[seg.status];
  const statusColor = getStatusColor(seg.status);
  const isCod = seg.booking.paymentMethod === 'COD';
  const isDirect = seg.id.startsWith('direct-');
  const isBusy = updating || uploading;

  // Shared helper: advance the segment status in the API
  const doStatusUpdate = async (status: string) => {
    setUpdating(true);
    try {
      await segmentsApi.updateSegmentStatus(seg.booking.id, status);
      onUpdate();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error ?? 'Could not update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdate = () => {
    if (!nextStatus) return;

    // ── ASSIGNED → PICKED_UP: prompt for parcel photo first ─────────────────
    if (seg.status === 'ASSIGNED') {
      Alert.alert(
        'Before Pickup',
        'Please photograph the parcel before marking as picked up.',
        [
          {
            text: 'Take Photo',
            onPress: async () => {
              // Request camera permission
              const { status } = await ImagePicker.requestCameraPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Permission Required', 'Camera access is needed to photograph the parcel.');
                return;
              }

              // Open camera
              const result = await ImagePicker.launchCameraAsync({
                quality: 0.8,
                allowsEditing: false,
              });

              // Mark this segment as being processed (visible to parent screen)
              onCaptureChange(seg.id);
              setUpdating(true);

              // Upload photo if one was taken (camera not cancelled)
              if (!result.canceled && result.assets[0]?.uri) {
                const photoUri = result.assets[0].uri;
                const bookingId = seg.booking?.id;
                if (bookingId) {
                  setUploading(true);
                  try {
                    await bookingsApi.uploadValidationImage(bookingId, photoUri);
                  } catch {
                    // Non-blocking: warn but always proceed with the status update
                    Alert.alert(
                      'Photo Upload Failed',
                      'The parcel photo could not be saved, but the status will still be updated.',
                    );
                  } finally {
                    setUploading(false);
                  }
                }
              }

              // Advance status regardless of whether the photo was taken
              try {
                await segmentsApi.updateSegmentStatus(seg.booking.id, nextStatus!);
                onUpdate();
              } catch (err: any) {
                Alert.alert('Error', err?.response?.data?.error ?? 'Could not update status');
              } finally {
                setUpdating(false);
                onCaptureChange(null);
              }
            },
          },
          {
            text: 'Skip',
            onPress: () => doStatusUpdate(nextStatus),
          },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
      return;
    }

    // ── All other statuses: standard confirm dialog ──────────────────────────
    Alert.alert(
      'Update Status',
      `Mark this segment as "${getStatusLabel(nextStatus)}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => doStatusUpdate(nextStatus),
        },
      ],
    );
  };

  const handleCall = () => {
    Linking.openURL(`tel:${seg.booking.customer.phone}`);
  };

  const handleCollectCod = () => {
    Alert.alert(
      'Collect COD',
      `Confirm cash collection of ${formatCurrency(seg.booking.calculatedPrice)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm', onPress: async () => {
            setCollectingCod(true);
            try {
              const id = isDirect ? `direct-${seg.booking.id}` : seg.id;
              await segmentsApi.collectCod(id);
              Alert.alert('Done!', 'COD marked as collected.');
              onUpdate();
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.error ?? 'Could not collect COD');
            } finally {
              setCollectingCod(false);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.card}>
      {/* Status bar */}
      <View style={[styles.cardStatus, { backgroundColor: statusColor }]}>
        <Text style={styles.cardStatusText}>{getStatusLabel(seg.status)}</Text>
        <Text style={styles.cardBookingNum}>#{seg.booking.bookingNumber}</Text>
      </View>

      <View style={styles.cardBody}>
        {/* Route */}
        <View style={styles.routeRow}>
          <View style={styles.routePoint}>
            <View style={[styles.routeDot, { backgroundColor: THEME }]} />
            <Text style={styles.routeName} numberOfLines={1}>
              {seg.routeSegment.fromLocation.pointName}, {seg.routeSegment.fromLocation.village}
            </Text>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.routePoint}>
            <View style={[styles.routeDot, { backgroundColor: '#f44336' }]} />
            <Text style={styles.routeName} numberOfLines={1}>
              {seg.routeSegment.toLocation.pointName}, {seg.routeSegment.toLocation.village}
            </Text>
          </View>
        </View>

        {/* Parcel & customer */}
        <View style={styles.infoRow}>
          <Text style={styles.infoChip}>📦 {seg.booking.parcelType}</Text>
          <Text style={styles.infoChip}>⚖️ {seg.booking.parcelWeight} kg</Text>
          {isCod && <Text style={[styles.infoChip, styles.codChip]}>💵 COD {formatCurrency(seg.booking.calculatedPrice)}</Text>}
        </View>

        <View style={styles.customerRow}>
          <Text style={styles.customerName}>👤 {seg.booking.customer.name}</Text>
          <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
            <Text style={styles.callBtnText}>📞 Call</Text>
          </TouchableOpacity>
        </View>

        {seg.pointManager && (
          <Text style={styles.pmLabel}>
            🏪 Point: {seg.pointManager.name} · {seg.pointManager.phone}
          </Text>
        )}

        {/* Upload progress indicator */}
        {uploading && (
          <View style={styles.uploadingRow}>
            <ActivityIndicator size="small" color={THEME} />
            <Text style={styles.uploadingText}>Uploading parcel photo…</Text>
          </View>
        )}

        {/* Primary action button */}
        {nextStatus && actionLabel && seg.status !== 'DELIVERED' && (
          <TouchableOpacity
            style={[styles.actionBtn, isBusy && styles.disabled]}
            onPress={handleUpdate}
            disabled={isBusy}
          >
            {isBusy
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.actionBtnText}>{actionLabel}</Text>}
          </TouchableOpacity>
        )}

        {/* COD collection button */}
        {isCod && ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(seg.status) && (
          <TouchableOpacity
            style={[styles.codBtn, collectingCod && styles.disabled]}
            onPress={handleCollectCod}
            disabled={collectingCod}
          >
            {collectingCod
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.codBtnText}>💵 Collect Cash</Text>}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ── SegmentsScreen ────────────────────────────────────────────────────────────

export default function SegmentsScreen({ navigation }: any) {
  const [segments, setSegments] = useState<BookingSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL');
  // Tracks which segment is currently going through photo-capture flow
  const [captureSegmentId, setCaptureSegmentId] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    try {
      const status = activeTab === 'ALL' ? undefined : activeTab;
      const res = await segmentsApi.getMySegments({ status, pageSize: 50 });
      setSegments(res.data?.items ?? []);
    } catch { /* silent */ }
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => { setLoading(true); load(); }, [activeTab]);

  const filtered = activeTab === 'ALL'
    ? segments
    : segments.filter(s => s.status === activeTab);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={THEME} /></View>;

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      {/* Status filter tabs */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabs}
        contentContainerStyle={styles.tabsContent}
        data={STATUS_TABS}
        keyExtractor={t => t}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.tab, activeTab === item && styles.tabActive]}
            onPress={() => setActiveTab(item)}
          >
            <Text style={[styles.tabText, activeTab === item && styles.tabTextActive]}>
              {item === 'ALL' ? 'All' : getStatusLabel(item)}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Segment list */}
      <FlatList
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            colors={[THEME]}
          />
        }
        data={filtered}
        keyExtractor={s => s.id}
        contentContainerStyle={{ padding: 12, paddingBottom: 30 }}
        renderItem={({ item }) => (
          <SegmentCard
            seg={item}
            onUpdate={() => { setRefreshing(true); load(); }}
            onCaptureChange={setCaptureSegmentId}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🚛</Text>
            <Text style={styles.emptyTitle}>No Segments</Text>
            <Text style={styles.emptyText}>
              {activeTab === 'ALL'
                ? 'You have no active delivery segments'
                : `No segments in "${getStatusLabel(activeTab)}" state`}
            </Text>
          </View>
        }
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabs: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee', maxHeight: 50 },
  tabsContent: { paddingHorizontal: 12, alignItems: 'center', gap: 8, paddingVertical: 8 },
  tab: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f5f5f5' },
  tabActive: { backgroundColor: THEME },
  tabText: { fontSize: 12, color: '#666', fontWeight: '500' },
  tabTextActive: { color: '#fff', fontWeight: 'bold' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  cardStatus: { padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardStatusText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  cardBookingNum: { color: 'rgba(255,255,255,0.85)', fontSize: 12 },
  cardBody: { padding: 14, gap: 10 },
  routeRow: { gap: 4 },
  routePoint: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  routeDot: { width: 9, height: 9, borderRadius: 5 },
  routeName: { flex: 1, fontSize: 13, color: '#333', fontWeight: '500' },
  routeLine: { width: 1, height: 12, backgroundColor: '#ddd', marginLeft: 4 },
  infoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  infoChip: { fontSize: 12, color: '#555', backgroundColor: '#f0f0f0', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  codChip: { backgroundColor: '#FFF8E1', color: '#F57F17' },
  customerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  customerName: { fontSize: 14, color: '#333', fontWeight: '600' },
  callBtn: { backgroundColor: '#E3F2FD', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  callBtnText: { color: THEME, fontWeight: '600', fontSize: 13 },
  pmLabel: { fontSize: 12, color: '#888', fontStyle: 'italic' },
  // Upload progress
  uploadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  uploadingText: { fontSize: 13, color: THEME, fontStyle: 'italic' },
  // Action buttons
  actionBtn: { backgroundColor: THEME, borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  codBtn: { backgroundColor: '#F57F17', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  codBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  disabled: { opacity: 0.6 },
  empty: { alignItems: 'center', paddingTop: 70 },
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 6 },
  emptyText: { fontSize: 14, color: '#888', textAlign: 'center', paddingHorizontal: 40 },
});
