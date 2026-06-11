import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { listExpenseTypes } from '../../api/expenseTypesApi';
import { listReimbursements } from '../../api/reimbursementsApi';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../constants/colors';
import { canApproveExpenseType, canApproveReimbursement } from '../../constants/roles';
import StatusBadge from '../../components/common/StatusBadge';
import Card from '../../components/common/Card';
import LoadingOverlay from '../../components/common/LoadingOverlay';
import EmptyState from '../../components/common/EmptyState';

export default function PendingApprovalsScreen({ navigation }) {
  const { user } = useAuth();
  const [tab, setTab] = useState('expense_types');
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [reimbursements, setReimbursements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const promises = [];
      if (canApproveExpenseType(user?.role)) {
        promises.push(listExpenseTypes('PENDING_APPROVAL'));
      } else {
        promises.push(Promise.resolve({ data: [] }));
      }
      if (canApproveReimbursement(user?.role)) {
        promises.push(listReimbursements({ status: 'SUBMITTED' }));
        promises.push(listReimbursements({ status: 'FINANCE_APPROVAL' }));
      } else {
        promises.push(Promise.resolve({ data: [] }));
        promises.push(Promise.resolve({ data: [] }));
      }
      const [etRes, rbSubmitted, rbFinance] = await Promise.all(promises);
      setExpenseTypes(etRes.data);
      setReimbursements([...rbSubmitted.data, ...rbFinance.data]);
    } catch (_) {}
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  const renderExpenseType = ({ item }) => (
    <Card onPress={() => navigation.navigate('ExpenseTypeDetail', { id: item.id })}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
        <StatusBadge status={item.status} small />
      </View>
      <Text style={styles.itemSub}>{item.department}</Text>
      <View style={styles.itemFooter}>
        <Text style={styles.amount}>{item.currency} {item.budget_amount.toLocaleString()}</Text>
        {item.requester && (
          <Text style={styles.requester}>
            by {item.requester.first_name} {item.requester.last_name}
          </Text>
        )}
      </View>
    </Card>
  );

  const renderReimbursement = ({ item }) => (
    <Card onPress={() => navigation.navigate('ReimbursementDetail', { id: item.id })}>
      <View style={styles.itemHeader}>
        <Text style={styles.amountBig}>{item.currency} {item.amount.toLocaleString()}</Text>
        <StatusBadge status={item.status} small />
      </View>
      <Text style={styles.itemSub} numberOfLines={2}>{item.description}</Text>
      <View style={styles.itemFooter}>
        <Text style={styles.dateText}>
          <Ionicons name="calendar-outline" size={11} /> {item.expense_date}
        </Text>
        {item.employee && (
          <Text style={styles.requester}>
            {item.employee.first_name} {item.employee.last_name}
          </Text>
        )}
      </View>
    </Card>
  );

  if (loading) return <LoadingOverlay fullScreen />;

  const etCount = expenseTypes.length;
  const rbCount = reimbursements.length;
  const totalPending = etCount + rbCount;

  return (
    <View style={styles.container}>
      {totalPending > 0 && (
        <View style={styles.pendingBanner}>
          <Ionicons name="alert-circle" size={16} color={COLORS.warning} />
          <Text style={styles.pendingText}>{totalPending} item{totalPending > 1 ? 's' : ''} awaiting your approval</Text>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'expense_types' && styles.tabActive]}
          onPress={() => setTab('expense_types')}
        >
          <Ionicons
            name="folder-outline"
            size={15}
            color={tab === 'expense_types' ? COLORS.primary : COLORS.textSecondary}
          />
          <Text style={[styles.tabText, tab === 'expense_types' && styles.tabTextActive]}>
            Expense Types {etCount > 0 ? `(${etCount})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'reimbursements' && styles.tabActive]}
          onPress={() => setTab('reimbursements')}
        >
          <Ionicons
            name="receipt-outline"
            size={15}
            color={tab === 'reimbursements' ? COLORS.primary : COLORS.textSecondary}
          />
          <Text style={[styles.tabText, tab === 'reimbursements' && styles.tabTextActive]}>
            Claims {rbCount > 0 ? `(${rbCount})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {tab === 'expense_types'
        ? <FlatList
            data={expenseTypes}
            keyExtractor={i => i.id}
            renderItem={renderExpenseType}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={COLORS.primary} />}
            ListEmptyComponent={
              <EmptyState
                icon="checkmark-done-outline"
                title="No pending expense types"
                subtitle="All expense type requests have been processed"
              />
            }
          />
        : <FlatList
            data={reimbursements}
            keyExtractor={i => i.id}
            renderItem={renderReimbursement}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={COLORS.primary} />}
            ListEmptyComponent={
              <EmptyState
                icon="checkmark-done-outline"
                title="No pending reimbursements"
                subtitle="All claims have been processed"
              />
            }
          />
      }
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  pendingBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFF3E0', paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#FFE0B2',
  },
  pendingText: { fontSize: 13, color: COLORS.warning, fontWeight: '500' },
  tabs: {
    flexDirection: 'row', backgroundColor: COLORS.surface,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, gap: 6,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: COLORS.primary },
  tabText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  tabTextActive: { color: COLORS.primary, fontWeight: '700' },
  list: { padding: 12 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  itemName: { fontSize: 15, fontWeight: '700', color: COLORS.text, flex: 1, marginRight: 8 },
  amountBig: { fontSize: 20, fontWeight: '800', color: COLORS.primary },
  itemSub: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 8 },
  itemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amount: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  requester: { fontSize: 11, color: COLORS.textSecondary },
  dateText: { fontSize: 11, color: COLORS.textSecondary },
});
