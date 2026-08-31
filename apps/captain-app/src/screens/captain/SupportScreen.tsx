import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { supportApi } from '@ve/mobile-shared';
import type { SupportTicket } from '@ve/mobile-shared';

const THEME = '#2196F3';
const PRIORITY_COLOR: Record<string, string> = { LOW: '#4CAF50', MEDIUM: '#FF9800', HIGH: '#f44336' };
const STATUS_COLOR: Record<string, string> = { OPEN: '#2196F3', IN_PROGRESS: '#FF9800', RESOLVED: '#4CAF50', CLOSED: '#9E9E9E' };

function TicketItem({ ticket, onPress }: { ticket: SupportTicket; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.ticketItem} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.ticketHeader}>
        <Text style={styles.ticketNum}>#{ticket.ticketNumber}</Text>
        <View style={[styles.badge, { backgroundColor: STATUS_COLOR[ticket.status] + '22' }]}>
          <Text style={[styles.badgeText, { color: STATUS_COLOR[ticket.status] }]}>{ticket.status.replace('_', ' ')}</Text>
        </View>
      </View>
      <Text style={styles.ticketSubject}>{ticket.subject}</Text>
      <View style={styles.ticketFooter}>
        <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLOR[ticket.priority] }]} />
        <Text style={styles.ticketMeta}>{ticket.priority} priority</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function SupportScreen() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [submitting, setSubmitting] = useState(false);
  const [replyText, setReplyText] = useState('');

  const load = async () => {
    try {
      const res = await supportApi.getTickets();
      setTickets(res.data ?? []);
    } catch {
      Alert.alert('Error', 'Could not load support tickets');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const createTicket = async () => {
    if (!subject.trim() || !description.trim()) { Alert.alert('Required', 'Please fill in all fields'); return; }
    setSubmitting(true);
    try {
      await supportApi.createTicket({ subject, description, priority });
      Alert.alert('Success', 'Ticket created!');
      setShowCreate(false);
      setSubject(''); setDescription(''); setPriority('MEDIUM');
      load();
    } catch {
      Alert.alert('Error', 'Could not create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const sendReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;
    try {
      await supportApi.addMessage(selectedTicket.id, replyText);
      setReplyText('');
      const res = await supportApi.getTicketById(selectedTicket.id);
      setSelectedTicket(res.data);
    } catch {
      Alert.alert('Error', 'Could not send message');
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={THEME} /></View>;

  return (
    <View style={styles.root}>
      <FlatList
        data={tickets}
        keyExtractor={t => t.id}
        renderItem={({ item }) => <TicketItem ticket={item} onPress={() => setSelectedTicket(item)} />}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[THEME]} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🎧</Text>
            <Text style={styles.emptyTitle}>No Support Tickets</Text>
            <Text style={styles.emptyText}>Create a ticket for any issue</Text>
          </View>
        }
      />
      <TouchableOpacity style={styles.fab} onPress={() => setShowCreate(true)}>
        <Text style={styles.fabText}>+ New Ticket</Text>
      </TouchableOpacity>

      <Modal visible={showCreate} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={modal.container}>
            <View style={modal.header}>
              <Text style={modal.title}>New Support Ticket</Text>
              <TouchableOpacity onPress={() => setShowCreate(false)}><Text style={modal.close}>✕</Text></TouchableOpacity>
            </View>
            <ScrollView style={modal.body}>
              <Text style={modal.label}>Subject</Text>
              <TextInput style={modal.input} value={subject} onChangeText={setSubject} placeholder="Brief description" />
              <Text style={modal.label}>Description</Text>
              <TextInput style={[modal.input, modal.textArea]} value={description} onChangeText={setDescription} placeholder="Details..." multiline numberOfLines={5} textAlignVertical="top" />
              <Text style={modal.label}>Priority</Text>
              <View style={modal.priorityRow}>
                {(['LOW', 'MEDIUM', 'HIGH'] as const).map(p => (
                  <TouchableOpacity key={p} style={[modal.priorityBtn, priority === p && { backgroundColor: PRIORITY_COLOR[p] }]} onPress={() => setPriority(p)}>
                    <Text style={[modal.priorityText, priority === p && { color: '#fff' }]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={[modal.submitBtn, submitting && { opacity: 0.6 }]} onPress={createTicket} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={modal.submitText}>Submit Ticket</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={!!selectedTicket} animationType="slide" presentationStyle="pageSheet">
        {selectedTicket && (
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={modal.container}>
              <View style={modal.header}>
                <Text style={modal.title}>#{selectedTicket.ticketNumber}</Text>
                <TouchableOpacity onPress={() => setSelectedTicket(null)}><Text style={modal.close}>✕</Text></TouchableOpacity>
              </View>
              <FlatList
                style={modal.messages}
                data={selectedTicket.messages}
                keyExtractor={m => m.id}
                renderItem={({ item: msg }) => (
                  <View style={[modal.msgBubble, msg.isStaff ? modal.msgStaff : modal.msgUser]}>
                    <Text style={modal.msgText}>{msg.message}</Text>
                    <Text style={modal.msgTime}>{msg.isStaff ? 'Support' : 'You'}</Text>
                  </View>
                )}
              />
              {selectedTicket.status !== 'CLOSED' && (
                <View style={modal.replyBar}>
                  <TextInput style={modal.replyInput} value={replyText} onChangeText={setReplyText} placeholder="Type a message..." />
                  <TouchableOpacity style={[modal.sendBtn, { backgroundColor: THEME }]} onPress={sendReply}>
                    <Text style={modal.sendText}>Send</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </KeyboardAvoidingView>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 12, paddingBottom: 80 },
  ticketItem: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10 },
  ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  ticketNum: { fontSize: 13, color: '#999', fontWeight: '600' },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  ticketSubject: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 8 },
  ticketFooter: { flexDirection: 'row', alignItems: 'center' },
  priorityDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  ticketMeta: { fontSize: 12, color: '#888' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#888' },
  fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: THEME, borderRadius: 24, paddingHorizontal: 20, paddingVertical: 13, elevation: 6 },
  fabText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});

const modal = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  close: { fontSize: 18, color: '#666', padding: 4 },
  body: { padding: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: '#f5f5f5', borderRadius: 10, padding: 14, fontSize: 15 },
  textArea: { height: 120, paddingTop: 12 },
  priorityRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  priorityBtn: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  priorityText: { fontWeight: '600', color: '#555' },
  submitBtn: { backgroundColor: THEME, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 24, marginBottom: 40 },
  submitText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  messages: { flex: 1, padding: 12 },
  msgBubble: { maxWidth: '80%', borderRadius: 12, padding: 12, marginBottom: 8 },
  msgUser: { alignSelf: 'flex-end', backgroundColor: '#e3f2fd' },
  msgStaff: { alignSelf: 'flex-start', backgroundColor: '#f5f5f5' },
  msgText: { fontSize: 14, color: '#333' },
  msgTime: { fontSize: 10, color: '#aaa', marginTop: 4, textAlign: 'right' },
  replyBar: { flexDirection: 'row', padding: 12, borderTopWidth: 1, borderTopColor: '#eee', alignItems: 'center' },
  replyInput: { flex: 1, backgroundColor: '#f5f5f5', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, marginRight: 10 },
  sendBtn: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10 },
  sendText: { color: '#fff', fontWeight: '600' },
});
