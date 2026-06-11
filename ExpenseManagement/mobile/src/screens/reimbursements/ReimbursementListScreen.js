import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, RefreshControl, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { listReimbursements } from '../../api/reimbursementsApi';
import { COLORS } from '../../constants/colors';
import StatusBadge from '../../components/common/StatusBadge';
import Card from '../../components/common/Card';
import LoadingOverlay from '../../components/common/LoadingOverlay';
import EmptyState from '../../components/common/EmptyState';

const FILTERS = ['All', 'DRAFT', 'SUBMITTED', 'FINANCE_APPROVAL', 'APPROVED', 'PAID', 'REJECTED'];

export default function ReimbursementListScreen({ navigation, route }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState(route.params?.filterStatus || 'All');
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    try {
      const params = activeFilter !== 'All' ? { status: activeFilter } : {};
      const res = await listReimbursements(params);
      setItems(res.data);
    } catch (_) {}
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, [activeFilter]));

  const filtered = items.filter(i =>
    i.description.toLowerCase().includes(search.toLowerCase()) ||
    (i.vendor_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }) => (
    <Card onPress={() => navigation.navigate('ReimbursementDetail', { id: item.id })}>
      <View style={styles.itemHeader}>
        <View style={styles.amountBadge}>
          <Text style={styles.amountText}>€{item.amount.toLocaleString()}</Text>
        </View>
        <StatusBadge status={item.status} small />
      </View>
      <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
      {item.vendor_name && (
        <Text style={styles.vendor}>
          <Ionicons name="storefront-outline" size={12} /> {item.vendor_name}
        </Text>
      )}
      <View style={styles.itemFooter}>
        <View style={styles.footerRow}>
          <Ionicons name="calendar-outline" size={12} color={COLORS.textSecondary} />
          <Text style={styles.footerText}> {item.expense_date}</Text>
        </View>
        {item.expense_type && (
          <Text style={styles.expenseType} numberOfLines={1}>{item.expense_type.name}</Text>
        )}
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchWrapper}>
        <Ionicons name="search-outline" size={18} color={COLORS.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search reimbursements..."
          placeholderTextColor={COLORS.textLight}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, activeFilter === f && styles.chipActive]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.chipText, activeFilter === f && styles.chipTextActive]}>
              {f === 'All' ? 'All' : f.replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading
        ? <LoadingOverlay />
        : <FlatList
            data={filtered}
            keyExtractor={i => i.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={COLORS.primary} />}
            ListEmptyComponent={<EmptyState icon="receipt-outline" title="No reimbursements found" />}
          />
      }

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateReimbursement')}
      >
        <Ionicons name="add" size={28} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  searchWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    borderRadius: 12, margin: 12, paddingHorizontal: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: 44, fontSize: 14, color: COLORS.text },
  filterRow: { flexDirection: 'row', paddingHorizontal: 12, paddingBottom: 10, gap: 6, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  chipTextActive: { color: COLORS.white },
  list: { padding: 12 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  amountBadge: {
    backgroundColor: COLORS.primary + '15',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
  },
  amountText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  description: { fontSize: 14, color: COLORS.text, marginBottom: 4 },
  vendor: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 8 },
  itemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerRow: { flexDirection: 'row', alignItems: 'center' },
  footerText: { fontSize: 11, color: COLORS.textSecondary },
  expenseType: { fontSize: 11, color: COLORS.primary, fontWeight: '500', maxWidth: 180 },
  fab: {
    position: 'absolute', bottom: 24, right: 24, width: 56, height: 56,
    borderRadius: 28, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },
});
