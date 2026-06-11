import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, RefreshControl, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { listExpenseTypes } from '../../api/expenseTypesApi';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../constants/colors';
import { canCreateExpenseType } from '../../constants/roles';
import StatusBadge from '../../components/common/StatusBadge';
import Card from '../../components/common/Card';
import LoadingOverlay from '../../components/common/LoadingOverlay';
import EmptyState from '../../components/common/EmptyState';

const FILTERS = ['All', 'ACTIVE', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'EXPIRED'];

export default function ExpenseTypeListScreen({ navigation, route }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState(route.params?.filterStatus || 'All');
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    try {
      const status = activeFilter === 'All' ? undefined : activeFilter;
      const res = await listExpenseTypes(status);
      setItems(res.data);
    } catch (_) {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, [activeFilter]));

  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.department.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }) => (
    <Card onPress={() => navigation.navigate('ExpenseTypeDetail', { id: item.id })}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
        <StatusBadge status={item.status} small />
      </View>
      <Text style={styles.itemDept}>
        <Ionicons name="business-outline" size={12} color={COLORS.textSecondary} /> {item.department}
      </Text>
      <View style={styles.itemFooter}>
        <View style={styles.budgetRow}>
          <Text style={styles.budgetLabel}>Budget</Text>
          <Text style={styles.budgetValue}>
            {item.currency} {item.budget_amount.toLocaleString()}
          </Text>
        </View>
        <View style={styles.budgetRow}>
          <Text style={styles.budgetLabel}>Spent</Text>
          <Text style={[styles.budgetValue, { color: COLORS.secondary }]}>
            {item.currency} {(item.spent_amount || 0).toLocaleString()}
          </Text>
        </View>
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={12} color={COLORS.textSecondary} />
          <Text style={styles.dateText}> {item.start_date} → {item.end_date}</Text>
        </View>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchWrapper}>
        <Ionicons name="search-outline" size={18} color={COLORS.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search expense types..."
          placeholderTextColor={COLORS.textLight}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
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
            ListEmptyComponent={
              <EmptyState
                icon="folder-open-outline"
                title="No expense types found"
                subtitle="Adjust your filter or create a new one"
              />
            }
          />
      }

      {canCreateExpenseType(user?.role) && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('CreateExpenseType')}
        >
          <Ionicons name="add" size={28} color={COLORS.white} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    margin: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: 44, fontSize: 14, color: COLORS.text },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 10,
    gap: 6,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  filterTextActive: { color: COLORS.white },
  list: { padding: 12 },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  itemName: { fontSize: 15, fontWeight: '700', color: COLORS.text, flex: 1, marginRight: 8 },
  itemDept: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 10 },
  itemFooter: { gap: 4 },
  budgetRow: { flexDirection: 'row', justifyContent: 'space-between' },
  budgetLabel: { fontSize: 12, color: COLORS.textSecondary },
  budgetValue: { fontSize: 12, fontWeight: '600', color: COLORS.text },
  dateRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  dateText: { fontSize: 11, color: COLORS.textSecondary },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
});
