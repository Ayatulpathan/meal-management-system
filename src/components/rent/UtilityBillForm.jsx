import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { CURRENCY_SYMBOL } from '../../utils/currencyUtils';
import { getTodayDateString } from '../../utils/dateUtils';
import { UTILITY_CATEGORIES } from '../../models/rentUtilityModel';
import { Zap, Flame, Droplets, Wifi, UserCheck, Trash2, Building2, Receipt } from 'lucide-react';

export const UtilityBillForm = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  currentUser = null,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    category: 'electricity',
    title: '',
    amount: '',
    date: getTodayDateString(),
    note: '',
    paidBy: currentUser?.displayName || 'Administrator',
  });
  const [errors, setErrors] = useState({});

  const categoryMap = {
    electricity: 'DESCO / Electricity Bill',
    gas: 'Gas Bill',
    water: 'Water (WASA) Bill',
    internet: 'Internet / WiFi Bill',
    maid: 'Maid / Cook Allowance',
    waste: 'Waste Collection Fee',
    service: 'Service / Maintenance Charge',
    other: 'Other Utility Expense',
  };

  useEffect(() => {
    if (initialData) {
      setFormData({
        category: initialData.category || 'electricity',
        title: initialData.title || '',
        amount: initialData.amount !== undefined ? String(initialData.amount) : '',
        date: initialData.date || getTodayDateString(),
        note: initialData.note || '',
        paidBy: initialData.paidBy || currentUser?.displayName || 'Administrator',
      });
    } else {
      setFormData({
        category: 'electricity',
        title: categoryMap['electricity'],
        amount: '',
        date: getTodayDateString(),
        note: '',
        paidBy: currentUser?.displayName || 'Administrator',
      });
    }
    setErrors({});
  }, [initialData, isOpen, currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'category' && !initialData) {
        updated.title = categoryMap[value] || 'Utility Bill';
      }
      return updated;
    });
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      setErrors({ amount: 'Please enter a valid bill amount greater than 0.' });
      return;
    }

    const result = await onSubmit({
      ...formData,
      amount: Number(formData.amount),
    });
    if (!result?.success && result?.errors) {
      setErrors(result.errors);
    }
  };

  const isEditing = !!initialData;

  const categoryOptions = UTILITY_CATEGORIES.map(c => ({
    value: c.id,
    label: c.label,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Utility Bill' : 'Record Utility Expense'}
      subtitle="Shared bill divided equally among all active mess members"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Category Picker */}
        <Select
          label="Bill Category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          options={categoryOptions}
        />

        <Input
          label="Bill Title / Description"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="e.g. DESCO Prepaid Meter #4821"
          required
          error={errors.title}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Bill Amount"
            name="amount"
            type="number"
            step="any"
            min="1"
            value={formData.amount}
            onChange={handleChange}
            placeholder="e.g. 3500"
            prefix={CURRENCY_SYMBOL}
            required
            error={errors.amount}
          />

          <Input
            label="Billing Date"
            name="date"
            type="date"
            value={formData.date}
            onChange={handleChange}
            required
            error={errors.date}
          />
        </div>

        <Input
          label="Paid By / Manager"
          name="paidBy"
          value={formData.paidBy}
          onChange={handleChange}
          placeholder="e.g. Administrator"
        />

        <Input
          label="Note / Receipt Details (Optional)"
          name="note"
          value={formData.note}
          onChange={handleChange}
          placeholder="e.g. Receipt #9821, Paid via bKash"
        />

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {isEditing ? 'Save Changes' : 'Record Utility Bill'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
