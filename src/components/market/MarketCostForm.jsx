import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { CURRENCY_SYMBOL } from '../../utils/currencyUtils';
import { getTodayDateString } from '../../utils/dateUtils';

export const MarketCostForm = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    date: getTodayDateString(),
    amount: '',
    description: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        date: initialData.date || getTodayDateString(),
        amount: initialData.amount !== undefined ? String(initialData.amount) : '',
        description: initialData.description || '',
      });
    } else {
      setFormData({
        date: getTodayDateString(),
        amount: '',
        description: '',
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Market Expense' : 'Add Market Expense'}
      subtitle={isEditing ? 'Update grocery purchase details' : 'Record grocery and daily bazaar expense'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Purchase Date"
          name="date"
          type="date"
          value={formData.date}
          onChange={handleChange}
          required
          error={errors.date}
        />

        <Input
          label="Amount"
          name="amount"
          type="number"
          step="any"
          min="1"
          value={formData.amount}
          onChange={handleChange}
          placeholder="e.g. 2500"
          prefix={CURRENCY_SYMBOL}
          required
          error={errors.amount}
          helperText="Enter cost in Bangladeshi Taka"
        />

        <Input
          label="Description / Items Purchased"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="e.g. Rice, Chicken, Cooking Oil, Spices"
          error={errors.description}
        />

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {isEditing ? 'Save Changes' : 'Record Expense'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
