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
  TextInput,
} from 'react-native';
import { bookingsApi, ratingsApi, getStatusColor, getStatusLabel, formatCurrency, formatDateTime } from '@ve/mobile-shared';

// react-native-maps: needs native rebuild (npx expo run:android/ios)
let MapView: any = null;
let Marker: any = null;
let Polyline: any = null;
try {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
  Polyline = Maps.Polyline;
} catch {
  // Not linked yet — map card replaced with a text fallback
}
import type { Booking } from '@ve/mobile-shared';

const THEME = '#4CAF50';

const STATUS_TIMELINE = [
  'PENDING',
  'CONFIRMED',
  'RECEIVED_AT_POINT',
  'ASSIGNED',
  'PICKED_UP',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
];

function TimelineStep({ status, currentStatus, label }: { status: string; currentStatus: string; label: string }) {
  const currentIdx = STATUS_TIMELINE.indexOf(currentStatus);
  const stepIdx = STATUS_TIMELINE.indexOf(status);
  const done = stepIdx <= currentIdx;
  const active = stepIdx === currentIdx;

  return (
    <View style={timeline.row}>
      <View style={timeline.left}>
        <View style={[timeline.dot, done && timeline.dotDone, active && timeline.dotActive]}>
          {done && <Text style={timeline.check}>✓</Text>}
        </View>
        {stepIdx < STATUS_TIMELINE.length - 1 && (
          <View style={[timeline.line, done && timeline.lineDone]} />
        )}
      </View>
      <Text style={[timeline.label, done && timeline.labelDone, active && timeline.labelActive]}>
        {label}
      </Text>
    </View>
  );
}

// ── Tracking Map Card ────────────────────────────────────────────────────────
function TrackingMapCard({ booking }: { booking: Booking }) {
  // Use placeholder coords when geocoding is not available.
  // In production, backend should supply lat/lng on pickupLocation / dropLocation.
  const pickup = (booking.pickupLocation as any);
  const drop   = (booking.dropLocation as any);
  const hasCoords = pickup?.latitude && pickup?.longitude && drop?.latitude && drop?.longitude;

  if (!MapView) {
    // Fallback when react-native-maps is not yet linked (before native rebuild)
    return (
      <View style={[styles.card, mapCard.fallback]}>
        <Text style={mapCard.fallbackIcon}>🗺️</Text>
        <Text style={mapCard.fallbackTitle}>Live Tracking</Text>
        <Text style={mapCard.fallbackText}>
          {booking.captain
            ? `Captain ${booking.captain.name} is handling your delivery`
            : 'Tracking available once a captain is assigned'}
        </Text>
        {hasCoords === false && (
          <Text style={mapCard.fallbackNote}>Map will show when location data is available</Text>
        )}
      </View>
    );
  }

  if (!hasCoords) {
    return (
      <View style={[styles.card, mapCard.fallback]}>
        <Text style={mapCard.fallbackIcon}>📍</Text>
        <Text style={mapCard.fallbackTitle}>Delivery in Progress</Text>
        <Text style={mapCard.fallbackText}>
          {booking.captain ? `Captain: ${booking.captain.name}` : 'Locating captain...'}
        </Text>
      </View>
    );
  }

  const pickupCoord = { latitude: parseFloat(pickup.latitude), longitude: parseFloat(pickup.longitude) };
  const dropCoord   = { latitude: parseFloat(drop.latitude),   longitude: parseFloat(drop.longitude) };
  const midLat = (pickupCoord.latitude  + dropCoord.latitude)  / 2;
  const midLng = (pickupCoord.longitude + dropCoord.longitude) / 2;

  return (
    <View style={[styles.card, { padding: 0, overflow: 'hidden' }]}>
      <View style={mapCard.header}>
        <Text style={styles.cardTitle}>Live Tracking</Text>
        {booking.captain && <Text style={mapCard.captainBadge}>🏍 {booking.captain.name}</Text>}
      </View>
      <MapView
        style={mapCard.map}
        initialRegion={{
          latitude: midLat,
          longitude: midLng,
          latitudeDelta: Math.abs(pickupCoord.latitude - dropCoord.latitude) * 2 + 0.05,
          longitudeDelta: Math.abs(pickupCoord.longitude - dropCoord.longitude) * 2 + 0.05,
        }}
        scrollEnabled={false}
        zoomEnabled={false}
      >
        <Marker coordinate={pickupCoord} title="Pickup" pinColor="#4CAF50" />
        <Marker coordinate={dropCoord}   title="Delivery" pinColor="#f44336" />
        <Polyline
          coordinates={[pickupCoord, dropCoord]}
          strokeColor="#4CAF50"
          strokeWidth={2}
          lineDashPattern={[8, 4]}
        />
      </MapView>
      <View style={mapCard.footer}>
        <Text style={mapCard.footerText}>
          {booking.status === 'OUT_FOR_DELIVERY' ? '🚚 Captain is on the way to deliver your parcel' :
           booking.status === 'IN_TRANSIT' ? '🚛 Parcel is in transit' :
           '📦 Parcel picked up — moving to transit hub'}
        </Text>
      </View>
    </View>
  );
}

