import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { CURRENCY_SYMBOL } from '../../utils/currencyUtils';
import { getTodayDateString } from '../../utils/dateUtils';

export const DepositForm = ({
  isOpen,
  onClose,
  onSubmit,
  members = [],
  initialData = null,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    memberId: '',
    amount: '',
    date: getTodayDateString(),
    note: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        memberId: initialData.memberId || '',
        amount: initialData.amount !== undefined ? String(initialData.amount) : '',
        date: initialData.date || getTodayDateString(),
        note: initialData.note || '',
      });
    } else {
      setFormData({
        memberId: members[0]?.id || '',
        amount: '',
        date: getTodayDateString(),
        note: '',
      });
    }
    setErrors({});
  }, [initialData, members, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await onSubmit({
      ...formData,
      amount: Number(formData.amount),
    });
    if (!result.success && result.errors) {
      setErrors(result.errors);
    }
  };

  const isEditing = !!initialData;

  const memberOptions = members.map((m) => ({
    value: m.id,
    label: `${m.name}${m.status === 'inactive' ? ' (Inactive)' : ''}`,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Deposit Record' : 'Record Member Deposit'}
      subtitle={isEditing ? 'Update deposit transaction' : 'Record advance or monthly fund deposit'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Select Member"
          name="memberId"
          value={formData.memberId}
          onChange={handleChange}
          options={memberOptions}
          required
          error={errors.memberId}
        />

        <Input
          label="Deposit Amount"
          name="amount"
          type="number"
          step="any"
          min="1"
          value={formData.amount}
          onChange={handleChange}
          placeholder="e.g. 5000"
          prefix={CURRENCY_SYMBOL}
          required
          error={errors.amount}
          helperText="Enter deposit amount in Bangladeshi Taka"
        />

        <Input
          label="Deposit Date"
          name="date"
          type="date"
          value={formData.date}
          onChange={handleChange}
          required
          error={errors.date}
        />

        <Input
          label="Payment Note / Method"
          name="note"
          value={formData.note}
          onChange={handleChange}
          placeholder="e.g. bKash / Nagad / Cash / Bank"
          error={errors.note}
        />

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {isEditing ? 'Save Changes' : 'Record Deposit'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
