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
  Modal,
  FlatList,
  TextInput,
} from 'react-native';
import { bookingsApi, captainsApi, codApi, getStatusColor, getStatusLabel, formatCurrency, formatDateTime } from '@ve/mobile-shared';
import type { Booking, AvailableCaptain } from '@ve/mobile-shared';

const THEME = '#FF9800';

// PM-relevant status transitions
const STATUS_ACTIONS: Record<string, { nextStatus: string; label: string; color: string }> = {
  CONFIRMED: { nextStatus: 'RECEIVED_AT_POINT', label: 'Mark as Received at Point', color: '#9C27B0' },
};

export default function BookingDetailsScreen({ route }: any) {
  const { bookingId } = route.params;
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showCaptainPicker, setShowCaptainPicker] = useState(false);
  const [collectingCod, setCollectingCod] = useState(false);
  const [availableCaptains, setAvailableCaptains] = useState<AvailableCaptain[]>([]);
  const [loadingCaptains, setLoadingCaptains] = useState(false);
  const [assigningCaptain, setAssigningCaptain] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const load = async () => {
    try {
      const res = await bookingsApi.getBookingById(bookingId);
      setBooking(res.data);
    } catch {
      Alert.alert('Error', 'Could not load booking details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, [bookingId]);

  const updateStatus = async (nextStatus: string) => {
    setUpdating(true);
    try {
      await bookingsApi.updateBookingStatus(bookingId, nextStatus);
      load();
    } catch {
      Alert.alert('Error', 'Could not update status');
    } finally {
      setUpdating(false);
    }
  };

  const openCaptainPicker = async () => {
    setShowCaptainPicker(true);
    setLoadingCaptains(true);
    try {
      const res = await captainsApi.getAvailableCaptains();
      setAvailableCaptains(res.data ?? []);
    } catch {
      Alert.alert('Error', 'Could not load available captains');
    } finally {
      setLoadingCaptains(false);
    }
  };

  const assignCaptain = async (captainId: string) => {
    setAssigningCaptain(captainId);
    try {
      await bookingsApi.assignCaptain(bookingId, captainId);
      setShowCaptainPicker(false);
      Alert.alert('Success', 'Captain assigned successfully');
      load();
    } catch {
      Alert.alert('Error', 'Could not assign captain');
    } finally {
      setAssigningCaptain(null);
    }
  };

  const handleCancel = async () => {
    const reason = cancelReason.trim();
    if (!reason) { Alert.alert('Required', 'Please enter a cancellation reason'); return; }
    setCancelling(true);
    try {
      await bookingsApi.cancelBooking(bookingId, reason);
      setShowCancelModal(false);
      Alert.alert('Cancelled', 'Booking has been cancelled.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error ?? 'Could not cancel booking');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={THEME} /></View>;
  if (!booking) return <View style={styles.center}><Text style={styles.errorText}>Booking not found</Text></View>;

  const statusColor = getStatusColor(booking.status);
  const action = STATUS_ACTIONS[booking.status];
  const canAssignCaptain = ['RECEIVED_AT_POINT'].includes(booking.status) && !booking.captain;
  const canCancel = ['PENDING', 'CONFIRMED'].includes(booking.status);

  return (
    <>
      <ScrollView
        style={styles.root}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[THEME]} />}
      >
        {/* Status banner */}
        <View style={[styles.statusBanner, { backgroundColor: statusColor }]}>
          <Text style={styles.statusLabel}>{getStatusLabel(booking.status)}</Text>
          <Text style={styles.bookingNum}>#{booking.bookingNumber}</Text>
        </View>

        {/* Customer */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Customer</Text>
          <InfoRow label="Name" value={booking.customer.name} />
          <InfoRow label="Phone" value={booking.customer.phone} />
          <InfoRow label="Customer ID" value={booking.customer.displayId} />
        </View>

        {/* Route */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Route</Text>
          <InfoRow label="Pickup" value={`${booking.pickupLocation.pointName}, ${booking.pickupLocation.village}`} />
          <InfoRow label="Drop" value={`${booking.dropLocation.pointName}, ${booking.dropLocation.village}`} />
        </View>

        {/* Parcel */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Parcel Info</Text>
          <InfoRow label="Type" value={booking.parcelType} />
          <InfoRow label="Weight" value={`${booking.parcelWeight} kg`} />
          <InfoRow label="Priority" value={booking.deliveryPriority} />
          <InfoRow label="Payment Method" value={booking.paymentMethod} />
          <InfoRow label="Payment Status" value={booking.paymentStatus} />
          <InfoRow label="Amount" value={formatCurrency(booking.calculatedPrice)} bold />
          <InfoRow label="Booked At" value={formatDateTime(booking.createdAt)} />
        </View>

        {/* Captain */}
        {booking.captain ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Assigned Captain</Text>
            <InfoRow label="Name" value={booking.captain.name} />
            <InfoRow label="Phone" value={booking.captain.phone} />
            <InfoRow label="Captain ID" value={booking.captain.displayId} />
          </View>
        ) : (
          canAssignCaptain && (
            <TouchableOpacity style={styles.assignBtn} onPress={openCaptainPicker}>
              <Text style={styles.assignBtnText}>🏍 Assign Captain</Text>
            </TouchableOpacity>
          )
        )}

        {/* COD info + collect button */}
        {booking.paymentMethod === 'COD' && (
          <View style={[styles.card, { backgroundColor: '#FFF8E1', borderWidth: 1, borderColor: '#FFD54F' }]}>
            <Text style={styles.cardTitle}>💵 COD Booking</Text>
            <InfoRow label="Amount to Collect" value={formatCurrency(booking.calculatedPrice)} bold />
            <InfoRow label="Collection Status" value={booking.paymentStatus} />
            {booking.paymentStatus !== 'PAID' && (
              <TouchableOpacity
                style={[styles.codCollectBtn, collectingCod && styles.disabled]}
                disabled={collectingCod}
                onPress={() => {
                  Alert.alert(
                    'Collect COD',
                    `Confirm cash collection of ${formatCurrency(booking.calculatedPrice)}?`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Confirm', onPress: async () => {
                        setCollectingCod(true);
                        try {
                          await codApi.collectCod(`direct-${booking.id}`, booking.calculatedPrice);
                          Alert.alert('Collected!', 'COD marked as collected.');
                          load();
                        } catch (err: any) {
                          Alert.alert('Error', err?.response?.data?.error ?? 'Could not collect COD');
                        } finally {
                          setCollectingCod(false);
                        }
                      }},
                    ],
                  );
                }}
              >
                {collectingCod ? <ActivityIndicator color="#fff" /> : <Text style={styles.codCollectBtnText}>💵 Mark COD Collected</Text>}
              </TouchableOpacity>
            )}
            {booking.paymentStatus === 'PAID' && (
              <View style={styles.codPaidBadge}><Text style={styles.codPaidText}>✓ COD Collected</Text></View>
            )}
          </View>
        )}

        {/* Cancel booking */}
        {canCancel && (
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => { setCancelReason(''); setShowCancelModal(true); }}
          >
            <Text style={styles.cancelBtnText}>Cancel Booking</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Cancel modal */}
      <Modal visible={showCancelModal} transparent animationType="slide" onRequestClose={() => setShowCancelModal(false)}>
        <View style={cancelModal.overlay}>
          <View style={cancelModal.box}>
            <Text style={cancelModal.title}>Cancel Booking</Text>
            <Text style={cancelModal.subtitle}>Provide a reason for cancellation.</Text>
            <TextInput
              style={cancelModal.input}
              placeholder="Enter reason..."
              value={cancelReason}
              onChangeText={setCancelReason}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              autoFocus
            />
            <View style={cancelModal.row}>
              <TouchableOpacity style={cancelModal.btnOutline} onPress={() => setShowCancelModal(false)}>
                <Text style={cancelModal.btnOutlineText}>Keep</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[cancelModal.btnDanger, cancelling && { opacity: 0.6 }]}
                onPress={handleCancel}
                disabled={cancelling}
              >
                {cancelling ? <ActivityIndicator color="#fff" size="small" /> : <Text style={cancelModal.btnDangerText}>Yes, Cancel</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Action button */}
      {action && (
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: action.color }, updating && styles.disabled]}
            onPress={() => updateStatus(action.nextStatus)}
            disabled={updating}
          >
            {updating ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>{action.label}</Text>}
          </TouchableOpacity>
        </View>
      )}

      {/* Captain picker modal */}
      <Modal visible={showCaptainPicker} animationType="slide" presentationStyle="pageSheet">
        <View style={modal.container}>
          <View style={modal.header}>
            <Text style={modal.title}>Assign Captain</Text>
            <TouchableOpacity onPress={() => setShowCaptainPicker(false)}>
              <Text style={modal.close}>✕</Text>
            </TouchableOpacity>
          </View>
          {loadingCaptains ? (
            <View style={styles.center}><ActivityIndicator size="large" color={THEME} /></View>
          ) : (
            <FlatList
              data={availableCaptains}
              keyExtractor={c => c.id}
              renderItem={({ item: captain }) => (
                <TouchableOpacity
                  style={modal.captainItem}
                  onPress={() => assignCaptain(captain.id)}
                  disabled={!!assigningCaptain}
                >
                  <View style={modal.captainInfo}>
                    <Text style={modal.captainName}>{captain.name}</Text>
                    <Text style={modal.captainMeta}>{captain.phone} · {captain.vehicleType ?? 'N/A'}</Text>
                  </View>
                  {assigningCaptain === captain.id ? (
                    <ActivityIndicator color={THEME} />
                  ) : (
                    <Text style={modal.assignText}>Assign</Text>
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={styles.emptyText}>No available captains right now</Text>
                </View>
              }
            />
          )}
        </View>
      </Modal>
    </>
  );
}

function InfoRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, bold && styles.infoValueBold]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  errorText: { color: '#666', fontSize: 16 },
  statusBanner: { padding: 20, paddingTop: 24 },
  statusLabel: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  bookingNum: { fontSize: 14, color: 'rgba(255,255,255,0.85)' },
  card: { backgroundColor: '#fff', margin: 12, marginBottom: 0, borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  infoLabel: { fontSize: 13, color: '#888' },
  infoValue: { fontSize: 13, color: '#333', fontWeight: '500', maxWidth: '55%', textAlign: 'right' },
  infoValueBold: { fontWeight: 'bold', color: THEME, fontSize: 15 },
  assignBtn: { backgroundColor: '#E3F2FD', margin: 12, marginBottom: 0, borderRadius: 12, padding: 18, alignItems: 'center', borderWidth: 1.5, borderColor: '#2196F3' },
  assignBtnText: { color: '#2196F3', fontWeight: 'bold', fontSize: 16 },
  actionBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
  actionBtn: { borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  disabled: { opacity: 0.6 },
  codCollectBtn: { backgroundColor: '#F57F17', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
  codCollectBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  codPaidBadge: { backgroundColor: '#E8F5E9', borderRadius: 8, paddingVertical: 8, alignItems: 'center', marginTop: 10 },
  codPaidText: { color: '#2E7D32', fontWeight: 'bold', fontSize: 14 },
  empty: { alignItems: 'center', padding: 30 },
  emptyText: { color: '#888', fontSize: 14 },
  cancelBtn: { margin: 12, marginBottom: 0, borderWidth: 1.5, borderColor: '#f44336', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { color: '#f44336', fontWeight: '600', fontSize: 15 },
});

const cancelModal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  box: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  subtitle: { fontSize: 13, color: '#666', lineHeight: 20, marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 14, fontSize: 14, minHeight: 80, marginBottom: 20, backgroundColor: '#f9f9f9' },
  row: { flexDirection: 'row', gap: 10 },
  btnOutline: { flex: 1, borderWidth: 1.5, borderColor: '#999', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  btnOutlineText: { color: '#555', fontWeight: '600', fontSize: 14 },
  btnDanger: { flex: 1, backgroundColor: '#f44336', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  btnDangerText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});

const modal = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  close: { fontSize: 18, color: '#666', padding: 4 },
  captainItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  captainInfo: { flex: 1 },
  captainName: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 4 },
  captainMeta: { fontSize: 13, color: '#888' },
  assignText: { color: THEME, fontWeight: 'bold', fontSize: 14 },
});
