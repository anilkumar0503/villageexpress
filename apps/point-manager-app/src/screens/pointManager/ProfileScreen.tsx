import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Switch } from 'react-native';
import { useAuth, profileApi } from '@ve/mobile-shared';
import { biometricService } from '../../utils/biometric';

const THEME = '#FF9800';

type MenuItem = { icon: string; label: string; sublabel?: string; onPress: () => void; danger?: boolean };

export default function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const [shopName, setShopName] = useState<string>('');
  const [shopLocation, setShopLocation] = useState<string>('');
  const [approvalStatus, setApprovalStatus] = useState<string>('');

  // Biometric state
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState<'fingerprint' | 'facial' | 'iris' | 'none'>('none');
  const [biometricToggling, setBiometricToggling] = useState(false);

  useEffect(() => {
    profileApi.getProfile().then(res => {
      const pm = res.data?.pointManagerProfile;
      setApprovalStatus(res.data?.approvalStatus ?? '');
      if (pm?.shopName) setShopName(pm.shopName);
      if (pm?.shopLocation) {
        const loc = pm.shopLocation;
        setShopLocation([loc.pointName, loc.village, loc.district].filter(Boolean).join(', '));
      }
    }).catch(() => {});

    biometricService.isAvailable().then(setBiometricAvailable);
    biometricService.isEnabled().then(setBiometricEnabled);
    biometricService.getBiometricType().then(setBiometricType);
  }, []);

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const handleBiometricToggle = async (value: boolean) => {
    if (biometricToggling) return;
    setBiometricToggling(true);
    try {
      if (value) {
        const label = biometricType === 'facial' ? 'Face ID' : 'Fingerprint';
        const success = await biometricService.authenticate(`Confirm ${label} to enable biometric login`);
        if (success) {
          await biometricService.setEnabled(true);
          setBiometricEnabled(true);
          Alert.alert('Enabled', `You can now log in with ${label}.`);
        }
      } else {
        Alert.alert(
          'Disable Biometric Login?',
          'You will need to use your email and password to log in.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Disable',
              style: 'destructive',
              onPress: async () => {
                await biometricService.setEnabled(false);
                setBiometricEnabled(false);
              },
            },
          ],
        );
      }
    } finally {
      setBiometricToggling(false);
    }
  };

  const initials = (user?.name ?? 'P').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  const biometricLabel = biometricType === 'facial' ? 'Face ID' : biometricType === 'fingerprint' ? 'Fingerprint' : 'Biometric';
  const biometricIcon  = biometricType === 'facial' ? '👤' : '👆';

  const menu: MenuItem[] = [
    { icon: '✏️', label: 'Edit Profile', sublabel: 'Name, phone, email & shop details', onPress: () => navigation.navigate('EditProfile') },
    { icon: '🕐', label: 'Working Hours', sublabel: 'Set daily open/close times', onPress: () => navigation.navigate('WorkingHours') },
    { icon: '🏦', label: 'Payout Details', sublabel: 'UPI or bank account for commissions', onPress: () => navigation.navigate('PayoutDetails') },
    { icon: '🔔', label: 'Notifications', sublabel: 'View your activity updates', onPress: () => navigation.navigate('Notifications') },
    { icon: '🎧', label: 'Support', sublabel: 'Raise a ticket or view replies', onPress: () => navigation.navigate('Support') },
    { icon: '🚪', label: 'Log Out', onPress: handleLogout, danger: true },
  ];

  return (
    <ScrollView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{user?.name ?? 'Point Manager'}</Text>
        <Text style={styles.phone}>{user?.phone ?? ''}</Text>
        {user?.email ? <Text style={styles.email}>{user.email}</Text> : null}
        {approvalStatus ? (
          <View style={[styles.badge, approvalStatus === 'APPROVED' ? styles.badgeGreen : styles.badgeOrange]}>
            <Text style={styles.badgeText}>{approvalStatus}</Text>
          </View>
        ) : null}
      </View>

      {/* Shop info */}
      {(shopName || shopLocation) && (
        <View style={styles.shopCard}>
          <Text style={styles.shopIcon}>🏪</Text>
          <View>
            {shopName ? <Text style={styles.shopName}>{shopName}</Text> : null}
            {shopLocation ? <Text style={styles.shopLocation}>📍 {shopLocation}</Text> : null}
          </View>
        </View>
      )}

      {user?.displayId && (
        <View style={styles.idChip}>
          <Text style={styles.idChipText}>ID: {user.displayId}</Text>
        </View>
      )}

      {/* Security card */}
      {biometricAvailable && (
        <View style={styles.securityCard}>
          <Text style={styles.sectionTitle}>🔒 Security</Text>
          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              <Text style={styles.toggleIcon}>{biometricIcon}</Text>
              <View>
                <Text style={styles.toggleLabel}>{biometricLabel} Login</Text>
                <Text style={styles.toggleSublabel}>
                  {biometricEnabled ? `Log in with ${biometricLabel}` : `Enable ${biometricLabel} for faster login`}
                </Text>
              </View>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={handleBiometricToggle}
              trackColor={{ false: '#ddd', true: `${THEME}66` }}
              thumbColor={biometricEnabled ? THEME : '#f4f3f4'}
              disabled={biometricToggling}
            />
          </View>
        </View>
      )}

      {/* Menu */}
      <View style={styles.menuSection}>
        {menu.map(({ icon, label, sublabel, onPress, danger }) => (
          <TouchableOpacity key={label} style={styles.menuItem} onPress={onPress} activeOpacity={0.75}>
            <Text style={styles.menuIcon}>{icon}</Text>
            <View style={styles.menuBody}>
              <Text style={[styles.menuLabel, danger && styles.dangerText]}>{label}</Text>
              {sublabel && <Text style={styles.menuSublabel}>{sublabel}</Text>}
            </View>
            {!danger && <Text style={styles.menuChevron}>›</Text>}
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.version}>Village Express Point Manager v1.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: THEME, alignItems: 'center', paddingTop: 36, paddingBottom: 28 },
  avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  name: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  phone: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginBottom: 2 },
  email: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 8 },
  badge: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 4, marginTop: 4 },
  badgeGreen: { backgroundColor: 'rgba(76,175,80,0.3)' },
  badgeOrange: { backgroundColor: 'rgba(255,152,0,0.3)' },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  shopCard: { backgroundColor: '#fff', margin: 14, marginBottom: 0, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  shopIcon: { fontSize: 32 },
  shopName: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 2 },
  shopLocation: { fontSize: 12, color: '#888' },
  idChip: { backgroundColor: '#fff', alignSelf: 'center', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, marginTop: 12 },
  idChipText: { fontSize: 13, color: '#888', fontWeight: '600' },
  securityCard: { backgroundColor: '#fff', marginHorizontal: 14, marginTop: 18, borderRadius: 14, padding: 16, elevation: 1 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  toggleIcon: { fontSize: 24, width: 34 },
  toggleLabel: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 2 },
  toggleSublabel: { fontSize: 12, color: '#999' },
  menuSection: { margin: 14, marginTop: 14 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10 },
  menuIcon: { fontSize: 22, width: 36 },
  menuBody: { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: '600', color: '#333' },
  menuSublabel: { fontSize: 12, color: '#999', marginTop: 2 },
  menuChevron: { fontSize: 22, color: '#ccc', fontWeight: '300' },
  dangerText: { color: '#F44336' },
  version: { textAlign: 'center', fontSize: 12, color: '#ccc', marginBottom: 32 },
});
