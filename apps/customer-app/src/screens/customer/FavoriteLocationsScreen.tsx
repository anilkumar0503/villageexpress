import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert,
  ActivityIndicator, RefreshControl, Modal, TextInput,
} from 'react-native';
import { favoritesApi, locationsApi } from '@ve/mobile-shared';
import type { FavoriteLocation, Location } from '@ve/mobile-shared';

const THEME = '#4CAF50';

const TYPE_OPTS: { key: 'PICKUP' | 'DROP' | 'BOTH'; label: string; icon: string }[] = [
  { key: 'BOTH',   label: 'Both',    icon: '↔️' },
  { key: 'PICKUP', label: 'Pickup',  icon: '📤' },
  { key: 'DROP',   label: 'Drop',    icon: '📥' },
];

export default function FavoriteLocationsScreen() {
  const [favorites, setFavorites] = useState<FavoriteLocation[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd]     = useState(false);

  // Add-form state
  const [allLocations, setAllLocations] = useState<Location[]>([]);
  const [locLoading, setLocLoading]     = useState(false);
  const [search, setSearch]             = useState('');
  const [selectedLoc, setSelectedLoc]   = useState<Location | null>(null);
  const [label, setLabel]               = useState('');
  const [locType, setLocType]           = useState<'PICKUP' | 'DROP' | 'BOTH'>('BOTH');
  const [saving, setSaving]             = useState(false);

  const load = async () => {
    try {
      const res = await favoritesApi.getFavorites();
      setFavorites(res.data ?? []);
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd = async () => {
    setShowAdd(true);
    setLocLoading(true);
    try {
      const res = await locationsApi.getLocations();
      setAllLocations(res.data ?? []);
    } catch { Alert.alert('Error', 'Could not load locations'); }
    finally { setLocLoading(false); }
  };

  const handleAdd = async () => {
    if (!selectedLoc) { Alert.alert('Required', 'Select a location'); return; }
    if (!label.trim())  { Alert.alert('Required', 'Enter a label (e.g. Home, Office)'); return; }
    setSaving(true);
    try {
      await favoritesApi.addFavorite({ locationId: selectedLoc.id, label: label.trim(), locationType: locType });
      setShowAdd(false); setSelectedLoc(null); setLabel(''); setLocType('BOTH'); setSearch('');
      load();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error ?? 'Could not save favorite');
    } finally { setSaving(false); }
  };

  const handleRemove = (fav: FavoriteLocation) => {
    Alert.alert('Remove Favorite', `Remove "${fav.label}" from favorites?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try {
          await favoritesApi.removeFavorite(fav.locationId);
          setFavorites(f => f.filter(x => x.id !== fav.id));
        } catch { Alert.alert('Error', 'Could not remove favorite'); }
      }},
    ]);
  };

  const filtered = allLocations.filter(l =>
    search ? [l.pointName, l.village, l.district].join(' ').toLowerCase().includes(search.toLowerCase()) : true
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={THEME} /></View>;

  return (
    <>
      <FlatList
        style={styles.root}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[THEME]} />}
        data={favorites}
        keyExtractor={f => f.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
            <Text style={styles.addBtnText}>＋ Add Favorite Location</Text>
          </TouchableOpacity>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardLeft}>
              <Text style={styles.cardLabel}>{item.label}</Text>
              <Text style={styles.cardLocation}>{item.location.pointName}, {item.location.village}</Text>
              <Text style={styles.cardDistrict}>{item.location.district} — {item.location.state}</Text>
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>
                  {item.locationType === 'BOTH' ? '↔️ Pickup & Drop' : item.locationType === 'PICKUP' ? '📤 Pickup' : '📥 Drop'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => handleRemove(item)} style={styles.removeBtn}>
              <Text style={styles.removeIcon}>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>⭐</Text>
            <Text style={styles.emptyTitle}>No Favorites Yet</Text>
            <Text style={styles.emptyText}>Save your frequent locations for faster booking</Text>
          </View>
        }
      />

      {/* Add Favorite Modal */}
      <Modal visible={showAdd} animationType="slide" transparent>
        <View style={modal.overlay}>
          <View style={modal.box}>
            <View style={modal.header}>
              <Text style={modal.title}>Add Favorite Location</Text>
              <TouchableOpacity onPress={() => setShowAdd(false)}><Text style={modal.close}>✕</Text></TouchableOpacity>
            </View>

            {/* Search */}
            <TextInput
              style={modal.search}
              placeholder="Search locations..."
              value={search}
              onChangeText={setSearch}
              autoFocus
            />

            {/* Location list */}
            {locLoading ? <ActivityIndicator color={THEME} style={{ marginVertical: 20 }} /> : (
              <FlatList
                style={modal.locList}
                data={filtered.slice(0, 20)}
                keyExtractor={l => l.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[modal.locItem, selectedLoc?.id === item.id && modal.locItemSelected]}
                    onPress={() => { setSelectedLoc(item); if (!label) setLabel(item.pointName); }}
                  >
                    <Text style={[modal.locName, selectedLoc?.id === item.id && modal.locNameSelected]}>
                      {item.pointName}
                    </Text>
                    <Text style={modal.locSub}>{item.village}, {item.district}</Text>
                  </TouchableOpacity>
                )}
              />
            )}

            {selectedLoc && (
              <>
                <Text style={modal.label}>Label (e.g. Home, Office)</Text>
                <TextInput style={modal.input} value={label} onChangeText={setLabel} placeholder="My label" autoCapitalize="words" />

                <Text style={modal.label}>Use for</Text>
                <View style={modal.typeRow}>
                  {TYPE_OPTS.map(t => (
                    <TouchableOpacity
                      key={t.key}
                      style={[modal.typeChip, locType === t.key && modal.typeChipSelected]}
                      onPress={() => setLocType(t.key)}
                    >
                      <Text style={[modal.typeChipText, locType === t.key && modal.typeChipTextSelected]}>{t.icon} {t.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity style={[modal.saveBtn, saving && modal.disabled]} onPress={handleAdd} disabled={saving}>
                  {saving ? <ActivityIndicator color="#fff" /> : <Text style={modal.saveBtnText}>Save Favorite</Text>}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 14, paddingBottom: 30 },
  addBtn: { backgroundColor: THEME, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 16 },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10, alignItems: 'flex-start' },
  cardLeft: { flex: 1 },
  cardLabel: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  cardLocation: { fontSize: 13, color: '#555', marginBottom: 2 },
  cardDistrict: { fontSize: 12, color: '#999', marginBottom: 8 },
  typeBadge: { alignSelf: 'flex-start', backgroundColor: '#E8F5E9', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  typeBadgeText: { fontSize: 11, color: '#2E7D32', fontWeight: '600' },
  removeBtn: { padding: 4 },
  removeIcon: { fontSize: 20 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 6 },
  emptyText: { fontSize: 14, color: '#888', textAlign: 'center', paddingHorizontal: 40 },
});

const modal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  box: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '85%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 17, fontWeight: 'bold', color: '#333' },
  close: { fontSize: 20, color: '#888', padding: 4 },
  search: { backgroundColor: '#f5f5f5', borderRadius: 10, padding: 12, fontSize: 14, marginBottom: 10 },
  locList: { maxHeight: 200, marginBottom: 12 },
  locItem: { padding: 12, borderRadius: 8, marginBottom: 4 },
  locItemSelected: { backgroundColor: '#E8F5E9', borderWidth: 1.5, borderColor: THEME },
  locName: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 2 },
  locNameSelected: { color: THEME },
  locSub: { fontSize: 12, color: '#888' },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: '#f8f8f8', borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 14 },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  typeChip: { flex: 1, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5, borderColor: '#ddd', alignItems: 'center' },
  typeChipSelected: { backgroundColor: THEME, borderColor: THEME },
  typeChipText: { fontSize: 12, fontWeight: '600', color: '#666' },
  typeChipTextSelected: { color: '#fff' },
  saveBtn: { backgroundColor: THEME, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  disabled: { opacity: 0.6 },
});
