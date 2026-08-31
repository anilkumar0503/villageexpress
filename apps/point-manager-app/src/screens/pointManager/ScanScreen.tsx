import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Alert,
  TouchableOpacity,
  Linking,
  Dimensions,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { BarCodeScanner, BarCodeScannerResult } from 'expo-barcode-scanner';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';

// ─── Constants ────────────────────────────────────────────────────────────────

const THEME = '#FF9800';
const OVERLAY_COLOR = 'rgba(0,0,0,0.62)';
const CORNER_SIZE = 28;
const CORNER_THICKNESS = 3;
const { width: SCREEN_W } = Dimensions.get('window');
const VIEWFINDER_SIZE = Math.round(SCREEN_W * 0.65);

// ─── Navigation types ─────────────────────────────────────────────────────────

export type ScanStackParamList = {
  ScanMain: undefined;
  BookingDetails: { bookingId: string };
};

type NavProp = StackNavigationProp<ScanStackParamList, 'ScanMain'>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns true when the scanned string looks like a VE booking reference. */
function isBookingNumber(text: string): boolean {
  const t = text.trim();
  return t.toUpperCase().startsWith('VE-') || /^\d{4,}$/.test(t);
}

// ─── Permission-denied view ───────────────────────────────────────────────────

function PermissionDenied() {
  return (
    <SafeAreaView style={styles.centered}>
      <Text style={styles.permIcon}>📷</Text>
      <Text style={styles.permTitle}>Camera Access Required</Text>
      <Text style={styles.permBody}>
        Enable camera permission in your device settings to scan QR codes and
        barcodes.
      </Text>
      <TouchableOpacity
        style={[styles.settingsBtn, { backgroundColor: THEME }]}
        activeOpacity={0.8}
        onPress={() => Linking.openSettings()}
      >
        <Text style={styles.settingsBtnText}>Open Settings</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ─── Loading view ─────────────────────────────────────────────────────────────

function RequestingPermission() {
  return (
    <View style={styles.centered}>
      <Text style={styles.permIcon}>🔍</Text>
      <Text style={styles.permBody}>Requesting camera permission…</Text>
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ScanScreen() {
  const navigation = useNavigation<NavProp>();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  // Request permission on mount
  useEffect(() => {
    let mounted = true;
    BarCodeScanner.requestPermissionsAsync().then(({ status }) => {
      if (mounted) setHasPermission(status === 'granted');
    });
    return () => { mounted = false; };
  }, []);

  const handleBarCodeScanned = useCallback(
    ({ data }: BarCodeScannerResult) => {
      if (scanned) return;
      setScanned(true);

      const trimmed = data.trim();

      if (isBookingNumber(trimmed)) {
        Alert.alert(
          'Booking Found',
          `Booking: ${trimmed}`,
          [
            {
              text: 'View Booking',
              onPress: () =>
                navigation.navigate('BookingDetails', { bookingId: trimmed }),
            },
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => setScanned(false), // allow re-scan on cancel
            },
          ],
          { cancelable: false },
        );
      } else {
        Alert.alert(
          'Unrecognised Code',
          `Scanned data:\n${trimmed}\n\nThis does not appear to be a valid booking reference.`,
          [{ text: 'OK', onPress: () => setScanned(false) }],
        );
      }
    },
    [scanned, navigation],
  );

  // ── Permission states ──────────────────────────────────────────────────────
  if (hasPermission === null) return <RequestingPermission />;
  if (!hasPermission) return <PermissionDenied />;

  // ── Active scanner ─────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Live camera feed */}
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
        /* flashMode is typed in expo-barcode-scanner BarCodeScannerProps */
        {...({ flashMode: torchOn ? 'torch' : 'off' } as object)}
      />

      {/* ── Overlay ── */}
      <View style={styles.overlay} pointerEvents="box-none">

        {/* Top shade + cancel button */}
        <View style={styles.topShade}>
          <SafeAreaView>
            <TouchableOpacity
              style={styles.cancelBtn}
              activeOpacity={0.75}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.cancelText}>✕  Cancel</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </View>

        {/* Middle row: shade | viewfinder | shade */}
        <View style={styles.middleRow}>
          <View style={styles.shade} />

          {/* Viewfinder cutout */}
          <View style={styles.viewfinder}>
            {/* Scanning line hint (cosmetic) */}
            {!scanned && <View style={[styles.scanLine, { backgroundColor: THEME }]} />}

            {/* Corner brackets */}
            <View style={[styles.corner, styles.cornerTL, { borderColor: THEME }]} />
            <View style={[styles.corner, styles.cornerTR, { borderColor: THEME }]} />
            <View style={[styles.corner, styles.cornerBL, { borderColor: THEME }]} />
            <View style={[styles.corner, styles.cornerBR, { borderColor: THEME }]} />
          </View>

          <View style={styles.shade} />
        </View>

        {/* Bottom shade + controls */}
        <View style={styles.bottomShade}>
          <Text style={styles.hint}>
            {scanned
              ? 'Tap "Scan Again" to scan another code'
              : 'Align QR code or barcode within the frame'}
          </Text>

          <View style={styles.controls}>
            {/* Torch toggle */}
            <TouchableOpacity
              style={[styles.controlBtn, torchOn && styles.controlBtnActive]}
              activeOpacity={0.75}
              onPress={() => setTorchOn(v => !v)}
            >
              <Text style={styles.controlIcon}>🔦</Text>
              <Text style={styles.controlLabel}>
                {torchOn ? 'Torch On' : 'Torch'}
              </Text>
            </TouchableOpacity>

            {/* Scan Again – only appears after a scan */}
            {scanned && (
              <TouchableOpacity
                style={[styles.controlBtn, styles.scanAgainBtn, { backgroundColor: THEME }]}
                activeOpacity={0.8}
                onPress={() => setScanned(false)}
              >
                <Text style={styles.controlIcon}>🔄</Text>
                <Text style={[styles.controlLabel, styles.scanAgainLabel]}>
                  Scan Again
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Wrappers
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 32,
  },
  overlay: {
    flex: 1,
  },

  // ── Overlay sections ──────────────────────────────────────────────────────
  topShade: {
    flex: 1,
    backgroundColor: OVERLAY_COLOR,
    justifyContent: 'flex-start',
  },
  middleRow: {
    flexDirection: 'row',
    height: VIEWFINDER_SIZE,
  },
  shade: {
    flex: 1,
    backgroundColor: OVERLAY_COLOR,
  },
  bottomShade: {
    flex: 1.4,
    backgroundColor: OVERLAY_COLOR,
    alignItems: 'center',
    paddingTop: 20,
    gap: 20,
  },

  // ── Viewfinder ────────────────────────────────────────────────────────────
  viewfinder: {
    width: VIEWFINDER_SIZE,
    height: VIEWFINDER_SIZE,
    // transparent – camera shows through
  },
  scanLine: {
    position: 'absolute',
    top: '48%',
    left: 12,
    right: 12,
    height: 2,
    opacity: 0.7,
    borderRadius: 1,
  },

  // Corner bracket pieces
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderWidth: CORNER_THICKNESS,
    borderRadius: 3,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },

  // ── Cancel button (top-left) ──────────────────────────────────────────────
  cancelBtn: {
    margin: 16,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 20,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  cancelText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // ── Hint text ─────────────────────────────────────────────────────────────
  hint: {
    color: 'rgba(255,255,255,0.80)',
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 18,
  },

  // ── Control buttons ───────────────────────────────────────────────────────
  controls: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  controlBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
    gap: 4,
  },
  controlBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderColor: 'rgba(255,255,255,0.50)',
  },
  controlIcon: {
    fontSize: 22,
  },
  controlLabel: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '500',
  },
  scanAgainBtn: {
    borderWidth: 0,
  },
  scanAgainLabel: {
    fontWeight: '700',
  },

  // ── Permission screens ────────────────────────────────────────────────────
  permIcon: {
    fontSize: 52,
    marginBottom: 16,
  },
  permTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 10,
    textAlign: 'center',
  },
  permBody: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  settingsBtn: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 24,
  },
  settingsBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
