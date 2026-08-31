import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Alert, ActivityIndicator,
} from 'react-native';
import { profileApi } from '@ve/mobile-shared';

const THEME = '#FF9800';

const DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

const TIMES = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30',
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00',
];

type DaySchedule = { isOpen: boolean; openTime: string; closeTime: string };
type Schedule = Record<string, DaySchedule>;

const DEFAULT_SCHEDULE: Schedule = Object.fromEntries(
  DAYS.map(d => [d.key, { isOpen: d.key !== 'sunday', openTime: '09:00', closeTime: '18:00' }])
);

export default function WorkingHoursScreen({ navigation }: any) {
  const [schedule, setSchedule] = useState<Schedule>(DEFAULT_SCHEDULE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<{ day: string; field: 'openTime' | 'closeTime' } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await profileApi.getWorkingHours();
        if (res.data?.schedule) {
          setSchedule(res.data.schedule as Schedule);
        }
      } catch {
        // Use defaults if API not yet available
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggleDay = (day: string, val: boolean) =>
    setSchedule(s => ({ ...s, [day]: { ...s[day], isOpen: val } }));

  const setTime = (day: string, field: 'openTime' | 'closeTime', time: string) => {
    setSchedule(s => ({ ...s, [day]: { ...s[day], [field]: time } }));
    setPickerTarget(null);
  };

  const handleSave = async () => {
    // Validate times
    for (const { key } of DAYS) {
      const d = schedule[key];
      if (d.isOpen && d.openTime >= d.closeTime) {
        Alert.alert('Invalid Hours', `On ${key}, closing time must be after opening time`);
        return;
      }
    }
    setSaving(true);
    try {
      await profileApi.updateWorkingHours({ schedule });
      Alert.alert('Saved', 'Working hours updated successfully');
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Could not save working hours. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={THEME} /></View>;

  return (
    <>
      <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>📅 Set your shop's operating hours. Bookings outside these hours will not be routed to your point.</Text>
        </View>

        {DAYS.map(({ key, label }) => {
          const day = schedule[key];
          return (
            <View key={key} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <Text style={[styles.dayName, !day.isOpen && styles.dayNameClosed]}>{label}</Text>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>{day.isOpen ? 'Open' : 'Closed'}</Text>
                  <Switch
                    value={day.isOpen}
                    onValueChange={val => toggleDay(key, val)}
                    trackColor={{ false: '#ccc', true: THEME + '66' }}
                    thumbColor={day.isOpen ? THEME : '#999'}
                  />
                </View>
              </View>

              {day.isOpen && (
                <View style={styles.timesRow}>
                  <TouchableOpacity
                    style={styles.timeBtn}
                    onPress={() => setPickerTarget({ day: key, field: 'openTime' })}
                  >
                    <Text style={styles.timeBtnLabel}>Opens</Text>
                    <Text style={styles.timeBtnValue}>{day.openTime}</Text>
                  </TouchableOpacity>

                  <Text style={styles.timeSeparator}>→</Text>

                  <TouchableOpacity
                    style={styles.timeBtn}
                    onPress={() => setPickerTarget({ day: key, field: 'closeTime' })}
                  >
                    <Text style={styles.timeBtnLabel}>Closes</Text>
                    <Text style={styles.timeBtnValue}>{day.closeTime}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Save button */}
      <View style={styles.saveBar}>
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.disabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Working Hours</Text>}
        </TouchableOpacity>
      </View>

      {/* Time picker modal */}
      {pickerTarget && (
        <View style={picker.overlay}>
          <View style={picker.box}>
            <View style={picker.header}>
              <Text style={picker.title}>
                Select {pickerTarget.field === 'openTime' ? 'Opening' : 'Closing'} Time
              </Text>
              <TouchableOpacity onPress={() => setPickerTarget(null)}>
                <Text style={picker.close}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={picker.list}>
              {TIMES.map(t => {
                const isSelected = schedule[pickerTarget.day][pickerTarget.field] === t;
                return (
                  <TouchableOpacity
                    key={t}
                    style={[picker.timeItem, isSelected && picker.timeItemSelected]}
                    onPress={() => setTime(pickerTarget.day, pickerTarget.field, t)}
                  >
                    <Text style={[picker.timeText, isSelected && picker.timeTextSelected]}>{t}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  infoBox: { backgroundColor: '#FFF8E1', borderWidth: 1, borderColor: '#FFD54F', borderRadius: 10, margin: 12, padding: 14 },
  infoText: { fontSize: 13, color: '#795548', lineHeight: 20 },
  dayCard: { backgroundColor: '#fff', marginHorizontal: 12, marginBottom: 10, borderRadius: 12, padding: 16 },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dayName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  dayNameClosed: { color: '#bbb' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  switchLabel: { fontSize: 13, color: '#888' },
  timesRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, justifyContent: 'center', gap: 12 },
  timeBtn: { backgroundColor: '#f5f5f5', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 20, alignItems: 'center', borderWidth: 1.5, borderColor: '#ddd' },
  timeBtnLabel: { fontSize: 10, color: '#999', marginBottom: 4 },
  timeBtnValue: { fontSize: 18, fontWeight: 'bold', color: THEME },
  timeSeparator: { fontSize: 16, color: '#bbb', fontWeight: 'bold' },
  saveBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
  saveBtn: { backgroundColor: THEME, borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  disabled: { opacity: 0.6 },
});

const picker = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  box: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '60%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  close: { fontSize: 18, color: '#888' },
  list: { paddingHorizontal: 16, paddingVertical: 8 },
  timeItem: { paddingVertical: 14, paddingHorizontal: 12, borderRadius: 8, marginBottom: 4 },
  timeItemSelected: { backgroundColor: THEME },
  timeText: { fontSize: 16, color: '#333', textAlign: 'center' },
  timeTextSelected: { color: '#fff', fontWeight: 'bold' },
});
