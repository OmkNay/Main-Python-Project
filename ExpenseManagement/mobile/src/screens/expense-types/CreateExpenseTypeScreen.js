import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { createExpenseType } from '../../api/expenseTypesApi';
import { COLORS } from '../../constants/colors';

const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF'];
const DEPARTMENTS = ['Sales', 'Marketing', 'Projects', 'Operations', 'Finance', 'IT', 'HR'];

const Field = ({ label, required, children, error }) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.label}>
      {label}{required && <Text style={styles.required}> *</Text>}
    </Text>
    {children}
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

export default function CreateExpenseTypeScreen({ navigation }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    department: '',
    budget_amount: '',
    currency: 'EUR',
    start_date: new Date(),
    end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    business_justification: '',
  });
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: null }));
  };

  const formatDate = (d) => d.toISOString().split('T')[0];

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.description.trim()) e.description = 'Description is required';
    if (!form.department) e.department = 'Department is required';
    if (!form.business_justification.trim()) e.business_justification = 'Business justification is required';
    const budget = parseFloat(form.budget_amount);
    if (!form.budget_amount || isNaN(budget) || budget <= 0) e.budget_amount = 'Budget must be greater than 0';
    if (form.end_date < form.start_date) e.end_date = 'End date must be after start date';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await createExpenseType({
        name: form.name.trim(),
        description: form.description.trim(),
        department: form.department,
        budget_amount: parseFloat(form.budget_amount),
        currency: form.currency,
        start_date: formatDate(form.start_date),
        end_date: formatDate(form.end_date),
        business_justification: form.business_justification.trim(),
      });
      Alert.alert(
        'Success',
        'Expense type request submitted for approval.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to create expense type';
      Alert.alert('Error', typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Field label="Name" required error={errors.name}>
        <TextInput
          style={[styles.input, errors.name && styles.inputError]}
          placeholder="e.g. Customer Visit Expenses"
          placeholderTextColor={COLORS.textLight}
          value={form.name}
          onChangeText={v => set('name', v)}
        />
      </Field>

      <Field label="Description" required error={errors.description}>
        <TextInput
          style={[styles.input, styles.multiline, errors.description && styles.inputError]}
          placeholder="Describe the purpose of this expense type..."
          placeholderTextColor={COLORS.textLight}
          value={form.description}
          onChangeText={v => set('description', v)}
          multiline
          numberOfLines={3}
        />
      </Field>

      <Field label="Department" required error={errors.department}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {DEPARTMENTS.map(dept => (
            <TouchableOpacity
              key={dept}
              style={[styles.chip, form.department === dept && styles.chipSelected]}
              onPress={() => set('department', dept)}
            >
              <Text style={[styles.chipText, form.department === dept && styles.chipTextSelected]}>
                {dept}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Field>

      <View style={styles.row}>
        <View style={{ flex: 2, marginRight: 8 }}>
          <Field label="Budget Amount" required error={errors.budget_amount}>
            <TextInput
              style={[styles.input, errors.budget_amount && styles.inputError]}
              placeholder="10000"
              placeholderTextColor={COLORS.textLight}
              value={form.budget_amount}
              onChangeText={v => set('budget_amount', v)}
              keyboardType="decimal-pad"
            />
          </Field>
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Currency">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {CURRENCIES.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.chip, form.currency === c && styles.chipSelected]}
                  onPress={() => set('currency', c)}
                >
                  <Text style={[styles.chipText, form.currency === c && styles.chipTextSelected]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Field>
        </View>
      </View>

      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Field label="Start Date" required>
            <TouchableOpacity style={styles.dateButton} onPress={() => setShowStartPicker(true)}>
              <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
              <Text style={styles.dateText}>{formatDate(form.start_date)}</Text>
            </TouchableOpacity>
          </Field>
        </View>
        <View style={{ flex: 1 }}>
          <Field label="End Date" required error={errors.end_date}>
            <TouchableOpacity style={[styles.dateButton, errors.end_date && styles.inputError]} onPress={() => setShowEndPicker(true)}>
              <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
              <Text style={styles.dateText}>{formatDate(form.end_date)}</Text>
            </TouchableOpacity>
          </Field>
        </View>
      </View>

      {showStartPicker && (
        <DateTimePicker
          value={form.start_date}
          mode="date"
          onChange={(_, date) => { setShowStartPicker(false); if (date) set('start_date', date); }}
        />
      )}
      {showEndPicker && (
        <DateTimePicker
          value={form.end_date}
          mode="date"
          onChange={(_, date) => { setShowEndPicker(false); if (date) set('end_date', date); }}
        />
      )}

      <Field label="Business Justification" required error={errors.business_justification}>
        <TextInput
          style={[styles.input, styles.multiline, errors.business_justification && styles.inputError]}
          placeholder="Explain why this expense type is needed..."
          placeholderTextColor={COLORS.textLight}
          value={form.business_justification}
          onChangeText={v => set('business_justification', v)}
          multiline
          numberOfLines={4}
        />
      </Field>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={18} color={COLORS.info} />
        <Text style={styles.infoText}>
          Your request will be sent to Accounting for approval before becoming active.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.submitButton, loading && { opacity: 0.7 }]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color={COLORS.white} />
          : <>
              <Ionicons name="send-outline" size={18} color={COLORS.white} />
              <Text style={styles.submitText}> Submit for Approval</Text>
            </>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 40 },
  fieldContainer: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  required: { color: COLORS.error },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: COLORS.text,
  },
  inputError: { borderColor: COLORS.error },
  multiline: { minHeight: 80, textAlignVertical: 'top', paddingTop: 11 },
  errorText: { fontSize: 11, color: COLORS.error, marginTop: 4 },
  row: { flexDirection: 'row' },
  chipScroll: { marginTop: 2 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    marginRight: 6,
  },
  chipSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, color: COLORS.textSecondary },
  chipTextSelected: { color: COLORS.white, fontWeight: '600' },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 8,
  },
  dateText: { fontSize: 14, color: COLORS.text },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 8,
    alignItems: 'flex-start',
  },
  infoText: { flex: 1, fontSize: 13, color: COLORS.info, lineHeight: 18 },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});
