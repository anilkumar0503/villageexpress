import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Alert, ActivityIndicator,
  TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { profileApi } from '@ve/mobile-shared';
import * as ImagePicker from 'expo-image-picker';

const THEME = '#2196F3';
const VEHICLE_TYPES = ['BIKE', 'AUTO', 'MINI_VAN', 'VAN'];

// Guides captains through KYC onboarding.
// Document photos are uploaded to cloud storage immediately after picking —
// only the returned public URL is stored (never a local file:// path).

export default function OnboardingScreen({ navigation }: any) {
  const [step, setStep] = useState(1);

  // Step 1: Aadhaar
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [aadhaarFileUrl, setAadhaarFileUrl] = useState('');   // permanent cloud URL
  const [aadhaarPreview, setAadhaarPreview] = useState('');   // local URI for preview only
  const [aadhaarUploading, setAadhaarUploading] = useState(false);

  // Step 2: Driving Licence
  const [drivingLicense, setDrivingLicense] = useState('');
  const [licenseFileUrl, setLicenseFileUrl] = useState('');   // permanent cloud URL
  const [licensePreview, setLicensePreview] = useState('');   // local URI for preview only
  const [licenseUploading, setLicenseUploading] = useState(false);

  // Step 3: Vehicle
  const [vehicleType, setVehicleType] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');

  const [submitting, setSubmitting] = useState(false);

  // ── Upload helper ────────────────────────────────────────────────────────────
  // Uploads a local URI to cloud storage and returns the permanent public URL.
  const uploadToCloud = async (
    localUri: string,
    folder: 'aadhaar' | 'driving-license',
    setUploading: (v: boolean) => void,
    setUrl: (url: string) => void,
  ) => {
    setUploading(true);
    try {
      const publicUrl = await profileApi.uploadDocument(localUri, folder, 'image/jpeg');
      setUrl(publicUrl);
    } catch (err: any) {
      Alert.alert(
        'Upload Failed',
        err?.message ?? 'Could not upload document photo. Please try again.',
      );
    } finally {
      setUploading(false);
    }
  };

  // ── Image picker ─────────────────────────────────────────────────────────────
  const pickImage = (type: 'aadhaar' | 'license') => {
    const folder = type === 'aadhaar' ? 'aadhaar' : 'driving-license';
    const setPreview = type === 'aadhaar' ? setAadhaarPreview : setLicensePreview;
    const setUploading = type === 'aadhaar' ? setAadhaarUploading : setLicenseUploading;
    const setUrl = type === 'aadhaar' ? setAadhaarFileUrl : setLicenseFileUrl;

    const handleResult = (uri: string) => {
      setPreview(uri);
      uploadToCloud(uri, folder, setUploading, setUrl);
    };

    Alert.alert(
      'Upload Document Photo',
      'Choose a source for your document photo',
      [
        {
          text: 'Camera',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission Required', 'Camera access is needed to take photos.');
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              quality: 0.8,
            });
            if (!result.canceled && result.assets[0]?.uri) handleResult(result.assets[0].uri);
          },
        },
        {
          text: 'Gallery',
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission Required', 'Photo library access is needed to select images.');
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              quality: 0.8,
            });
            if (!result.canceled && result.assets[0]?.uri) handleResult(result.assets[0].uri);
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  };

  // ── Validation ───────────────────────────────────────────────────────────────
  const validateStep = () => {
    if (step === 1) {
      if (!/^\d{12}$/.test(aadhaarNumber)) { Alert.alert('Error', 'Enter a valid 12-digit Aadhaar number'); return false; }
      return true;
    }
    if (step === 2) {
      if (!drivingLicense.trim()) { Alert.alert('Error', 'Enter your driving licence number'); return false; }
      return true;
    }
    if (step === 3) {
      if (!vehicleType) { Alert.alert('Error', 'Select your vehicle type'); return false; }
      if (!vehicleNumber.trim()) { Alert.alert('Error', 'Enter your vehicle registration number'); return false; }
      return true;
    }
    return true;
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await profileApi.submitOnboarding({
        aadhaarNumber,
        aadhaarFileUrl: aadhaarFileUrl.trim() || undefined,
        drivingLicense,
        licenseFileUrl: licenseFileUrl.trim() || undefined,
        vehicleType,
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        districtIds: ['default'],   // Admin assigns district after review
        selectedPoints: ['default'],
      });
      Alert.alert(
        'Onboarding Submitted!',
        'Your documents have been submitted for verification. You will be notified once KYC is approved.',
        [{ text: 'OK', onPress: () => navigation.navigate('HomeMain') }],
      );
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error ?? 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const STEPS = ['Aadhaar', 'Licence', 'Vehicle', 'Review'];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Captain Onboarding</Text>
          <Text style={styles.bannerSub}>Complete KYC to start accepting deliveries</Text>
        </View>

        {/* Step indicator */}
        <View style={styles.stepRow}>
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <View style={[styles.stepCircle, step > i && styles.stepDone, step === i + 1 && styles.stepActive]}>
                {step > i + 1
                  ? <Text style={styles.stepCheckmark}>✓</Text>
                  : <Text style={styles.stepNum}>{i + 1}</Text>}
              </View>
              {i < STEPS.length - 1 && <View style={[styles.stepLine, step > i + 1 && styles.stepLineDone]} />}
            </React.Fragment>
          ))}
        </View>
        <View style={styles.stepLabelRow}>
          {STEPS.map(s => <Text key={s} style={styles.stepLabel}>{s}</Text>)}
        </View>

        {/* STEP 1: Aadhaar */}
        {step === 1 && (
          <View style={styles.form}>
            <Text style={styles.stepTitle}>Aadhaar Card</Text>
            <Text style={styles.stepDesc}>Your Aadhaar will be verified by our team.</Text>

            <Field
              label="Aadhaar Number (12 digits)"
              value={aadhaarNumber}
              onChangeText={setAadhaarNumber}
              keyboardType="number-pad"
              maxLength={12}
              placeholder="Enter 12-digit Aadhaar"
            />

            <Text style={styles.label}>Aadhaar Photo (optional)</Text>
            <TouchableOpacity
              style={[styles.pickerBtn, aadhaarUploading && styles.disabled]}
              onPress={() => !aadhaarUploading && pickImage('aadhaar')}
            >
              {aadhaarUploading
                ? <><ActivityIndicator size="small" color={THEME} /><Text style={[styles.pickerBtnText, { marginLeft: 8 }]}>Uploading…</Text></>
                : <Text style={styles.pickerBtnText}>{aadhaarFileUrl ? '🔄 Change Aadhaar Photo' : '📷 Upload Aadhaar Photo'}</Text>
              }
            </TouchableOpacity>
            {aadhaarPreview ? (
              <View>
                <Image source={{ uri: aadhaarPreview }} style={styles.preview} resizeMode="cover" />
                {aadhaarFileUrl
                  ? <Text style={styles.uploadedBadge}>✓ Uploaded to cloud</Text>
                  : <Text style={styles.uploadingBadge}>Uploading…</Text>}
              </View>
            ) : null}

            <NavButtons onNext={() => { if (validateStep()) setStep(2); }} />
          </View>
        )}

        {/* STEP 2: Driving Licence */}
        {step === 2 && (
          <View style={styles.form}>
            <Text style={styles.stepTitle}>Driving Licence</Text>
            <Text style={styles.stepDesc}>A valid driving licence is required to deliver.</Text>

            <Field
              label="Driving Licence Number"
              value={drivingLicense}
              onChangeText={setDrivingLicense}
              autoCapitalize="characters"
              placeholder="e.g. TN0119XXXXXXXX"
            />

            <Text style={styles.label}>Licence Photo (optional)</Text>
            <TouchableOpacity
              style={[styles.pickerBtn, licenseUploading && styles.disabled]}
              onPress={() => !licenseUploading && pickImage('license')}
            >
              {licenseUploading
                ? <><ActivityIndicator size="small" color={THEME} /><Text style={[styles.pickerBtnText, { marginLeft: 8 }]}>Uploading…</Text></>
                : <Text style={styles.pickerBtnText}>{licenseFileUrl ? '🔄 Change Licence Photo' : '📷 Upload Licence Photo'}</Text>
              }
            </TouchableOpacity>
            {licensePreview ? (
              <View>
                <Image source={{ uri: licensePreview }} style={styles.preview} resizeMode="cover" />
                {licenseFileUrl
                  ? <Text style={styles.uploadedBadge}>✓ Uploaded to cloud</Text>
                  : <Text style={styles.uploadingBadge}>Uploading…</Text>}
              </View>
            ) : null}

            <NavButtons onBack={() => setStep(1)} onNext={() => { if (validateStep()) setStep(3); }} />
          </View>
        )}

        {/* STEP 3: Vehicle */}
        {step === 3 && (
          <View style={styles.form}>
            <Text style={styles.stepTitle}>Vehicle Details</Text>
            <Text style={styles.stepDesc}>Tell us about the vehicle you'll use for deliveries.</Text>

            <Text style={styles.label}>Vehicle Type</Text>
            <View style={styles.chipRow}>
              {VEHICLE_TYPES.map(v => (
                <TouchableOpacity key={v} style={[styles.chip, vehicleType === v && styles.chipSelected]} onPress={() => setVehicleType(v)}>
                  <Text style={[styles.chipText, vehicleType === v && styles.chipTextSelected]}>
                    {v === 'BIKE' ? '🏍 Bike' : v === 'AUTO' ? '🛺 Auto' : v === 'MINI_VAN' ? '🚐 Mini Van' : '🚚 Van'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Field
              label="Vehicle Registration Number"
              value={vehicleNumber}
              onChangeText={setVehicleNumber}
              autoCapitalize="characters"
              placeholder="e.g. TN01AB1234"
            />

            <NavButtons onBack={() => setStep(2)} onNext={() => { if (validateStep()) setStep(4); }} />
          </View>
        )}

        {/* STEP 4: Review + Submit */}
        {step === 4 && (
          <View style={styles.form}>
            <Text style={styles.stepTitle}>Review & Submit</Text>

            <View style={styles.reviewCard}>
              <ReviewRow label="Aadhaar No." value={aadhaarNumber} />
              <ReviewRow label="Aadhaar Photo" value={aadhaarFileUrl ? 'Uploaded ✓' : aadhaarPreview ? 'Upload failed ⚠️' : 'Not provided'} />
              <ReviewRow label="Driving Licence" value={drivingLicense} />
              <ReviewRow label="Licence Photo" value={licenseFileUrl ? 'Uploaded ✓' : licensePreview ? 'Upload failed ⚠️' : 'Not provided'} />
              <ReviewRow label="Vehicle Type" value={vehicleType} />
              <ReviewRow label="Vehicle No." value={vehicleNumber.toUpperCase()} />
            </View>

            {/* Thumbnail previews of selected document photos */}
            {(aadhaarPreview || licensePreview) && (
              <View style={styles.reviewThumbnails}>
                {aadhaarPreview ? (
                  <View style={styles.thumbWrap}>
                    <Text style={styles.thumbLabel}>Aadhaar</Text>
                    <Image source={{ uri: aadhaarPreview }} style={styles.thumb} resizeMode="cover" />
                    {aadhaarFileUrl ? <Text style={styles.uploadedBadge}>✓ Uploaded</Text> : <Text style={styles.uploadingBadge}>⚠️ Not uploaded</Text>}
                  </View>
                ) : null}
                {licensePreview ? (
                  <View style={styles.thumbWrap}>
                    <Text style={styles.thumbLabel}>Licence</Text>
                    <Image source={{ uri: licensePreview }} style={styles.thumb} resizeMode="cover" />
                    {licenseFileUrl ? <Text style={styles.uploadedBadge}>✓ Uploaded</Text> : <Text style={styles.uploadingBadge}>⚠️ Not uploaded</Text>}
                  </View>
                ) : null}
              </View>
            )}

            <InfoBox text="⚠️ Admin will verify your documents within 1-2 business days. You'll be notified once approved." color="#FFF8E1" border="#FFD54F" textColor="#795548" />

            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.disabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Submit for Verification</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.backLink} onPress={() => setStep(3)}>
              <Text style={styles.backLinkText}>← Edit Details</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Helper components ──────────────────────────────────────────────────────────

function Field({ label, ...props }: any) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} placeholderTextColor="#bbb" {...props} />
    </>
  );
}

function InfoBox({ text, color = '#E3F2FD', border = '#BBDEFB', textColor = '#1565C0' }: any) {
  return (
    <View style={[styles.infoBox, { backgroundColor: color, borderColor: border }]}>
      <Text style={[styles.infoText, { color: textColor }]}>{text}</Text>
    </View>
  );
}

function NavButtons({ onBack, onNext }: { onBack?: () => void; onNext?: () => void }) {
  return (
    <View style={styles.navRow}>
      {onBack
        ? <TouchableOpacity style={styles.backBtn} onPress={onBack}><Text style={styles.backBtnText}>← Back</Text></TouchableOpacity>
        : <View style={{ flex: 1 }} />}
      {onNext && (
        <TouchableOpacity style={styles.nextBtn} onPress={onNext}><Text style={styles.nextBtnText}>Next →</Text></TouchableOpacity>
      )}
    </View>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.reviewRow}>
      <Text style={styles.reviewLabel}>{label}</Text>
      <Text style={styles.reviewValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { paddingBottom: 40 },
  banner: { backgroundColor: THEME, padding: 20, paddingTop: 24 },
  bannerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  bannerSub: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  stepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 4 },
  stepCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#ddd', alignItems: 'center', justifyContent: 'center' },
  stepActive: { backgroundColor: THEME },
  stepDone: { backgroundColor: '#4CAF50' },
  stepNum: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  stepCheckmark: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  stepLine: { flex: 1, height: 2, backgroundColor: '#ddd', marginHorizontal: 4 },
  stepLineDone: { backgroundColor: '#4CAF50' },
  stepLabelRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 10, marginBottom: 8 },
  stepLabel: { fontSize: 10, color: '#888', textAlign: 'center' },
  form: { padding: 20 },
  stepTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  stepDesc: { fontSize: 13, color: '#888', marginBottom: 20, lineHeight: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 13, fontSize: 15 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1.5, borderColor: '#ddd', backgroundColor: '#fff' },
  chipSelected: { backgroundColor: THEME, borderColor: THEME },
  chipText: { fontSize: 13, color: '#555', fontWeight: '500' },
  chipTextSelected: { color: '#fff', fontWeight: '700' },
  infoBox: { borderWidth: 1, borderRadius: 10, padding: 12, marginTop: 16 },
  infoText: { fontSize: 13, lineHeight: 20 },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, gap: 12 },
  backBtn: { flex: 1, borderWidth: 1.5, borderColor: THEME, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  backBtnText: { color: THEME, fontWeight: '600', fontSize: 15 },
  nextBtn: { flex: 2, backgroundColor: THEME, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  nextBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  reviewCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  reviewLabel: { fontSize: 13, color: '#888' },
  reviewValue: { fontSize: 13, color: '#333', fontWeight: '600', maxWidth: '55%', textAlign: 'right' },
  submitBtn: { backgroundColor: THEME, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 12 },
  submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  disabled: { opacity: 0.6 },
  backLink: { alignItems: 'center', paddingVertical: 8 },
  backLinkText: { color: THEME, fontSize: 14, fontWeight: '600' },
  uploadedBadge: { fontSize: 11, color: '#4CAF50', fontWeight: '600', marginTop: 4, textAlign: 'center' },
  uploadingBadge: { fontSize: 11, color: '#FF9800', fontWeight: '600', marginTop: 4, textAlign: 'center' },
  // Image picker
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: THEME,
    borderRadius: 10,
    paddingVertical: 13,
    marginTop: 4,
  },
  pickerBtnText: { color: THEME, fontWeight: '600', fontSize: 14 },
  preview: { width: '100%', height: 180, borderRadius: 10, marginTop: 10, backgroundColor: '#f0f0f0' },
  // Review thumbnails
  reviewThumbnails: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  thumbWrap: { flex: 1, alignItems: 'center' },
  thumbLabel: { fontSize: 12, color: '#888', marginBottom: 4, fontWeight: '600' },
  thumb: { width: '100%', height: 90, borderRadius: 8, backgroundColor: '#f0f0f0' },
});
