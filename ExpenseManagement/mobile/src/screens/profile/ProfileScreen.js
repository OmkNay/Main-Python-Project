import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../constants/colors';
import { ROLE_LABELS } from '../../constants/roles';
import Card from '../../components/common/Card';

const MenuItem = ({ icon, label, onPress, danger }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={[styles.menuIcon, { backgroundColor: danger ? '#FFEBEE' : COLORS.background }]}>
      <Ionicons name={icon} size={20} color={danger ? COLORS.error : COLORS.primary} />
    </View>
    <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
    <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
  </TouchableOpacity>
);

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user?.first_name?.[0] || '') + (user?.last_name?.[0] || '')}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.first_name} {user?.last_name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{ROLE_LABELS[user?.role] || user?.role}</Text>
        </View>
      </View>

      {/* Info */}
      <Card>
        <View style={styles.infoRow}>
          <Ionicons name="business-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.infoLabel}>Department</Text>
          <Text style={styles.infoValue}>{user?.department || '—'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="shield-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.infoLabel}>Role</Text>
          <Text style={styles.infoValue}>{ROLE_LABELS[user?.role] || user?.role}</Text>
        </View>
        <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
          <Ionicons name="ellipse" size={10} color={COLORS.success} />
          <Text style={styles.infoLabel}>Status</Text>
          <Text style={[styles.infoValue, { color: COLORS.success }]}>Active</Text>
        </View>
      </Card>

      {/* Menu */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <MenuItem
          icon="document-text-outline"
          label="My Reimbursements"
          onPress={() => navigation.navigate('Reimbursements')}
        />
        <MenuItem
          icon="folder-outline"
          label="Expense Types"
          onPress={() => navigation.navigate('ExpenseTypes')}
        />
        <MenuItem
          icon="notifications-outline"
          label="Notifications"
          onPress={() => navigation.navigate('Notifications')}
        />
      </Card>

      <Card style={{ padding: 0, overflow: 'hidden', marginTop: 4 }}>
        <MenuItem
          icon="log-out-outline"
          label="Sign Out"
          onPress={handleLogout}
          danger
        />
      </Card>

      <Text style={styles.version}>ExpenseManager v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', paddingVertical: 24 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  avatarText: { fontSize: 28, fontWeight: '700', color: COLORS.white },
  userName: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  userEmail: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  roleBadge: {
    marginTop: 10, paddingHorizontal: 14, paddingVertical: 5,
    backgroundColor: COLORS.primary + '20', borderRadius: 12,
  },
  roleText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.divider, gap: 10,
  },
  infoLabel: { flex: 1, fontSize: 14, color: COLORS.textSecondary },
  infoValue: { fontSize: 14, color: COLORS.text, fontWeight: '500' },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.divider, gap: 12,
  },
  menuIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: 15, color: COLORS.text },
  menuLabelDanger: { color: COLORS.error },
  version: { textAlign: 'center', fontSize: 12, color: COLORS.textLight, marginTop: 16 },
});
