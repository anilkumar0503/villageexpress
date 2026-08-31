import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  RefreshControl, TouchableOpacity,
} from 'react-native';
import { profileApi } from '@ve/mobile-shared';

const THEME = '#2196F3';

type VerificationStatus = 'NOT_SUBMITTED' | 'PENDING' | 'VERIFIED' | 'REJECTED';

interface KycInfo {
  onboardingStatus: string;
  aadhaarNumber?: string;
  aadhaarPhoto?: string;
  aadhaarVerificationStatus?: VerificationStatus;
  aadhaarRejectionReason?: string;
  licensePhoto?: string;
  licenseVerificationStatus?: VerificationStatus;
  licenseRejectionReason?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  approvalStatus?: string;
}

function StatusBadge({ status }: { status?: VerificationStatus | string }) {
  const map: Record<string, { color: string; bg: string; label: string }> = {
    VERIFIED:      { color: '#4CAF50', bg: '#E8F5E9', label: '✓ Verified' },
    PENDING:       { color: '#FF9800', bg: '#FFF8E1', label: '⏳ Pending Review' },
    NOT_SUBMITTED: { color: '#9E9E9E', bg: '#F5F5F5', label: '○ Not Submitted' },
    REJECTED:      { color: '#F44336', bg: '#FFEBEE', label: '✕ Rejected' },
    APPROVED:      { color: '#4CAF50', bg: '#E8F5E9', label: '✓ Approved' },
    COMPLETED:     { color: '#4CAF50', bg: '#E8F5E9', label: '✓ Complete' },
    IN_PROGRESS:   { color: '#2196F3', bg: '#E3F2FD', label: '→ In Progress' },
    NOT_STARTED:   { color: '#9E9E9E', bg: '#F5F5F5', label: '○ Not Started' },
  };
  const s = status ?? 'NOT_SUBMITTED';
  const cfg = map[s] ?? { color: '#999', bg: '#f5f5f5', label: s };
  return (
    <View style={[badge.wrap, { backgroundColor: cfg.bg }]}>
      <Text style={[badge.text, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

function KycCard({ title, icon, status, rejectionReason, detail }: {
  title: string; icon: string; status?: VerificationStatus | string; rejectionReason?: string; detail?: string;
}) {
  return (
    <View style={card.container}>
      <View style={card.header}>
        <Text style={card.icon}>{icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={card.title}>{title}</Text>
          {detail && <Text style={card.detail}>{detail}</Text>}
        </View>
        <StatusBadge status={status} />
      </View>
      {status === 'REJECTED' && rejectionReason && (
        <View style={card.rejection}>
          <Text style={card.rejectionLabel}>Rejection reason:</Text>
          <Text style={card.rejectionText}>{rejectionReason}</Text>
        </View>
      )}
    </View>
  );
}

export default function KycStatusScreen({ navigation }: any) {
  const [kyc, setKyc] = useState<KycInfo | null>(null);
  const [approvalStatus, setApprovalStatus] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await profileApi.getProfile();
      const cp = res.data?.captainProfile ?? {};
      setKyc({
        onboardingStatus: cp.onboardingStatus ?? 'NOT_STARTED',
        aadhaarNumber: cp.aadhaarNumber,
        aadhaarPhoto: cp.aadhaarPhoto,
        aadhaarVerificationStatus: cp.aadhaarVerificationStatus ?? 'NOT_SUBMITTED',
        aadhaarRejectionReason: cp.aadhaarRejectionReason,
        licensePhoto: cp.licensePhoto,
        licenseVerificationStatus: cp.licenseVerificationStatus ?? 'NOT_SUBMITTED',
        licenseRejectionReason: cp.licenseRejectionReason,
        vehicleType: cp.vehicleType,
        vehicleNumber: cp.vehicleNumber,
      });
      setApprovalStatus(res.data?.approvalStatus ?? '');
    } catch {
      // Silently fail, show empty state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={THEME} /></View>;

  const allVerified = kyc?.aadhaarVerificationStatus === 'VERIFIED' && kyc?.licenseVerificationStatus === 'VERIFIED';
  const anyRejected = kyc?.aadhaarVerificationStatus === 'REJECTED' || kyc?.licenseVerificationStatus === 'REJECTED';

  return (
    <ScrollView
      style={styles.root}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[THEME]} />}
    >
      {/* Overall status banner */}
      <View style={[styles.banner,
        allVerified && approvalStatus === 'APPROVED' ? { backgroundColor: '#4CAF50' }
        : anyRejected ? { backgroundColor: '#F44336' }
        : { backgroundColor: THEME }
      ]}>
        <Text style={styles.bannerTitle}>
          {allVerified && approvalStatus === 'APPROVED' ? '🎉 KYC Approved — You can now accept deliveries!'
          : anyRejected ? '⚠️ Document Rejected'
          : '📋 KYC Verification Status'}
        </Text>
        <View style={styles.bannerRow}>
          <Text style={styles.bannerLabel}>Account Status</Text>
          <StatusBadge status={approvalStatus} />
        </View>
        <View style={styles.bannerRow}>
          <Text style={styles.bannerLabel}>Onboarding</Text>
          <StatusBadge status={kyc?.onboardingStatus} />
        </View>
      </View>

      <View style={styles.body}>
        {/* Document status */}
        <Text style={styles.sectionTitle}>Document Verification</Text>
        <KycCard
          icon="🪪"
          title="Aadhaar Card"
          status={kyc?.aadhaarVerificationStatus}
          rejectionReason={kyc?.aadhaarRejectionReason}
          detail={kyc?.aadhaarNumber ? `····${kyc.aadhaarNumber.slice(-4)}` : undefined}
        />
        <KycCard
          icon="🚗"
          title="Driving Licence"
          status={kyc?.licenseVerificationStatus}
          rejectionReason={kyc?.licenseRejectionReason}
        />

        {/* Vehicle */}
        {(kyc?.vehicleType || kyc?.vehicleNumber) && (
          <>
            <Text style={styles.sectionTitle}>Vehicle</Text>
            <View style={card.container}>
              <View style={card.header}>
                <Text style={card.icon}>{
                  kyc.vehicleType === 'BIKE' ? '🏍' : kyc.vehicleType === 'AUTO' ? '🛺' : '🚐'
                }</Text>
                <View>
                  <Text style={card.title}>{kyc.vehicleType}</Text>
                  {kyc.vehicleNumber && <Text style={card.detail}>{kyc.vehicleNumber}</Text>}
                </View>
              </View>
            </View>
          </>
        )}

        {/* CTA if not submitted or rejected */}
        {(kyc?.onboardingStatus === 'NOT_STARTED' || anyRejected) && (
          <TouchableOpacity style={styles.ctaBtn} onPress={() => navigation.navigate('Onboarding')}>
            <Text style={styles.ctaBtnText}>
              {anyRejected ? 'Resubmit Documents' : 'Complete Onboarding'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            {'• Verification typically takes 1-2 business days\n• You will receive a notification once approved\n• Pull down to refresh this page'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  banner: { padding: 20, paddingTop: 24, gap: 10 },
  bannerTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  bannerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bannerLabel: { fontSize: 14, color: 'rgba(255,255,255,0.85)' },
  body: { padding: 14 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#888', textTransform: 'uppercase', marginTop: 16, marginBottom: 10 },
  ctaBtn: { backgroundColor: THEME, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  ctaBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  infoBox: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginTop: 16 },
  infoText: { fontSize: 13, color: '#888', lineHeight: 22 },
});

const badge = StyleSheet.create({
  wrap: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  text: { fontSize: 12, fontWeight: '700' },
});

const card = StyleSheet.create({
  container: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { fontSize: 28, width: 36 },
  title: { fontSize: 15, fontWeight: '600', color: '#333' },
  detail: { fontSize: 12, color: '#888', marginTop: 2 },
  rejection: { marginTop: 12, backgroundColor: '#FFEBEE', borderRadius: 8, padding: 10 },
  rejectionLabel: { fontSize: 12, color: '#C62828', fontWeight: '600', marginBottom: 4 },
  rejectionText: { fontSize: 13, color: '#B71C1C', lineHeight: 18 },
});
