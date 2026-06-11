import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { STATUS_COLORS } from '../../constants/colors';

const STATUS_LABELS = {
  DRAFT: 'Draft',
  PENDING_APPROVAL: 'Pending Approval',
  CHANGES_REQUESTED: 'Changes Requested',
  APPROVED: 'Approved',
  ACTIVE: 'Active',
  EXPIRED: 'Expired',
  REJECTED: 'Rejected',
  SUBMITTED: 'Submitted',
  MANAGER_APPROVAL: 'Manager Review',
  FINANCE_APPROVAL: 'Finance Review',
  PAID: 'Paid',
};

export default function StatusBadge({ status, small }) {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.DRAFT;
  return (
    <View style={[
      styles.badge,
      { backgroundColor: colors.bg, borderColor: colors.border },
      small && styles.small
    ]}>
      <Text style={[styles.text, { color: colors.text }, small && styles.smallText]}>
        {STATUS_LABELS[status] || status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
  small: {
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  smallText: {
    fontSize: 10,
  },
});
