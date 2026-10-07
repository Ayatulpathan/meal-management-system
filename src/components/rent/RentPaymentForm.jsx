import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { CURRENCY_SYMBOL } from '../../utils/currencyUtils';
import { getTodayDateString } from '../../utils/dateUtils';
import { PAYMENT_METHODS } from '../../models/rentUtilityModel';

export const RentPaymentForm = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  activeMembers = [],
  currentUser = null,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    memberId: '',
    memberName: '',
    amount: '',
    date: getTodayDateString(),
    paymentMethod: 'Cash',
    note: '',
    recordedBy: currentUser?.displayName || 'Administrator',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        memberId: initialData.memberId || '',
        memberName: initialData.memberName || '',
        amount: initialData.amount !== undefined ? String(initialData.amount) : '',
        date: initialData.date || getTodayDateString(),
        paymentMethod: initialData.paymentMethod || 'Cash',
        note: initialData.note || '',
        recordedBy: initialData.recordedBy || currentUser?.displayName || 'Administrator',
      });
    } else {
      setFormData({
        memberId: activeMembers[0]?.id || '',
        memberName: activeMembers[0]?.name || '',
        amount: '',
        date: getTodayDateString(),
        paymentMethod: 'Cash',
        note: '',
        recordedBy: currentUser?.displayName || 'Administrator',
      });
    }
    setErrors({});
  }, [initialData, isOpen, activeMembers, currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'memberId') {
        const found = activeMembers.find((m) => m.id === value);
        if (found) {
          updated.memberName = found.name;
        }
      }
      return updated;
    });
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.memberId) {
      setErrors({ memberId: 'Please select a member.' });
      return;
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      setErrors({ amount: 'Please enter a valid amount greater than 0.' });
      return;
    }

    const member = activeMembers.find((m) => m.id === formData.memberId);
    const result = await onSubmit({
      ...formData,
      memberName: member ? member.name : formData.memberName,
      amount: Number(formData.amount),
    });

    if (!result?.success && result?.errors) {
      setErrors(result.errors);
    }
  };

  const isEditing = !!initialData;

  const memberOptions = activeMembers.map((m) => ({
    value: m.id,
    label: `${m.name}${m.room ? ` (Room ${m.room})` : ''}`,
  }));

  const paymentMethodOptions = PAYMENT_METHODS.map((method) => ({
    value: method,
    label: method,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Rent Payment' : 'Record Rent / Utility Payment'}
      subtitle="Record money received from a member for house rent and utilities"
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Payment Amount"
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
          />

          <Input
            label="Payment Date"
            name="date"
            type="date"
            value={formData.date}
            onChange={handleChange}
            required
            error={errors.date}
          />
        </div>

        <Select
          label="Payment Method"
          name="paymentMethod"
          value={formData.paymentMethod}
          onChange={handleChange}
          options={paymentMethodOptions}
        />

        <Input
          label="Transaction ID / Note (Optional)"
          name="note"
          value={formData.note}
          onChange={handleChange}
          placeholder="e.g. TrxID: 9X87ASD2, Paid via bKash"
        />

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {isEditing ? 'Save Changes' : 'Record Payment'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
