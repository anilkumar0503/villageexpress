import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
  Modal,
} from 'react-native';
import { locationsApi, bookingsApi, couponsApi, formatCurrency } from '@ve/mobile-shared';
import type { Location, CouponValidation } from '@ve/mobile-shared';

const THEME = '#4CAF50';

type Step = 1 | 2 | 3 | 4;

interface BookingForm {
  pickupLocation: Location | null;
  dropLocation: Location | null;
  parcelWeight: string;
  parcelType: 'DOCUMENTS' | 'GENERAL' | 'FRAGILE' | 'PERISHABLE';
  deliveryPriority: 'STANDARD' | 'EXPRESS' | 'OVERNIGHT';
  vehicleType: 'BIKE' | 'AUTO' | 'MINI_VAN' | 'VAN' | '';
  paymentMethod: 'WALLET' | 'COD' | 'ONLINE' | '';
  couponCode: string;
}

// ── Location picker modal ────────────────────────────────────────────────────
function LocationPickerModal({
  visible,
  title,
  locations,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  locations: Location[];
  onSelect: (loc: Location) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const filtered = locations.filter(
    l =>
      l.pointName.toLowerCase().includes(query.toLowerCase()) ||
      l.village.toLowerCase().includes(query.toLowerCase()) ||
      l.district.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={modal.container}>
        <View style={modal.header}>
          <Text style={modal.title}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={modal.close}>✕</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={modal.search}
          placeholder="Search by point, village, district..."
          value={query}
          onChangeText={setQuery}
          autoFocus
        />
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={modal.item} onPress={() => onSelect(item)}>
              <Text style={modal.itemName}>{item.pointName}</Text>
              <Text style={modal.itemSub}>
                {item.village}, {item.district} — {item.pincode}
              </Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={modal.empty}>No locations found</Text>}
        />
      </View>
    </Modal>
  );
}

