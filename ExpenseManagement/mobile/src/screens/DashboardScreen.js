import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getDashboard } from '../api/notificationsApi';
import { COLORS } from '../constants/colors';
import { ROLE_LABELS, canCreateExpenseType, canApproveExpenseType } from '../constants/roles';
import Card from '../components/common/Card';
import LoadingOverlay from '../components/common/LoadingOverlay';

const StatCard = ({ icon, label, value, color, onPress }) => (
  <TouchableOpacity style={[styles.statCard, { borderLeftColor: color }]} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
    <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon} size={22} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </TouchableOpacity>
);

const QuickAction = ({ icon, label, color, onPress }) => (
  <TouchableOpacity style={styles.quickAction} onPress={onPress}>
    <View style={[styles.quickActionIcon, { backgroundColor: color }]}>
      <Ionicons name={icon} size={24} color={COLORS.white} />
    </View>
    <Text style={styles.quickActionLabel}>{label}</Text>
  </TouchableOpacity>
);

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await getDashboard();
      setStats(res.data);
    } catch (_) {
      // ignore; show zeros
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchStats(); }, []));

  const onRefresh = () => { setRefreshing(true); fetchStats(); };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) return <LoadingOverlay fullScreen />;

  const s = stats || {};

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting()},</Text>
          <Text style={styles.userName}>{user?.first_name} {user?.last_name}</Text>
          <Text style={styles.userRole}>{ROLE_LABELS[user?.role] || user?.role}</Text>
        </View>
        <TouchableOpacity
          style={styles.notifButton}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Ionicons name="notifications-outline" size={26} color={COLORS.primary} />
          {(s.unread_notifications > 0) && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {s.unread_notifications > 9 ? '9+' : s.unread_notifications}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Stats Grid */}
      <Text style={styles.sectionTitle}>Overview</Text>
      <View style={styles.statsGrid}>
        <StatCard
          icon="folder-outline"
          label="Active Budgets"
          value={s.active_expense_types ?? 0}
          color={COLORS.primary}
          onPress={() => navigation.navigate('ExpenseTypes')}
        />
        <StatCard
          icon="time-outline"
          label="Pending Approval"
          value={s.pending_expense_types ?? 0}
          color={COLORS.warning}
          onPress={() => navigation.navigate('ExpenseTypes', { filterStatus: 'PENDING_APPROVAL' })}
        />
        <StatCard
          icon="document-text-outline"
          label="My Claims"
          value={s.total_reimbursements ?? 0}
          color={COLORS.info}
          onPress={() => navigation.navigate('Reimbursements')}
        />
        <StatCard
          icon="checkmark-circle-outline"
          label="Approved"
          value={s.approved_reimbursements ?? 0}
          color={COLORS.success}
        />
        <StatCard
          icon="alert-circle-outline"
          label="Pending Claims"
          value={s.pending_reimbursements ?? 0}
          color={COLORS.secondary}
          onPress={() => navigation.navigate('Reimbursements', { filterStatus: 'SUBMITTED' })}
        />
        <StatCard
          icon="cash-outline"
          label="Total Paid"
          value={`€${(s.total_reimbursed_amount ?? 0).toLocaleString()}`}
          color={COLORS.success}
        />
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActions}>
        <QuickAction
          icon="add-circle-outline"
          label="New Claim"
          color={COLORS.primary}
          onPress={() => navigation.navigate('CreateReimbursement')}
        />
        {canCreateExpenseType(user?.role) && (
          <QuickAction
            icon="folder-open-outline"
            label="New Budget"
            color={COLORS.info}
            onPress={() => navigation.navigate('CreateExpenseType')}
          />
        )}
        {canApproveExpenseType(user?.role) && (
          <QuickAction
            icon="checkmark-done-outline"
            label="Approvals"
            color={COLORS.warning}
            onPress={() => navigation.navigate('PendingApprovals')}
          />
        )}
        <QuickAction
          icon="notifications-outline"
          label="Notifications"
          color={COLORS.secondary}
          onPress={() => navigation.navigate('Notifications')}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 32 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingTop: 8,
  },
  greeting: { fontSize: 14, color: COLORS.textSecondary },
  userName: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginTop: 2 },
  userRole: { fontSize: 12, color: COLORS.primary, marginTop: 2, fontWeight: '500' },
  notifButton: { position: 'relative', padding: 4 },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: COLORS.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: COLORS.white, fontSize: 9, fontWeight: '700' },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 3 },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAction: { alignItems: 'center', width: 70 },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
});
