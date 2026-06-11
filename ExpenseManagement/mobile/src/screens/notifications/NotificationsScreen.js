import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { listNotifications, markRead, markAllRead } from '../../api/notificationsApi';
import { COLORS } from '../../constants/colors';
import EmptyState from '../../components/common/EmptyState';
import LoadingOverlay from '../../components/common/LoadingOverlay';

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const res = await listNotifications();
      setNotifications(res.data);
    } catch (_) {}
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  const handleNotifPress = async (notif) => {
    if (!notif.read) {
      await markRead(notif.id);
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    }
    if (notif.entity_type === 'EXPENSE_TYPE' && notif.entity_id) {
      navigation.navigate('ExpenseTypeDetail', { id: notif.entity_id });
    } else if (notif.entity_type === 'REIMBURSEMENT' && notif.entity_id) {
      navigation.navigate('ReimbursementDetail', { id: notif.entity_id });
    }
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.notifItem, !item.read && styles.unread]}
      onPress={() => handleNotifPress(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconBox, { backgroundColor: item.entity_type === 'EXPENSE_TYPE' ? '#E3F2FD' : '#E8F5E9' }]}>
        <Ionicons
          name={item.entity_type === 'EXPENSE_TYPE' ? 'folder-outline' : 'receipt-outline'}
          size={20}
          color={item.entity_type === 'EXPENSE_TYPE' ? COLORS.primary : COLORS.success}
        />
      </View>
      <View style={styles.notifBody}>
        <Text style={[styles.notifTitle, !item.read && styles.unreadTitle]}>{item.title}</Text>
        <Text style={styles.notifMessage} numberOfLines={2}>{item.message}</Text>
        <Text style={styles.notifTime}>{new Date(item.created_at).toLocaleString()}</Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) return <LoadingOverlay fullScreen />;

  return (
    <View style={styles.container}>
      {unreadCount > 0 && (
        <View style={styles.header}>
          <Text style={styles.unreadCount}>{unreadCount} unread</Text>
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={styles.markAll}>Mark all read</Text>
          </TouchableOpacity>
        </View>
      )}
      <FlatList
        data={notifications}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={COLORS.primary} />}
        ListEmptyComponent={
          <EmptyState
            icon="notifications-outline"
            title="No notifications"
            subtitle="You're all caught up!"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  unreadCount: { fontSize: 13, color: COLORS.textSecondary },
  markAll: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  notifItem: {
    flexDirection: 'row', alignItems: 'flex-start', padding: 14,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  unread: { backgroundColor: '#F8F9FF' },
  iconBox: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  notifBody: { flex: 1 },
  notifTitle: { fontSize: 14, fontWeight: '500', color: COLORS.text, marginBottom: 3 },
  unreadTitle: { fontWeight: '700' },
  notifMessage: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  notifTime: { fontSize: 11, color: COLORS.textLight, marginTop: 4 },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: COLORS.primary, marginLeft: 8, marginTop: 6,
  },
});
