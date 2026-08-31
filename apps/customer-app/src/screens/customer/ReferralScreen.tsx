import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, ScrollView, Platform,
} from 'react-native';
import { referralsApi, profileApi } from '@ve/mobile-shared';

const THEME = '#4CAF50';

export default function ReferralScreen({ navigation }: any) {
  const [myCode, setMyCode]       = useState('');
  const [referralCode, setCode]   = useState('');
  const [applying, setApplying]   = useState(false);
  const [applied, setApplied]     = useState(false);
  const [loadingCode, setLoadingCode] = useState(true);

  // Load the user's own referral code (displayId) from profile
  useEffect(() => {
    profileApi.getProfile()
      .then(res => setMyCode(res.data?.displayId ?? ''))
      .catch(() => {})
      .finally(() => setLoadingCode(false));
  }, []);

  const handleApply = async () => {
    const code = referralCode.trim().toUpperCase();
    if (!code) { Alert.alert('Required', 'Enter a referral code'); return; }
    if (code === myCode) { Alert.alert('Oops!', 'You cannot use your own referral code'); return; }
    setApplying(true);
    try {
      const res = await referralsApi.applyReferral(code);
      if (res.success) {
        setApplied(true);
        Alert.alert('🎉 Applied!', 'Referral code applied successfully. Your bonus will be credited soon!');
      } else {
        Alert.alert('Invalid', (res as any).error ?? 'Could not apply referral code');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? 'Invalid or already used referral code';
      Alert.alert('Error', msg);
    } finally {
      setApplying(false);
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>

      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroIcon}>🎁</Text>
        <Text style={styles.heroTitle}>Refer & Earn</Text>
        <Text style={styles.heroSubtitle}>Share your code with friends and earn wallet bonus when they join!</Text>
      </View>

      {/* Your referral code */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Your Referral Code</Text>
        {loadingCode ? (
          <ActivityIndicator color={THEME} style={{ marginVertical: 16 }} />
        ) : (
          <View style={styles.codeBox}>
            <Text style={styles.codeText} selectable>{myCode || '—'}</Text>
          </View>
        )}
        <Text style={styles.cardNote}>Share this code with your friends. They enter it during registration or below.</Text>
      </View>

      {/* How it works */}
      <View style={styles.howCard}>
        <Text style={styles.howTitle}>How it works</Text>
        {[
          ['1️⃣', 'Share your code with a friend'],
          ['2️⃣', 'Friend registers on Village Express'],
          ['3️⃣', 'Friend enters your referral code'],
          ['4️⃣', 'You both get wallet bonus!'],
        ].map(([icon, text], i) => (
          <View key={i} style={styles.howStep}>
            <Text style={styles.howStepIcon}>{icon}</Text>
            <Text style={styles.howStepText}>{text}</Text>
          </View>
        ))}
      </View>

      {/* Apply a friend's code */}
      {!applied ? (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Apply Friend's Referral Code</Text>
          <TextInput
            style={styles.input}
            value={referralCode}
            onChangeText={t => setCode(t.toUpperCase())}
            placeholder="Enter referral code"
            placeholderTextColor="#bbb"
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[styles.btn, applying && styles.disabled]}
            onPress={handleApply}
            disabled={applying}
          >
            {applying
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Apply Code</Text>}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.card, styles.successCard]}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successText}>Referral code applied! Bonus will be credited to your wallet shortly.</Text>
        </View>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 40 },
  hero: { alignItems: 'center', paddingVertical: 28 },
  heroIcon: { fontSize: 64, marginBottom: 12 },
  heroTitle: { fontSize: 26, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  heroSubtitle: { fontSize: 14, color: '#666', textAlign: 'center', paddingHorizontal: 20, lineHeight: 21 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 18, marginBottom: 14 },
  cardLabel: { fontSize: 14, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 },
  codeBox: { backgroundColor: '#f5f5f5', borderRadius: 10, padding: 18, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#e0e0e0', borderStyle: 'dashed' },
  codeText: { fontSize: 28, fontWeight: 'bold', color: THEME, letterSpacing: 4 },
  cardNote: { fontSize: 12, color: '#888', lineHeight: 18, textAlign: 'center' },
  howCard: { backgroundColor: '#fff', borderRadius: 14, padding: 18, marginBottom: 14 },
  howTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 14 },
  howStep: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 12 },
  howStepIcon: { fontSize: 20 },
  howStepText: { fontSize: 14, color: '#555', flex: 1 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 14, fontSize: 18, color: '#333', letterSpacing: 2, textAlign: 'center', marginBottom: 14, fontWeight: 'bold' },
  btn: { backgroundColor: THEME, borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  disabled: { opacity: 0.6 },
  successCard: { alignItems: 'center', paddingVertical: 24 },
  successIcon: { fontSize: 48, marginBottom: 12 },
  successText: { fontSize: 14, color: '#2E7D32', textAlign: 'center', fontWeight: '500' },
});
