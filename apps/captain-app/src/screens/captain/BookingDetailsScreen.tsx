import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  Modal,
  Linking,
} from 'react-native';
import { bookingsApi, getStatusColor, getStatusLabel, formatCurrency, formatDateTime } from '@ve/mobile-shared';
import type { Booking } from '@ve/mobile-shared';

const THEME = '#2196F3';

// Captain-relevant next status transitions
const STATUS_ACTIONS: Record<string, { nextStatus: string; label: string; color: string }> = {
  ASSIGNED: { nextStatus: 'PICKED_UP', label: 'Mark as Picked Up', color: '#FF9800' },
  PICKED_UP: { nextStatus: 'IN_TRANSIT', label: 'Mark In Transit', color: '#9C27B0' },
  IN_TRANSIT: { nextStatus: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', color: '#2196F3' },
  OUT_FOR_DELIVERY: { nextStatus: 'DELIVERED', label: 'Confirm Delivery', color: '#4CAF50' },
};

export default function BookingDetailsScreen({ route, navigation }: any) {
  const { bookingId } = route.params;
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpVerifying, setOtpVerifying] = useState(false);

  const load = async () => {
    try {
      const res = await bookingsApi.getBookingById(bookingId);
      setBooking(res.data);
    } catch {
      Alert.alert('Error', 'Could not load assignment details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, [bookingId]);

  const updateStatus = async () => {
    if (!booking) return;
    const action = STATUS_ACTIONS[booking.status];
    if (!action) return;

    // Delivery requires OTP
    if (action.nextStatus === 'DELIVERED') {
      setShowOtpModal(true);
      return;
    }

    Alert.alert(
      'Update Status',
      `Are you sure you want to mark this as "${getStatusLabel(action.nextStatus)}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setUpdating(true);
            try {
              await bookingsApi.updateBookingStatus(bookingId, action.nextStatus);
              load();
            } catch {
              Alert.alert('Error', 'Could not update status');
            } finally {
              setUpdating(false);
            }
          },
        },
      ],
    );
  };

  const verifyOtp = async () => {
    if (otp.length < 4) {
      Alert.alert('Invalid OTP', 'Please enter a valid OTP');
      return;
    }
    setOtpVerifying(true);
    try {
      await bookingsApi.validateDeliveryOtp(bookingId, otp);
      setShowOtpModal(false);
      setOtp('');
      Alert.alert('Success', 'Delivery confirmed!');
      load();
    } catch {
      Alert.alert('Invalid OTP', 'The OTP entered is incorrect. Please try again.');
    } finally {
      setOtpVerifying(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={THEME} /></View>;
  if (!booking) return <View style={styles.center}><Text style={styles.errorText}>Assignment not found</Text></View>;

  const action = STATUS_ACTIONS[booking.status];
  const statusColor = getStatusColor(booking.status);

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

        {/* Route */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Delivery Route</Text>
          <View style={styles.routeBox}>
            <View style={styles.routePoint}>
              <View style={[styles.routeDot, { backgroundColor: THEME }]} />
              <View>
                <Text style={styles.routeName}>{booking.pickupLocation.pointName}</Text>
                <Text style={styles.routeSub}>{booking.pickupLocation.village}, {booking.pickupLocation.district}</Text>
              </View>
            </View>
            <View style={styles.routeArrow}><Text>↓</Text></View>
            <View style={styles.routePoint}>
              <View style={[styles.routeDot, { backgroundColor: '#f44336' }]} />
              <View>
                <Text style={styles.routeName}>{booking.dropLocation.pointName}</Text>
                <Text style={styles.routeSub}>{booking.dropLocation.village}, {booking.dropLocation.district}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Customer info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Customer</Text>
          <InfoRow label="Name" value={booking.customer.name} />
          <InfoRow label="Phone" value={booking.customer.phone} />
          <InfoRow label="Customer ID" value={booking.customer.displayId} />
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.quickBtn, { backgroundColor: '#E3F2FD' }]}
              onPress={() => Linking.openURL(`tel:${booking.customer.phone}`)}
            >
              <Text style={styles.quickBtnIcon}>📞</Text>
              <Text style={[styles.quickBtnText, { color: '#1565C0' }]}>Call Customer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickBtn, { backgroundColor: '#E8F5E9' }]}
              onPress={() => Linking.openURL(
                `https://maps.google.com/?q=${encodeURIComponent(
                  `${booking.dropLocation.pointName}, ${booking.dropLocation.village}, ${booking.dropLocation.district}`
                )}`
              )}
            >
              <Text style={styles.quickBtnIcon}>🗺️</Text>
              <Text style={[styles.quickBtnText, { color: '#1B5E20' }]}>Navigate</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Parcel info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Parcel Info</Text>
          <InfoRow label="Parcel Type" value={booking.parcelType} />
          <InfoRow label="Weight" value={`${booking.parcelWeight} kg`} />
          <InfoRow label="Priority" value={booking.deliveryPriority} />
          <InfoRow label="Payment" value={booking.paymentMethod} />
          <InfoRow label="Payment Status" value={booking.paymentStatus} />
          <InfoRow label="Amount" value={formatCurrency(booking.calculatedPrice)} bold />
          <InfoRow label="Booked On" value={formatDateTime(booking.createdAt)} />
        </View>

        {/* COD info */}
        {booking.paymentMethod === 'COD' && booking.paymentStatus !== 'COMPLETED' && (
          <View style={[styles.card, { backgroundColor: '#FFF8E1', borderWidth: 1, borderColor: '#FFD54F' }]}>
            <Text style={styles.cardTitle}>💵 COD Collection Required</Text>
            <Text style={styles.codNote}>Collect {formatCurrency(booking.calculatedPrice)} from customer on delivery.</Text>
          </View>
        )}

        {/* Action padding */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Action button */}
      {action && (
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: action.color }, updating && styles.disabled]}
            onPress={updateStatus}
            disabled={updating}
          >
            {updating ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>{action.label}</Text>}
          </TouchableOpacity>
        </View>
      )}

      {/* OTP modal */}
      <Modal visible={showOtpModal} transparent animationType="slide">
        <View style={otpModal.overlay}>
          <View style={otpModal.box}>
            <Text style={otpModal.title}>Enter Delivery OTP</Text>
            <Text style={otpModal.subtitle}>Ask the customer for their delivery OTP</Text>
            <TextInput
              style={otpModal.input}
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="Enter OTP"
              textAlign="center"
              autoFocus
            />
            <TouchableOpacity
              style={[otpModal.verifyBtn, otpVerifying && { opacity: 0.6 }]}
              onPress={verifyOtp}
              disabled={otpVerifying}
            >
              {otpVerifying ? <ActivityIndicator color="#fff" /> : <Text style={otpModal.verifyText}>Verify & Complete Delivery</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={otpModal.cancelBtn} onPress={() => { setShowOtpModal(false); setOtp(''); }}>
              <Text style={otpModal.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#666', fontSize: 16 },
  statusBanner: { padding: 20, paddingTop: 24 },
  statusLabel: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  bookingNum: { fontSize: 14, color: 'rgba(255,255,255,0.85)' },
  card: { backgroundColor: '#fff', margin: 12, marginBottom: 0, borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  routeBox: { gap: 4 },
  routePoint: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  routeDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  routeName: { fontSize: 15, fontWeight: '600', color: '#333' },
  routeSub: { fontSize: 12, color: '#888', marginTop: 2 },
  routeArrow: { marginLeft: 14, marginVertical: 4 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  infoLabel: { fontSize: 13, color: '#888' },
  infoValue: { fontSize: 13, color: '#333', fontWeight: '500', maxWidth: '55%', textAlign: 'right' },
  infoValueBold: { fontWeight: 'bold', color: THEME, fontSize: 15 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  quickBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 10, paddingVertical: 12, gap: 6 },
  quickBtnIcon: { fontSize: 18 },
  quickBtnText: { fontSize: 13, fontWeight: '700' },
  codNote: { fontSize: 14, color: '#555' },
  actionBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
  actionBtn: { borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  disabled: { opacity: 0.6 },
});

const otpModal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  box: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 24 },
  input: { borderWidth: 2, borderColor: THEME, borderRadius: 12, paddingVertical: 16, fontSize: 28, fontWeight: 'bold', color: '#333', letterSpacing: 8, marginBottom: 20 },
  verifyBtn: { backgroundColor: '#4CAF50', borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginBottom: 12 },
  verifyText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  cancelBtn: { alignItems: 'center', paddingVertical: 10 },
  cancelText: { color: '#999', fontSize: 14 },
});