export default function BookingDetailsScreen({ route, navigation }: any) {
  const { bookingId } = route.params;
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  // Wallet payment
  const [payingWallet, setPayingWallet] = useState(false);
  // Rating
  const [showRating, setShowRating] = useState(false);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [rated, setRated] = useState(false);

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

  const handleCancel = async () => {
    const reason = cancelReason.trim();
    if (!reason) { Alert.alert('Required', 'Please enter a cancellation reason'); return; }
    setCancelling(true);
    try {
      await bookingsApi.cancelBooking(bookingId, reason);
      setShowCancelModal(false);
      Alert.alert('Cancelled', 'Your booking has been cancelled. Any paid amount will be refunded to your wallet.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error ?? 'Could not cancel booking. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const handleWalletPayment = () => {
    Alert.alert(
      'Pay with Wallet',
      `Pay ${formatCurrency(booking?.calculatedPrice ?? 0)} from your wallet balance?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pay Now', onPress: async () => {
            setPayingWallet(true);
            try {
              const res = await bookingsApi.walletPayment(bookingId);
              if (res.success) {
                const partial = res.data?.partialPayment;
                Alert.alert(
                  partial ? 'Partial Payment Done' : 'Payment Successful!',
                  partial
                    ? `Wallet deducted. Remaining ${formatCurrency(res.data.remainingAmount)} to be paid via COD.`
                    : 'Your booking is confirmed.',
                );
                load();
              } else {
                Alert.alert('Failed', (res as any).error ?? 'Payment failed');
              }
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.error ?? 'Insufficient wallet balance or payment failed');
            } finally {
              setPayingWallet(false);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={THEME} />
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Booking not found</Text>
      </View>
    );
  }

  const handleSubmitRating = async () => {
    if (!ratingValue) { Alert.alert('Required', 'Please select a star rating'); return; }
    setRatingSubmitting(true);
    try {
      await ratingsApi.submitRating({ bookingId: booking.id, rating: ratingValue, comment: ratingComment.trim() || undefined });
      setRated(true);
      setShowRating(false);
      Alert.alert('Thank you!', 'Your rating has been submitted.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error ?? 'Could not submit rating');
    } finally {
      setRatingSubmitting(false);
    }
  };

  const statusColor = getStatusColor(booking.status);
  const canCancel = ['PENDING', 'PAYMENT_FAILED', 'CONFIRMED', 'ASSIGNED'].includes(booking.status);
  const canPayWallet = booking.paymentMethod === 'WALLET' && !['PAID', 'COMPLETED'].includes(booking.paymentStatus) && booking.status !== 'CANCELLED';
  const isDelivered = booking.status === 'DELIVERED';

  return (
    <ScrollView
      style={styles.root}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[THEME]} />}
    >
      {/* Status banner */}
      <View style={[styles.statusBanner, { backgroundColor: statusColor }]}>
        <Text style={styles.statusLabel}>{getStatusLabel(booking.status)}</Text>
        <Text style={styles.bookingNum}>#{booking.bookingNumber}</Text>
      </View>

      {/* Route card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Route</Text>
        <View style={styles.routeBox}>
          <View style={styles.routePoint}>
            <View style={[styles.routeDot, { backgroundColor: THEME }]} />
            <View style={styles.routeInfo}>
              <Text style={styles.routePointName}>{booking.pickupLocation.pointName}</Text>
              <Text style={styles.routePointSub}>
                {booking.pickupLocation.village}, {booking.pickupLocation.district}
              </Text>
            </View>
          </View>
          <View style={styles.routeLineFull} />
          <View style={styles.routePoint}>
            <View style={[styles.routeDot, { backgroundColor: '#f44336' }]} />
            <View style={styles.routeInfo}>
              <Text style={styles.routePointName}>{booking.dropLocation.pointName}</Text>
              <Text style={styles.routePointSub}>
                {booking.dropLocation.village}, {booking.dropLocation.district}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Parcel & payment info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Parcel Info</Text>
        <InfoRow label="Parcel Type" value={booking.parcelType} />
        <InfoRow label="Weight" value={`${booking.parcelWeight} kg`} />
        <InfoRow label="Priority" value={booking.deliveryPriority} />
        <InfoRow label="Payment" value={booking.paymentMethod} />
        <InfoRow label="Payment Status" value={booking.paymentStatus} />
        <InfoRow label="Amount" value={formatCurrency(booking.calculatedPrice)} bold />
        <InfoRow label="Booked On" value={formatDateTime(booking.createdAt)} />
        <InfoRow label="Est. Delivery" value={booking.estimatedDeliveryDate ? formatDateTime(booking.estimatedDeliveryDate) : 'TBD'} />
      </View>

      {/* Captain / PM info */}
      {booking.captain && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Assigned Captain</Text>
          <InfoRow label="Name" value={booking.captain.name} />
          <InfoRow label="Phone" value={booking.captain.phone} />
          <InfoRow label="ID" value={booking.captain.displayId} />
        </View>
      )}

      {booking.pointManager && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Point Manager</Text>
          <InfoRow label="Name" value={booking.pointManager.name} />
          <InfoRow label="Phone" value={booking.pointManager.phone} />
        </View>
      )}

      {/* Delivery OTP (shown when booking is out for delivery) */}
      {booking.status === 'OUT_FOR_DELIVERY' && (
        <View style={[styles.card, styles.otpCard]}>
          <Text style={styles.otpLabel}>Delivery OTP</Text>
          <Text style={styles.otpNote}>Share this OTP with the captain upon delivery</Text>
          <Text style={styles.otpHint}>Check your registered phone for OTP</Text>
        </View>
      )}

      {/* Live Map Card (visible once captain is assigned and moving) */}
      {['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(booking.status) && (
        <TrackingMapCard booking={booking} />
      )}

      {/* Tracking timeline */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Tracking</Text>
        {STATUS_TIMELINE.map(s => (
          <TimelineStep
            key={s}
            status={s}
            currentStatus={booking.status}
            label={getStatusLabel(s)}
          />
        ))}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {/* Pay with Wallet */}
        {canPayWallet && (
          <TouchableOpacity
            style={[styles.walletBtn, payingWallet && styles.disabled]}
            onPress={handleWalletPayment}
            disabled={payingWallet}
          >
            {payingWallet
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.walletBtnText}>💰 Pay with Wallet</Text>}
          </TouchableOpacity>
        )}
        {/* Cancel Booking */}
        {canCancel && (
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => { setCancelReason(''); setShowCancelModal(true); }}
          >
            <Text style={styles.cancelBtnText}>Cancel Booking</Text>
          </TouchableOpacity>
        )}
        {/* Rate Captain */}
        {isDelivered && !rated && booking.captain && (
          <TouchableOpacity style={styles.rateBtn} onPress={() => setShowRating(true)}>
            <Text style={styles.rateBtnText}>⭐ Rate Captain</Text>
          </TouchableOpacity>
        )}
        {(isDelivered && (rated || !booking.captain)) && (
          <View style={styles.deliveredBadge}>
            <Text style={styles.deliveredText}>✓ Delivered Successfully</Text>
          </View>
        )}
      </View>

      {/* Cancel Reason Modal */}
      <Modal visible={showCancelModal} transparent animationType="slide" onRequestClose={() => setShowCancelModal(false)}>
        <View style={cancelModal.overlay}>
          <View style={cancelModal.box}>
            <Text style={cancelModal.title}>Cancel Booking</Text>
            <Text style={cancelModal.subtitle}>Please tell us why you want to cancel. Any paid amount will be refunded to your wallet.</Text>
            <TextInput
              style={cancelModal.input}
              placeholder="Enter reason for cancellation..."
              value={cancelReason}
              onChangeText={setCancelReason}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              autoFocus
            />
            <View style={cancelModal.row}>
              <TouchableOpacity style={cancelModal.btnOutline} onPress={() => setShowCancelModal(false)}>
                <Text style={cancelModal.btnOutlineText}>Keep Booking</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[cancelModal.btnDanger, cancelling && styles.disabled]}
                onPress={handleCancel}
                disabled={cancelling}
              >
                {cancelling
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={cancelModal.btnDangerText}>Yes, Cancel</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Rating Modal */}
      <Modal visible={showRating} transparent animationType="slide">
        <View style={ratingModal.overlay}>
          <View style={ratingModal.box}>
            <View style={ratingModal.header}>
              <Text style={ratingModal.title}>Rate Your Captain</Text>
              <TouchableOpacity onPress={() => setShowRating(false)}><Text style={ratingModal.close}>✕</Text></TouchableOpacity>
            </View>
            {booking.captain && (
              <Text style={ratingModal.captainName}>🛵 {booking.captain.name}</Text>
            )}
            <Text style={ratingModal.starLabel}>How was your experience?</Text>
            <View style={ratingModal.stars}>
              {[1,2,3,4,5].map(s => (
                <TouchableOpacity key={s} onPress={() => setRatingValue(s)}>
                  <Text style={[ratingModal.star, s <= ratingValue && ratingModal.starFilled]}>★</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={ratingModal.comment}
              placeholder="Leave a comment (optional)..."
              value={ratingComment}
              onChangeText={setRatingComment}
              multiline
              numberOfLines={3}
            />
            <TouchableOpacity
              style={[ratingModal.submitBtn, ratingSubmitting && ratingModal.disabled]}
              onPress={handleSubmitRating}
              disabled={ratingSubmitting}
            >
              {ratingSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={ratingModal.submitText}>Submit Rating</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
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
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 14 },
  routeBox: { paddingLeft: 4 },
  routePoint: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 4 },
  routeDot: { width: 10, height: 10, borderRadius: 5, marginTop: 3, marginRight: 10 },
  routeInfo: { flex: 1 },
  routePointName: { fontSize: 15, fontWeight: '600', color: '#333' },
  routePointSub: { fontSize: 12, color: '#888', marginTop: 2 },
  routeLineFull: { width: 1, height: 16, backgroundColor: '#ddd', marginLeft: 4, marginVertical: 4 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  infoLabel: { fontSize: 13, color: '#888' },
  infoValue: { fontSize: 13, color: '#333', fontWeight: '500', maxWidth: '55%', textAlign: 'right' },
  infoValueBold: { fontWeight: 'bold', color: THEME, fontSize: 15 },
  otpCard: { backgroundColor: '#e8f5e9', borderWidth: 1, borderColor: THEME },
  otpLabel: { fontSize: 16, fontWeight: 'bold', color: THEME, marginBottom: 4 },
  otpNote: { fontSize: 13, color: '#555' },
  otpHint: { fontSize: 12, color: '#888', marginTop: 4 },
  actions: { padding: 16, paddingBottom: 30 },
  walletBtn: { backgroundColor: THEME, borderRadius: 10, paddingVertical: 15, alignItems: 'center', marginBottom: 10 },
  walletBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  cancelBtn: { borderWidth: 1.5, borderColor: '#f44336', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  cancelBtnText: { color: '#f44336', fontWeight: '600', fontSize: 15 },
  deliveredBadge: { backgroundColor: '#e8f5e9', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  deliveredText: { color: THEME, fontWeight: '700', fontSize: 16 },
  rateBtn: { backgroundColor: '#FFF9C4', borderWidth: 1.5, borderColor: '#F9A825', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  rateBtnText: { color: '#F57F17', fontWeight: 'bold', fontSize: 15 },
  disabled: { opacity: 0.5 },
});

const ratingModal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  box: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  close: { fontSize: 20, color: '#888', padding: 4 },
  captainName: { fontSize: 14, color: '#666', marginBottom: 16 },
  starLabel: { fontSize: 14, color: '#555', marginBottom: 12 },
  stars: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 16 },
  star: { fontSize: 42, color: '#ddd' },
  starFilled: { color: '#F9A825' },
  comment: { backgroundColor: '#f8f8f8', borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 12, fontSize: 14, minHeight: 80, textAlignVertical: 'top', marginBottom: 16 },
  submitBtn: { backgroundColor: THEME, borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  disabled: { opacity: 0.6 },
});

const mapCard = StyleSheet.create({
  fallback: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  fallbackIcon: { fontSize: 36 },
  fallbackTitle: { fontSize: 15, fontWeight: '700', color: '#333' },
  fallbackText: { fontSize: 13, color: '#666', textAlign: 'center' },
  fallbackNote: { fontSize: 11, color: '#aaa', textAlign: 'center', marginTop: 4 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 8 },
  captainBadge: { fontSize: 12, color: '#666' },
  map: { width: '100%', height: 180 },
  footer: { padding: 12, backgroundColor: '#f5f5f5' },
  footerText: { fontSize: 12, color: '#555', textAlign: 'center' },
});

const cancelModal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  box: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  subtitle: { fontSize: 13, color: '#666', lineHeight: 20, marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 14, fontSize: 14, minHeight: 90, marginBottom: 20, backgroundColor: '#f9f9f9' },
  row: { flexDirection: 'row', gap: 10 },
  btnOutline: { flex: 1, borderWidth: 1.5, borderColor: '#999', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  btnOutlineText: { color: '#555', fontWeight: '600', fontSize: 14 },
  btnDanger: { flex: 1, backgroundColor: '#f44336', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  btnDangerText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});

const timeline = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 0 },
  left: { alignItems: 'center', marginRight: 12 },
  dot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#ccc', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  dotDone: { backgroundColor: '#e8f5e9', borderColor: THEME },
  dotActive: { backgroundColor: THEME, borderColor: THEME },
  check: { fontSize: 10, color: THEME, fontWeight: 'bold' },
  line: { width: 2, height: 24, backgroundColor: '#eee', marginTop: 2 },
  lineDone: { backgroundColor: THEME },
  label: { paddingTop: 2, fontSize: 13, color: '#bbb', paddingBottom: 22 },
  labelDone: { color: '#555' },
  labelActive: { color: THEME, fontWeight: '700', fontSize: 14 },
});