// ── Main booking screen ──────────────────────────────────────────────────────
export default function BookingScreen({ navigation }: any) {
  const [step, setStep] = useState<Step>(1);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [showPickupPicker, setShowPickupPicker] = useState(false);
  const [showDropPicker, setShowDropPicker] = useState(false);
  const [pricePreview, setPricePreview] = useState<any>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Coupon
  const [couponCode, setCouponCode] = useState('');
  const [couponResult, setCouponResult] = useState<CouponValidation | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const [form, setForm] = useState<BookingForm>({
    pickupLocation: null,
    dropLocation: null,
    parcelWeight: '',
    parcelType: 'GENERAL',
    deliveryPriority: 'STANDARD',
    vehicleType: '',
    paymentMethod: '',
    couponCode: '',
  });

  useEffect(() => {
    locationsApi
      .getLocations()
      .then(res => setLocations(res.data ?? []))
      .catch(() => Alert.alert('Error', 'Could not load locations'))
      .finally(() => setLoadingLocations(false));
  }, []);

  // ── Step navigation ────────────────────────────────────────────────────────
  const goNext = async () => {
    if (step === 1) {
      if (!form.pickupLocation || !form.dropLocation) {
        Alert.alert('Missing Info', 'Please select pickup and drop locations');
        return;
      }
      if (form.pickupLocation.id === form.dropLocation.id) {
        Alert.alert('Invalid', 'Pickup and drop locations cannot be the same');
        return;
      }
    }
    if (step === 2) {
      if (!form.parcelWeight || parseFloat(form.parcelWeight) <= 0) {
        Alert.alert('Missing Info', 'Please enter a valid parcel weight');
        return;
      }
      // Fetch price preview when moving from step 2 → 3
      await fetchPricePreview();
    }
    if (step === 3 && !form.paymentMethod) {
      Alert.alert('Missing Info', 'Please select a payment method');
      return;
    }
    if (step < 4) setStep((step + 1) as Step);
  };

  const goBack = () => {
    if (step > 1) setStep((step - 1) as Step);
    else navigation.goBack();
  };

  const fetchPricePreview = async () => {
    if (!form.pickupLocation || !form.dropLocation) return;
    setLoadingPrice(true);
    try {
      const res = await bookingsApi.getPricePreview({
        pickupLocationId: form.pickupLocation.id,
        dropLocationId: form.dropLocation.id,
        parcelWeight: parseFloat(form.parcelWeight),
        parcelType: form.parcelType,
        deliveryPriority: form.deliveryPriority,
        vehicleType: form.vehicleType || undefined,
      });
      setPricePreview(res.data);
    } catch {
      Alert.alert('Error', 'Could not fetch price. Please try again.');
    } finally {
      setLoadingPrice(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    if (!pricePreview?.totalAmount) { Alert.alert('Info', 'Price must be calculated first'); return; }
    setCouponLoading(true);
    try {
      const res = await couponsApi.validateCoupon({
        code: couponCode.trim(),
        bookingAmount: pricePreview.totalAmount,
      });
      setCouponResult(res.data);
      Alert.alert('Coupon Applied!', `Discount: ₹${res.data.discountAmount.toFixed(2)} off`);
    } catch (err: any) {
      Alert.alert('Invalid Coupon', err?.response?.data?.error ?? 'Coupon could not be applied');
      setCouponResult(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.pickupLocation || !form.dropLocation || !form.paymentMethod) return;
    setSubmitting(true);
    try {
      const res = await bookingsApi.createBooking({
        pickupLocationId: form.pickupLocation.id,
        dropLocationId: form.dropLocation.id,
        parcelWeight: parseFloat(form.parcelWeight),
        parcelType: form.parcelType,
        deliveryPriority: form.deliveryPriority,
        vehicleType: form.vehicleType || undefined,
        paymentMethod: form.paymentMethod,
        couponId: couponResult?.couponId,
        finalPrice: couponResult ? couponResult.finalAmount : pricePreview?.totalAmount,
      });
      Alert.alert(
        'Booking Created!',
        `Booking #${res.data.bookingNumber} has been placed successfully.`,
        [{ text: 'View Booking', onPress: () => navigation.navigate('BookingDetails', { bookingId: res.data.id }) }],
      );
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error ?? 'Booking failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Step indicator ─────────────────────────────────────────────────────────
  const steps = ['Location', 'Parcel', 'Payment', 'Confirm'];

  if (loadingLocations) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={THEME} />
        <Text style={styles.loadingText}>Loading locations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Step indicator */}
      <View style={styles.stepBar}>
        {steps.map((label, i) => (
          <View key={label} style={styles.stepItem}>
            <View style={[styles.stepDot, i + 1 <= step && styles.stepDotActive]}>
              <Text style={[styles.stepNum, i + 1 <= step && styles.stepNumActive]}>{i + 1}</Text>
            </View>
            <Text style={[styles.stepLabel, i + 1 === step && styles.stepLabelActive]}>{label}</Text>
          </View>
        ))}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentPad}>
        {/* ── Step 1: Locations ────────────────────────────────────────────── */}
        {step === 1 && (
          <View>
            <Text style={styles.stepTitle}>Select Locations</Text>

            <Text style={styles.label}>Pickup Point</Text>
            <TouchableOpacity style={styles.picker} onPress={() => setShowPickupPicker(true)}>
              {form.pickupLocation ? (
                <>
                  <Text style={styles.pickerValue}>{form.pickupLocation.pointName}</Text>
                  <Text style={styles.pickerSub}>
                    {form.pickupLocation.village}, {form.pickupLocation.district}
                  </Text>
                </>
              ) : (
                <Text style={styles.pickerPlaceholder}>Tap to select pickup point</Text>
              )}
              <Text style={styles.pickerArrow}>▼</Text>
            </TouchableOpacity>

            <Text style={styles.label}>Drop Point</Text>
            <TouchableOpacity style={styles.picker} onPress={() => setShowDropPicker(true)}>
              {form.dropLocation ? (
                <>
                  <Text style={styles.pickerValue}>{form.dropLocation.pointName}</Text>
                  <Text style={styles.pickerSub}>
                    {form.dropLocation.village}, {form.dropLocation.district}
                  </Text>
                </>
              ) : (
                <Text style={styles.pickerPlaceholder}>Tap to select drop point</Text>
              )}
              <Text style={styles.pickerArrow}>▼</Text>
            </TouchableOpacity>

            <LocationPickerModal
              visible={showPickupPicker}
              title="Select Pickup Point"
              locations={locations}
              onSelect={loc => { setForm(f => ({ ...f, pickupLocation: loc })); setShowPickupPicker(false); }}
              onClose={() => setShowPickupPicker(false)}
            />
            <LocationPickerModal
              visible={showDropPicker}
              title="Select Drop Point"
              locations={locations}
              onSelect={loc => { setForm(f => ({ ...f, dropLocation: loc })); setShowDropPicker(false); }}
              onClose={() => setShowDropPicker(false)}
            />
          </View>
        )}

        {/* ── Step 2: Parcel Details ───────────────────────────────────────── */}
        {step === 2 && (
          <View>
            <Text style={styles.stepTitle}>Parcel Details</Text>

            <Text style={styles.label}>Weight (kg)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 2.5"
              value={form.parcelWeight}
              onChangeText={v => setForm(f => ({ ...f, parcelWeight: v }))}
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>Parcel Type</Text>
            <View style={styles.optionGrid}>
              {(['GENERAL', 'DOCUMENTS', 'FRAGILE', 'PERISHABLE'] as const).map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.option, form.parcelType === t && styles.optionActive]}
                  onPress={() => setForm(f => ({ ...f, parcelType: t }))}
                >
                  <Text style={[styles.optionText, form.parcelType === t && styles.optionTextActive]}>
                    {t === 'GENERAL' ? '📦 General' : t === 'DOCUMENTS' ? '📄 Docs' : t === 'FRAGILE' ? '🔮 Fragile' : '🧊 Perishable'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Delivery Priority</Text>
            <View style={styles.optionGrid}>
              {([
                { key: 'STANDARD', label: '📬 Standard' },
                { key: 'EXPRESS', label: '⚡ Express' },
                { key: 'OVERNIGHT', label: '🌙 Overnight' },
              ] as const).map(({ key, label }) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.option, form.deliveryPriority === key && styles.optionActive]}
                  onPress={() => setForm(f => ({ ...f, deliveryPriority: key }))}
                >
                  <Text style={[styles.optionText, form.deliveryPriority === key && styles.optionTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Vehicle Type (optional)</Text>
            <View style={styles.optionGrid}>
              {(['BIKE', 'AUTO', 'MINI_VAN', 'VAN'] as const).map(v => (
                <TouchableOpacity
                  key={v}
                  style={[styles.option, form.vehicleType === v && styles.optionActive]}
                  onPress={() => setForm(f => ({ ...f, vehicleType: f.vehicleType === v ? '' : v }))}
                >
                  <Text style={[styles.optionText, form.vehicleType === v && styles.optionTextActive]}>
                    {v === 'BIKE' ? '🏍 Bike' : v === 'AUTO' ? '🛺 Auto' : v === 'MINI_VAN' ? '🚐 Mini Van' : '🚚 Van'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ── Step 3: Payment ──────────────────────────────────────────────── */}
        {step === 3 && (
          <View>
            <Text style={styles.stepTitle}>Payment Method</Text>

            {loadingPrice ? (
              <View style={styles.center}>
                <ActivityIndicator color={THEME} />
                <Text style={styles.loadingText}>Calculating price...</Text>
              </View>
            ) : pricePreview ? (
              <>
                <View style={styles.priceCard}>
                  <Text style={styles.priceTitle}>Price Breakdown</Text>
                  <Row label="Base Price" value={formatCurrency(pricePreview.basePrice)} />
                  <Row label="Distance Charge" value={formatCurrency(pricePreview.distanceCharge)} />
                  <Row label="Weight Charge" value={formatCurrency(pricePreview.weightCharge)} />
                  {pricePreview.prioritySurcharge > 0 && (
                    <Row label="Priority Surcharge" value={formatCurrency(pricePreview.prioritySurcharge)} />
                  )}
                  <View style={styles.divider} />
                  <Row label="Total" value={formatCurrency(pricePreview.totalAmount)} bold />
                  <Text style={styles.deliveryEst}>
                    Estimated delivery: {pricePreview.estimatedDeliveryDays} day(s)
                  </Text>
                  {/* Coupon applied discount */}
                  {couponResult && (
                    <View style={styles.couponApplied}>
                      <Text style={styles.couponAppliedText}>🎟️ Coupon: -{formatCurrency(couponResult.discountAmount)}</Text>
                      <Text style={styles.couponFinal}>You pay: {formatCurrency(couponResult.finalAmount)}</Text>
                    </View>
                  )}
                </View>

                {/* Coupon input */}
                <View style={styles.couponRow}>
                  <TextInput
                    style={styles.couponInput}
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChangeText={t => { setCouponCode(t.toUpperCase()); setCouponResult(null); }}
                    autoCapitalize="characters"
                    editable={!couponResult}
                  />
                  <TouchableOpacity
                    style={[styles.couponBtn, (!couponCode.trim() || couponLoading) && styles.couponBtnDisabled]}
                    onPress={couponResult ? () => { setCouponResult(null); setCouponCode(''); } : handleApplyCoupon}
                    disabled={couponLoading}
                  >
                    {couponLoading
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={styles.couponBtnText}>{couponResult ? 'Remove' : 'Apply'}</Text>}
                  </TouchableOpacity>
                </View>
              </>
            ) : null}

            <Text style={styles.label}>Select Payment Method</Text>
            {([
              { key: 'WALLET', label: '💰 Wallet Balance' },
              { key: 'COD', label: '💵 Cash on Delivery' },
              { key: 'ONLINE', label: '💳 Online (UPI/Card)' },
            ] as const).map(({ key, label }) => (
              <TouchableOpacity
                key={key}
                style={[styles.payOption, form.paymentMethod === key && styles.payOptionActive]}
                onPress={() => setForm(f => ({ ...f, paymentMethod: key }))}
              >
                <Text style={[styles.payOptionText, form.paymentMethod === key && styles.payOptionTextActive]}>
                  {label}
                </Text>
                {form.paymentMethod === key && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── Step 4: Confirm ──────────────────────────────────────────────── */}
        {step === 4 && (
          <View>
            <Text style={styles.stepTitle}>Confirm Booking</Text>

            <View style={styles.confirmCard}>
              <ConfirmRow label="From" value={`${form.pickupLocation?.pointName}, ${form.pickupLocation?.village}`} />
              <ConfirmRow label="To" value={`${form.dropLocation?.pointName}, ${form.dropLocation?.village}`} />
              <ConfirmRow label="Weight" value={`${form.parcelWeight} kg`} />
              <ConfirmRow label="Parcel Type" value={form.parcelType} />
              <ConfirmRow label="Priority" value={form.deliveryPriority} />
              {form.vehicleType && <ConfirmRow label="Vehicle" value={form.vehicleType} />}
              <ConfirmRow label="Payment" value={form.paymentMethod} />
              {pricePreview && <ConfirmRow label="Total Amount" value={formatCurrency(pricePreview.totalAmount)} bold />}
            </View>

            <Text style={styles.disclaimer}>
              By confirming, you agree to Village Express terms & conditions.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ── Bottom action bar ──────────────────────────────────────────────── */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.backBtn} onPress={goBack}>
          <Text style={styles.backBtnText}>{step === 1 ? 'Cancel' : '← Back'}</Text>
        </TouchableOpacity>

        {step < 4 ? (
          <TouchableOpacity style={styles.nextBtn} onPress={goNext}>
            <Text style={styles.nextBtnText}>Next →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.nextBtn, submitting && styles.disabled]} onPress={handleSubmit} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.nextBtnText}>Confirm Booking</Text>}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ── Small helpers ────────────────────────────────────────────────────────────
function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, bold && styles.rowValueBold]}>{value}</Text>
    </View>
  );
}

function ConfirmRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.confirmRow}>
      <Text style={styles.confirmLabel}>{label}</Text>
      <Text style={[styles.confirmValue, bold && styles.confirmValueBold]}>{value}</Text>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  loadingText: { marginTop: 10, color: '#666' },

  // Step bar
  stepBar: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#fff', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  stepItem: { alignItems: 'center' },
  stepDot: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#ccc', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  stepDotActive: { backgroundColor: THEME, borderColor: THEME },
  stepNum: { fontSize: 13, color: '#ccc', fontWeight: '600' },
  stepNumActive: { color: '#fff' },
  stepLabel: { fontSize: 10, color: '#999' },
  stepLabelActive: { color: THEME, fontWeight: '600' },

  // Content
  content: { flex: 1 },
  contentPad: { padding: 20, paddingBottom: 30 },
  stepTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 20 },

  // Location picker
  label: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 14 },
  picker: { backgroundColor: '#fff', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#ddd', flexDirection: 'row', alignItems: 'center' },
  pickerValue: { flex: 1, fontSize: 15, fontWeight: '600', color: '#333' },
  pickerSub: { color: '#777', fontSize: 12, marginTop: 2 },
  pickerPlaceholder: { flex: 1, fontSize: 14, color: '#aaa' },
  pickerArrow: { fontSize: 12, color: '#aaa' },

  // Inputs
  input: { backgroundColor: '#fff', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#ddd', fontSize: 16 },

  // Option grid
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  option: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#fff' },
  optionActive: { borderColor: THEME, backgroundColor: '#e8f5e9' },
  optionText: { fontSize: 13, color: '#555' },
  optionTextActive: { color: THEME, fontWeight: '600' },

  // Price card
  priceCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e8f5e9' },
  priceTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  rowLabel: { color: '#666', fontSize: 14 },
  rowValue: { color: '#333', fontSize: 14 },
  rowValueBold: { fontWeight: 'bold', color: THEME, fontSize: 16 },
  deliveryEst: { fontSize: 12, color: '#888', marginTop: 8, textAlign: 'right' },
  couponRow: { flexDirection: 'row', gap: 8, marginTop: 12, marginBottom: 4 },
  couponInput: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 14, letterSpacing: 1 },
  couponBtn: { backgroundColor: THEME, borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' },
  couponBtnDisabled: { opacity: 0.5 },
  couponBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  couponApplied: { backgroundColor: '#E8F5E9', borderRadius: 8, padding: 10, marginTop: 12, borderWidth: 1, borderColor: '#A5D6A7' },
  couponAppliedText: { fontSize: 13, color: '#2E7D32', fontWeight: '600', marginBottom: 4 },
  couponFinal: { fontSize: 16, fontWeight: 'bold', color: THEME },

  // Payment options
  payOption: { backgroundColor: '#fff', borderRadius: 10, padding: 16, borderWidth: 1.5, borderColor: '#ddd', marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  payOptionActive: { borderColor: THEME, backgroundColor: '#e8f5e9' },
  payOptionText: { flex: 1, fontSize: 15, color: '#555' },
  payOptionTextActive: { color: THEME, fontWeight: '600' },
  checkmark: { fontSize: 16, color: THEME, fontWeight: 'bold' },

  // Confirm
  confirmCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#ddd' },
  confirmRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  confirmLabel: { color: '#888', fontSize: 14 },
  confirmValue: { color: '#333', fontSize: 14, fontWeight: '500', maxWidth: '55%', textAlign: 'right' },
  confirmValueBold: { fontWeight: 'bold', color: THEME, fontSize: 16 },
  disclaimer: { fontSize: 12, color: '#aaa', marginTop: 16, textAlign: 'center' },

  // Footer
  footer: { flexDirection: 'row', padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', gap: 12 },
  backBtn: { flex: 1, borderWidth: 1.5, borderColor: THEME, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  backBtnText: { color: THEME, fontWeight: '600', fontSize: 15 },
  nextBtn: { flex: 2, backgroundColor: THEME, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  nextBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  disabled: { opacity: 0.6 },
});

const modal = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  close: { fontSize: 18, color: '#666', padding: 4 },
  search: { margin: 12, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 10, fontSize: 15 },
  item: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  itemName: { fontSize: 15, fontWeight: '600', color: '#333' },
  itemSub: { fontSize: 13, color: '#888', marginTop: 2 },
  empty: { padding: 30, textAlign: 'center', color: '#aaa' },
});
