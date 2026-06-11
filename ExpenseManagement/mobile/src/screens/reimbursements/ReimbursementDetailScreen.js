import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, TextInput, Modal, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getReimbursement, approveReimbursement, rejectReimbursement,
  markPaid, getReimbursementAudit,
} from '../../api/reimbursementsApi';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../constants/colors';
import { canApproveReimbursement, canMarkPaid } from '../../constants/roles';
import StatusBadge from '../../components/common/StatusBadge';
import Card from '../../components/common/Card';
import LoadingOverlay from '../../components/common/LoadingOverlay';

const InfoRow = ({ label, value, icon }) => (
  <View style={styles.infoRow}>
    <View style={styles.labelRow}>
      {icon && <Ionicons name={icon} size={13} color={COLORS.textSecondary} style={{ marginRight: 4 }} />}
      <Text style={styles.infoLabel}>{label}</Text>
    </View>
    <Text style={styles.infoValue}>{value || '—'}</Text>
  </View>
);

export default function ReimbursementDetailScreen({ route, navigation }) {
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
      const [rbRes, auditRes] = await Promise.all([
        getReimbursement(id),
        getReimbursementAudit(id),
      ]);
      setItem(rbRes.data);
      setAudit(auditRes.data);
    } catch (_) {}
    finally { setLoading(false); }
  };

  const handleAction = async (action) => {
    setActionLoading(true);
    try {
      if (action === 'approve') await approveReimbursement(id, comments);
      else if (action === 'reject') await rejectReimbursement(id, comments);
      else await markPaid(id, comments);
      setActionModal(null);
      setComments('');
      await fetchData();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.detail || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingOverlay fullScreen />;
  if (!item) return null;

  const canApprove = canApproveReimbursement(user?.role) &&
    ['SUBMITTED', 'FINANCE_APPROVAL'].includes(item.status);
  const canPay = canMarkPaid(user?.role) && item.status === 'APPROVED';
  const canReject = canApproveReimbursement(user?.role) &&
    ['SUBMITTED', 'FINANCE_APPROVAL'].includes(item.status);

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Amount Hero */}
        <Card>
          <View style={styles.heroRow}>
            <View>
              <Text style={styles.heroAmount}>
                {item.currency} {item.amount.toLocaleString()}
              </Text>
              <Text style={styles.heroDate}>Expense date: {item.expense_date}</Text>
            </View>
            <StatusBadge status={item.status} />
          </View>
          <Text style={styles.description}>{item.description}</Text>
        </Card>

        {/* Details */}
        <Card>
          <Text style={styles.sectionTitle}>Details</Text>
          {item.expense_type && (
            <InfoRow label="Expense Type" value={item.expense_type.name} icon="folder-outline" />
          )}
          {item.employee && (
            <InfoRow
              label="Submitted By"
              value={`${item.employee.first_name} ${item.employee.last_name}`}
              icon="person-outline"
            />
          )}
          <InfoRow label="Vendor" value={item.vendor_name} icon="storefront-outline" />
          <InfoRow label="Tax Amount" value={item.tax_amount ? `${item.currency} ${item.tax_amount}` : null} icon="receipt-outline" />
          <InfoRow label="Cost Center" value={item.cost_center} icon="business-outline" />
          {item.submitted_at && (
            <InfoRow label="Submitted" value={new Date(item.submitted_at).toLocaleString()} icon="time-outline" />
          )}
          {item.approved_at && (
            <InfoRow label="Approved" value={new Date(item.approved_at).toLocaleString()} icon="checkmark-circle-outline" />
          )}
          {item.paid_at && (
            <InfoRow label="Paid" value={new Date(item.paid_at).toLocaleString()} icon="cash-outline" />
          )}
        </Card>

        {/* Receipt */}
        {item.receipt_url && (
          <Card>
            <Text style={styles.sectionTitle}>Receipt</Text>
            <View style={styles.receiptRow}>
              <Ionicons name="document-attach-outline" size={20} color={COLORS.primary} />
              <Text style={styles.receiptText}>Receipt attached</Text>
              <Ionicons name="open-outline" size={16} color={COLORS.textSecondary} />
            </View>
          </Card>
        )}

        {/* Audit */}
        {audit.length > 0 && (
          <Card>
            <Text style={styles.sectionTitle}>Approval History</Text>
            {audit.map(a => (
              <View key={a.id} style={styles.auditItem}>
                <View style={[styles.auditDot, {
                  backgroundColor: a.action === 'APPROVE' || a.action === 'PAID'
                    ? COLORS.success : a.action === 'REJECT' ? COLORS.error : COLORS.warning
                }]} />
                <View style={styles.auditContent}>
                  <Text style={styles.auditAction}>{a.action}</Text>
                  <Text style={styles.auditMeta}>
                    {a.approver ? `${a.approver.first_name} ${a.approver.last_name}` : 'System'} ·{' '}
                    {new Date(a.timestamp).toLocaleDateString()}
                  </Text>
                  {a.comments && <Text style={styles.auditComments}>"{a.comments}"</Text>}
                  <Text style={styles.auditStatus}>{a.old_status} → {a.new_status}</Text>
                </View>
              </View>
            ))}
          </Card>
        )}

        {/* Actions */}
        {(canApprove || canPay || canReject) && (
          <View style={styles.actions}>
            {canApprove && (
              <TouchableOpacity style={styles.approveBtn} onPress={() => setActionModal('approve')}>
                <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.white} />
                <Text style={styles.btnText}> Approve</Text>
              </TouchableOpacity>
            )}
            {canPay && (
              <TouchableOpacity style={styles.payBtn} onPress={() => setActionModal('pay')}>
                <Ionicons name="cash-outline" size={18} color={COLORS.white} />
                <Text style={styles.btnText}> Mark Paid</Text>
              </TouchableOpacity>
            )}
            {canReject && (
              <TouchableOpacity style={styles.rejectBtn} onPress={() => setActionModal('reject')}>
                <Ionicons name="close-circle-outline" size={18} color={COLORS.white} />
                <Text style={styles.btnText}> Reject</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      <Modal visible={!!actionModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>
              {actionModal === 'approve' ? 'Approve Reimbursement'
                : actionModal === 'pay' ? 'Mark as Paid'
                : 'Reject Reimbursement'}
            </Text>
            <TextInput
              style={styles.commentsInput}
              placeholder="Add comments (optional)"
              placeholderTextColor={COLORS.textLight}
              value={comments}
              onChangeText={setComments}
              multiline
              numberOfLines={4}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setActionModal(null)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmBtn,
                  { backgroundColor: actionModal === 'reject' ? COLORS.error : actionModal === 'pay' ? COLORS.success : COLORS.primary }
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
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  heroAmount: { fontSize: 28, fontWeight: '800', color: COLORS.primary },
  heroDate: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  description: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  labelRow: { flexDirection: 'row', alignItems: 'center' },
  infoLabel: { fontSize: 13, color: COLORS.textSecondary },
  infoValue: { fontSize: 13, color: COLORS.text, fontWeight: '500', maxWidth: 200 },
  receiptRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.background, borderRadius: 8, padding: 12,
  },
  receiptText: { flex: 1, fontSize: 14, color: COLORS.primary, fontWeight: '500' },
  auditItem: { flexDirection: 'row', paddingVertical: 8 },
  auditDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4, marginRight: 12 },
  auditContent: { flex: 1 },
  auditAction: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  auditMeta: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  auditComments: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4, fontStyle: 'italic' },
  auditStatus: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  approveBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.success, borderRadius: 10, paddingVertical: 12,
  },
  payBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 12,
  },
  rejectBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.error, borderRadius: 10, paddingVertical: 12,
  },
  btnText: { fontSize: 13, fontWeight: '700', color: COLORS.white },
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
  modalBtns: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 10, backgroundColor: COLORS.divider,
  },
  cancelText: { fontSize: 15, fontWeight: '600', color: COLORS.textSecondary },
  confirmBtn: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 10 },
  confirmText: { fontSize: 15, fontWeight: '700', color: COLORS.white },
});
