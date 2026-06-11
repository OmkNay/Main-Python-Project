import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Alert, TextInput, Modal, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getExpenseType, approveExpenseType,
  rejectExpenseType, requestChanges, getExpenseTypeAudit,
} from '../../api/expenseTypesApi';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../constants/colors';
import { canApproveExpenseType } from '../../constants/roles';
import StatusBadge from '../../components/common/StatusBadge';
import Card from '../../components/common/Card';
import LoadingOverlay from '../../components/common/LoadingOverlay';

const InfoRow = ({ label, value, icon }) => (
  <View style={styles.infoRow}>
    <View style={styles.infoLabelRow}>
      {icon && <Ionicons name={icon} size={14} color={COLORS.textSecondary} style={{ marginRight: 4 }} />}
      <Text style={styles.infoLabel}>{label}</Text>
    </View>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

export default function ExpenseTypeDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { user } = useAuth();
  const [item, setItem] = useState(null);
  const [audit, setAudit] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionModal, setActionModal] = useState(null);
  const [comments, setComments] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [etRes, auditRes] = await Promise.all([
        getExpenseType(id),
        getExpenseTypeAudit(id),
      ]);
      setItem(etRes.data);
      setAudit(auditRes.data);
    } catch (_) {}
    finally { setLoading(false); }
  };

  const handleAction = async (action) => {
    setActionLoading(true);
    try {
      if (action === 'approve') await approveExpenseType(id, comments);
      else if (action === 'reject') await rejectExpenseType(id, comments);
      else await requestChanges(id, comments);
      setActionModal(null);
      setComments('');
      await fetchData();
      Alert.alert('Success', `Expense type ${action}d successfully.`);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.detail || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingOverlay fullScreen />;
  if (!item) return <View style={styles.container}><Text>Not found</Text></View>;

  const budgetUsed = ((item.spent_amount || 0) / item.budget_amount) * 100;
  const canApprove = canApproveExpenseType(user?.role) &&
    ['PENDING_APPROVAL', 'CHANGES_REQUESTED'].includes(item.status);

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <Card>
          <View style={styles.cardHeader}>
            <Text style={styles.itemName}>{item.name}</Text>
            <StatusBadge status={item.status} />
          </View>
          <Text style={styles.description}>{item.description}</Text>
        </Card>

        {/* Budget */}
        <Card>
          <Text style={styles.sectionTitle}>Budget</Text>
          <View style={styles.budgetNumbers}>
            <View style={styles.budgetItem}>
              <Text style={styles.budgetLabel}>Total</Text>
              <Text style={styles.budgetAmount}>{item.currency} {item.budget_amount.toLocaleString()}</Text>
            </View>
            <View style={styles.budgetItem}>
              <Text style={styles.budgetLabel}>Spent</Text>
              <Text style={[styles.budgetAmount, { color: COLORS.secondary }]}>
                {item.currency} {(item.spent_amount || 0).toLocaleString()}
              </Text>
            </View>
            <View style={styles.budgetItem}>
              <Text style={styles.budgetLabel}>Available</Text>
              <Text style={[styles.budgetAmount, { color: COLORS.success }]}>
                {item.currency} {(item.budget_amount - (item.spent_amount || 0)).toLocaleString()}
              </Text>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, {
              width: `${Math.min(budgetUsed, 100)}%`,
              backgroundColor: budgetUsed > 90 ? COLORS.error : budgetUsed > 70 ? COLORS.warning : COLORS.success,
            }]} />
          </View>
          <Text style={styles.progressText}>{budgetUsed.toFixed(1)}% used</Text>
        </Card>

        {/* Details */}
        <Card>
          <Text style={styles.sectionTitle}>Details</Text>
          <InfoRow label="Department" value={item.department} icon="business-outline" />
          <InfoRow label="Start Date" value={item.start_date} icon="calendar-outline" />
          <InfoRow label="End Date" value={item.end_date} icon="calendar-outline" />
          <InfoRow label="Currency" value={item.currency} icon="cash-outline" />
          {item.requester && (
            <InfoRow
              label="Requested By"
              value={`${item.requester.first_name} ${item.requester.last_name}`}
              icon="person-outline"
            />
          )}
        </Card>

        {/* Justification */}
        {item.business_justification && (
          <Card>
            <Text style={styles.sectionTitle}>Business Justification</Text>
            <Text style={styles.justification}>{item.business_justification}</Text>
          </Card>
        )}

        {/* Audit Trail */}
        {audit.length > 0 && (
          <Card>
            <Text style={styles.sectionTitle}>Approval History</Text>
            {audit.map(a => (
              <View key={a.id} style={styles.auditItem}>
                <View style={styles.auditDot} />
                <View style={styles.auditContent}>
                  <Text style={styles.auditAction}>{a.action}</Text>
                  <Text style={styles.auditMeta}>
                    by {a.approver?.first_name} {a.approver?.last_name} · {new Date(a.timestamp).toLocaleDateString()}
                  </Text>
                  {a.comments && <Text style={styles.auditComments}>{a.comments}</Text>}
                  <Text style={styles.auditStatus}>{a.old_status} → {a.new_status}</Text>
                </View>
              </View>
            ))}
          </Card>
        )}

        {/* Action Buttons */}
        {canApprove && (
          <View style={styles.actions}>
            <TouchableOpacity style={styles.approveBtn} onPress={() => setActionModal('approve')}>
              <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.white} />
              <Text style={styles.actionBtnText}> Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.changesBtn} onPress={() => setActionModal('changes')}>
              <Ionicons name="create-outline" size={18} color={COLORS.warning} />
              <Text style={[styles.actionBtnText, { color: COLORS.warning }]}> Changes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rejectBtn} onPress={() => setActionModal('reject')}>
              <Ionicons name="close-circle-outline" size={18} color={COLORS.white} />
              <Text style={styles.actionBtnText}> Reject</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Action Modal */}
      <Modal visible={!!actionModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>
              {actionModal === 'approve' ? 'Approve' : actionModal === 'reject' ? 'Reject' : 'Request Changes'}
            </Text>
            <TextInput
              style={styles.commentsInput}
              placeholder="Comments (optional)"
              placeholderTextColor={COLORS.textLight}
              value={comments}
              onChangeText={setComments}
              multiline
              numberOfLines={4}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setActionModal(null)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmBtn,
                  actionModal === 'reject' ? { backgroundColor: COLORS.error } :
                    actionModal === 'changes' ? { backgroundColor: COLORS.warning } :
                      { backgroundColor: COLORS.success }
                ]}
                onPress={() => handleAction(actionModal)}
                disabled={actionLoading}
              >
                {actionLoading
                  ? <ActivityIndicator color={COLORS.white} size="small" />
                  : <Text style={styles.confirmText}>Confirm</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 40 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  itemName: { fontSize: 18, fontWeight: '700', color: COLORS.text, flex: 1, marginRight: 10 },
  description: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  budgetNumbers: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  budgetItem: { alignItems: 'center' },
  budgetLabel: { fontSize: 11, color: COLORS.textSecondary, marginBottom: 4 },
  budgetAmount: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  progressBar: {
    height: 8, backgroundColor: COLORS.border, borderRadius: 4, overflow: 'hidden', marginBottom: 6,
  },
  progressFill: { height: '100%', borderRadius: 4 },
  progressText: { fontSize: 11, color: COLORS.textSecondary, textAlign: 'right' },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  infoLabelRow: { flexDirection: 'row', alignItems: 'center' },
  infoLabel: { fontSize: 13, color: COLORS.textSecondary },
  infoValue: { fontSize: 13, color: COLORS.text, fontWeight: '500' },
  justification: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
  auditItem: { flexDirection: 'row', paddingVertical: 8 },
  auditDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginTop: 4, marginRight: 12 },
  auditContent: { flex: 1 },
  auditAction: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  auditMeta: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  auditComments: { fontSize: 12, color: COLORS.text, marginTop: 4, fontStyle: 'italic' },
  auditStatus: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  approveBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.success, borderRadius: 10, paddingVertical: 12,
  },
  changesBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.surface, borderRadius: 10, paddingVertical: 12,
    borderWidth: 1, borderColor: COLORS.warning,
  },
  rejectBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.error, borderRadius: 10, paddingVertical: 12,
  },
  actionBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.white },
  modalOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: COLORS.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, paddingBottom: 40,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 16 },
  commentsInput: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 10,
    padding: 12, fontSize: 14, color: COLORS.text, minHeight: 100,
    textAlignVertical: 'top', marginBottom: 16,
  },
  modalActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 14,
    borderRadius: 10, backgroundColor: COLORS.divider,
  },
  cancelText: { fontSize: 15, fontWeight: '600', color: COLORS.textSecondary },
  confirmBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 10,
  },
  confirmText: { fontSize: 15, fontWeight: '700', color: COLORS.white },
});
