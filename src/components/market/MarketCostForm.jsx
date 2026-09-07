import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { CURRENCY_SYMBOL } from '../../utils/currencyUtils';
import { getTodayDateString } from '../../utils/dateUtils';
import { User } from 'lucide-react';

export const MarketCostForm = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  members = [],
  currentUser = null,
  loading = false,
}) => {
  const defaultBuyer = initialData?.buyerName || currentUser?.displayName || 'Administrator';

  const [formData, setFormData] = useState({
    date: getTodayDateString(),
    amount: '',
    description: '',
    buyerName: defaultBuyer,
  });
  const [customBuyer, setCustomBuyer] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      const initialBuyer = initialData.buyerName || currentUser?.displayName || 'Administrator';
      const isKnown = members.some(m => m.name === initialBuyer) || initialBuyer === 'Administrator';

      setFormData({
        date: initialData.date || getTodayDateString(),
        amount: initialData.amount !== undefined ? String(initialData.amount) : '',
        description: initialData.description || '',
        buyerName: isKnown ? initialBuyer : 'custom',
      });
      if (!isKnown) {
        setCustomBuyer(initialBuyer);
        setIsCustomMode(true);
      } else {
        setIsCustomMode(false);
      }
    } else {
      const defaultName = currentUser?.displayName || 'Administrator';
      setFormData({
        date: getTodayDateString(),
        amount: '',
        description: '',
        buyerName: defaultName,
      });
      setIsCustomMode(false);
      setCustomBuyer('');
    }
    setErrors({});
  }, [initialData, isOpen, currentUser, members]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'buyerName') {
      if (value === 'custom') {
        setIsCustomMode(true);
      } else {
        setIsCustomMode(false);
      }
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalBuyer = isCustomMode 
      ? (customBuyer.trim() || 'Administrator')
      : (formData.buyerName || 'Administrator');

    const result = await onSubmit({
      ...formData,
      amount: Number(formData.amount),
      buyerName: finalBuyer,
    });
    if (!result.success && result.errors) {
      setErrors(result.errors);
    }
  };

  const isEditing = !!initialData;

  const buyerOptions = [
    { value: 'Administrator', label: '👑 Administrator / Manager' },
    ...members.map(m => ({ value: m.name, label: `👤 ${m.name}` })),
    { value: 'custom', label: '✏️ Other / Custom Name...' },
  ];

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

        {/* Purchaser / Buyer Selection */}
        <Select
          label="Purchased / Spent By (Visible to all)"
          name="buyerName"
          value={formData.buyerName}
          onChange={handleChange}
          options={buyerOptions}
          helperText="Select which mess member or manager went to the bazaar"
        />

        {isCustomMode && (
          <Input
            label="Custom Purchaser Name"
            value={customBuyer}
            onChange={(e) => setCustomBuyer(e.target.value)}
            placeholder="Enter name of person who shopped"
            prefix={<User className="w-4 h-4 text-slate-400" />}
            required
          />
        )}

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

