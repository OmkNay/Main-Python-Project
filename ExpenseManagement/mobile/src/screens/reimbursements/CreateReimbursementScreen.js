import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { listExpenseTypes } from '../../api/expenseTypesApi';
import { createReimbursement, uploadReceipt, submitReimbursement } from '../../api/reimbursementsApi';
import { COLORS } from '../../constants/colors';

const Field = ({ label, required, children, error }) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.label}>
      {label}{required && <Text style={styles.required}> *</Text>}
    </Text>
    {children}
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

export default function CreateReimbursementScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [selectedET, setSelectedET] = useState(null);
  const [form, setForm] = useState({
    expense_date: new Date(),
    amount: '',
    currency: 'EUR',
    description: '',
    vendor_name: '',
    tax_amount: '',
    cost_center: '',
  });
  const [receipt, setReceipt] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [reimbursementId, setReimbursementId] = useState(null);

  useEffect(() => {
    listExpenseTypes('ACTIVE')
      .then(res => setExpenseTypes(res.data))
      .catch(() => {});
  }, []);

  const set = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: null }));
  };

  const formatDate = (d) => d.toISOString().split('T')[0];

  const pickReceipt = async () => {
    Alert.alert('Upload Receipt', 'Choose source', [
      {
        text: 'Camera',
        onPress: async () => {
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
          });
          if (!result.canceled) setReceipt(result.assets[0]);
        },
      },
      {
        text: 'Gallery',
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
          });
          if (!result.canceled) setReceipt(result.assets[0]);
        },
      },
      {
        text: 'Document',
        onPress: async () => {
          const result = await DocumentPicker.getDocumentAsync({
            type: ['application/pdf', 'image/*'],
          });
          if (!result.canceled && result.assets?.[0]) setReceipt(result.assets[0]);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const validateStep1 = () => {
    if (!selectedET) {
      Alert.alert('Select an expense type first');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    const e = {};
    if (!form.description.trim()) e.description = 'Description is required';
    const amount = parseFloat(form.amount);
    if (!form.amount || isNaN(amount) || amount <= 0) e.amount = 'Amount must be greater than 0';
    if (!receipt) e.receipt = 'Receipt is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;
    setLoading(true);
    try {
      // Step 1: Create draft
      const createRes = await createReimbursement({
        expense_type_id: selectedET.id,
        expense_date: formatDate(form.expense_date),
        amount: parseFloat(form.amount),
        currency: form.currency,
        description: form.description.trim(),
        vendor_name: form.vendor_name.trim() || undefined,
        tax_amount: form.tax_amount ? parseFloat(form.tax_amount) : undefined,
        cost_center: form.cost_center.trim() || undefined,
      });
      const rbId = createRes.data.id;
      setReimbursementId(rbId);

      // Step 2: Upload receipt
      await uploadReceipt(rbId, receipt.uri, receipt.name || 'receipt.jpg', receipt.mimeType || 'image/jpeg');

      // Step 3: Submit
      await submitReimbursement(rbId);

      Alert.alert(
        'Submitted!',
        'Your reimbursement has been submitted for approval.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Failed to submit reimbursement';
      Alert.alert('Error', typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <View style={styles.container}>
        <View style={styles.stepHeader}>
          <Text style={styles.stepTitle}>Select Expense Type</Text>
          <Text style={styles.stepSubtitle}>Choose the budget to claim against</Text>
        </View>
        {expenseTypes.length === 0 ? (
          <View style={styles.emptyET}>
            <Ionicons name="folder-open-outline" size={48} color={COLORS.textLight} />
            <Text style={styles.emptyText}>No active expense types available</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.etList}>
            {expenseTypes.map(et => {
              const available = et.budget_amount - (et.spent_amount || 0);
              const isSelected = selectedET?.id === et.id;
              return (
                <TouchableOpacity
                  key={et.id}
                  style={[styles.etCard, isSelected && styles.etCardSelected]}
                  onPress={() => setSelectedET(et)}
                >
                  <View style={styles.etHeader}>
                    <View style={[styles.etRadio, isSelected && styles.etRadioSelected]}>
                      {isSelected && <View style={styles.etRadioDot} />}
                    </View>
                    <Text style={styles.etName}>{et.name}</Text>
                  </View>
                  <Text style={styles.etDept}>{et.department}</Text>
                  <View style={styles.etBudget}>
                    <Text style={styles.etBudgetLabel}>Available: </Text>
                    <Text style={[styles.etBudgetVal, available < 100 && { color: COLORS.error }]}>
                      {et.currency} {available.toLocaleString()}
                    </Text>
                    <Text style={styles.etBudgetLabel}> of {et.currency} {et.budget_amount.toLocaleString()}</Text>
                  </View>
                  <Text style={styles.etDates}>{et.start_date} → {et.end_date}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
        <TouchableOpacity
          style={[styles.nextBtn, !selectedET && { opacity: 0.5 }]}
          onPress={() => validateStep1() && setStep(2)}
          disabled={!selectedET}
        >
          <Text style={styles.nextBtnText}>Next: Enter Details</Text>
          <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Selected ET Banner */}
      <View style={styles.selectedETBanner}>
        <Ionicons name="folder-open-outline" size={16} color={COLORS.primary} />
        <Text style={styles.selectedETName} numberOfLines={1}> {selectedET.name}</Text>
        <TouchableOpacity onPress={() => setStep(1)}>
          <Text style={styles.changeET}>Change</Text>
        </TouchableOpacity>
      </View>

      <Field label="Expense Date" required>
        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
          <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
          <Text style={styles.dateText}>{formatDate(form.expense_date)}</Text>
        </TouchableOpacity>
      </Field>
      {showDatePicker && (
        <DateTimePicker
          value={form.expense_date}
          mode="date"
          maximumDate={new Date()}
          onChange={(_, d) => { setShowDatePicker(false); if (d) set('expense_date', d); }}
        />
      )}

      <View style={styles.row}>
        <View style={{ flex: 2, marginRight: 8 }}>
          <Field label="Amount" required error={errors.amount}>
            <TextInput
              style={[styles.input, errors.amount && styles.inputError]}
              placeholder="250.00"
              placeholderTextColor={COLORS.textLight}
              value={form.amount}
              onChangeText={v => set('amount', v)}
              keyboardType="decimal-pad"
            />
          </Field>
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Currency">
            <TextInput
              style={styles.input}
              value={form.currency}
              onChangeText={v => set('currency', v)}
              autoCapitalize="characters"
            />
          </Field>
        </View>
      </View>

      <Field label="Description" required error={errors.description}>
        <TextInput
          style={[styles.input, styles.multiline, errors.description && styles.inputError]}
          placeholder="Hotel stay, taxi, meal, etc."
          placeholderTextColor={COLORS.textLight}
          value={form.description}
          onChangeText={v => set('description', v)}
          multiline
          numberOfLines={3}
        />
      </Field>

      <Field label="Vendor Name">
        <TextInput
          style={styles.input}
          placeholder="e.g. Hilton Berlin"
          placeholderTextColor={COLORS.textLight}
          value={form.vendor_name}
          onChangeText={v => set('vendor_name', v)}
        />
      </Field>

      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Field label="Tax Amount">
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor={COLORS.textLight}
              value={form.tax_amount}
              onChangeText={v => set('tax_amount', v)}
              keyboardType="decimal-pad"
            />
          </Field>
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Cost Center">
            <TextInput
              style={styles.input}
              placeholder="CC-001"
              placeholderTextColor={COLORS.textLight}
              value={form.cost_center}
              onChangeText={v => set('cost_center', v)}
            />
          </Field>
        </View>
      </View>

      <Field label="Receipt" required error={errors.receipt}>
        <TouchableOpacity
          style={[styles.receiptBtn, receipt && styles.receiptUploaded, errors.receipt && styles.inputError]}
          onPress={pickReceipt}
        >
          <Ionicons
            name={receipt ? 'checkmark-circle' : 'cloud-upload-outline'}
            size={24}
            color={receipt ? COLORS.success : COLORS.textSecondary}
          />
          <Text style={[styles.receiptText, receipt && { color: COLORS.success }]}>
            {receipt ? (receipt.name || 'Receipt attached') : 'Tap to upload receipt'}
          </Text>
        </TouchableOpacity>
      </Field>

      <TouchableOpacity
        style={[styles.submitBtn, loading && { opacity: 0.7 }]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color={COLORS.white} />
          : <>
              <Ionicons name="send-outline" size={18} color={COLORS.white} />
              <Text style={styles.submitText}> Submit Claim</Text>
            </>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 40 },
  stepHeader: { padding: 20, paddingBottom: 12 },
  stepTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  stepSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  emptyET: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText: { fontSize: 15, color: COLORS.textSecondary, marginTop: 12, textAlign: 'center' },
  etList: { padding: 16, gap: 10 },
  etCard: {
    backgroundColor: COLORS.surface, borderRadius: 12, padding: 14,
    borderWidth: 2, borderColor: COLORS.border,
  },
  etCardSelected: { borderColor: COLORS.primary, backgroundColor: '#E3F2FD' },
  etHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  etRadio: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2,
    borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  etRadioSelected: { borderColor: COLORS.primary },
  etRadioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },
  etName: { fontSize: 15, fontWeight: '700', color: COLORS.text, flex: 1 },
  etDept: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 6, marginLeft: 30 },
  etBudget: { flexDirection: 'row', marginLeft: 30, marginBottom: 4 },
  etBudgetLabel: { fontSize: 12, color: COLORS.textSecondary },
  etBudgetVal: { fontSize: 12, fontWeight: '700', color: COLORS.success },
  etDates: { fontSize: 11, color: COLORS.textSecondary, marginLeft: 30 },
  nextBtn: {
    margin: 16, backgroundColor: COLORS.primary, borderRadius: 12,
    height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  nextBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  selectedETBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#E3F2FD',
    borderRadius: 10, padding: 12, marginBottom: 16, gap: 6,
  },
  selectedETName: { flex: 1, fontSize: 13, color: COLORS.primary, fontWeight: '500' },
  changeET: { fontSize: 12, color: COLORS.primary, fontWeight: '700' },
  fieldContainer: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  required: { color: COLORS.error },
  input: {
    backgroundColor: COLORS.surface, borderRadius: 10, borderWidth: 1,
    borderColor: COLORS.border, paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 15, color: COLORS.text,
  },
  inputError: { borderColor: COLORS.error },
  multiline: { minHeight: 80, textAlignVertical: 'top', paddingTop: 11 },
  errorText: { fontSize: 11, color: COLORS.error, marginTop: 4 },
  row: { flexDirection: 'row' },
  dateBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    borderRadius: 10, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 14, paddingVertical: 11, gap: 8,
  },
  dateText: { fontSize: 14, color: COLORS.text },
  receiptBtn: {
    alignItems: 'center', justifyContent: 'center', borderRadius: 10,
    borderWidth: 2, borderColor: COLORS.border, borderStyle: 'dashed',
    paddingVertical: 24, gap: 8,
  },
  receiptUploaded: { borderColor: COLORS.success, borderStyle: 'solid', backgroundColor: '#E8F5E9' },
  receiptText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  submitBtn: {
    backgroundColor: COLORS.primary, borderRadius: 12, height: 52,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  submitText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});
