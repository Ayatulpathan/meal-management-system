import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { CURRENCY_SYMBOL, formatCurrency } from '../../utils/currencyUtils';
import { getTodayDateString } from '../../utils/dateUtils';
import { UTILITY_CATEGORIES } from '../../models/rentUtilityModel';
import { Users, CheckSquare, Square, AlertCircle, Sparkles } from 'lucide-react';

export const UtilityBillForm = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  activeMembers = [],
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
    includedMembers: [],
  });

  const [splitMode, setSplitMode] = useState('all'); // 'all' | 'custom'
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
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
      const hasCustomMembers = Array.isArray(initialData.includedMembers) && initialData.includedMembers.length > 0;
      setFormData({
        category: initialData.category || 'electricity',
        title: initialData.title || '',
        amount: initialData.amount !== undefined ? String(initialData.amount) : '',
        date: initialData.date || getTodayDateString(),
        note: initialData.note || '',
        paidBy: initialData.paidBy || currentUser?.displayName || 'Administrator',
        includedMembers: initialData.includedMembers || [],
      });
      setSplitMode(hasCustomMembers ? 'custom' : 'all');
      setSelectedMemberIds(hasCustomMembers ? initialData.includedMembers : activeMembers.map(m => m.id));
    } else {
      setFormData({
        category: 'electricity',
        title: categoryMap['electricity'],
        amount: '',
        date: getTodayDateString(),
        note: '',
        paidBy: currentUser?.displayName || 'Administrator',
        includedMembers: [],
      });
      setSplitMode('all');
      setSelectedMemberIds(activeMembers.map(m => m.id));
    }
    setErrors({});
  }, [initialData, isOpen, currentUser, activeMembers]);

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

  const handleToggleMember = (memberId) => {
    setSelectedMemberIds((prev) => {
      if (prev.includes(memberId)) {
        return prev.filter(id => id !== memberId);
      } else {
        return [...prev, memberId];
      }
    });
    if (errors.members) {
      setErrors((prev) => ({ ...prev, members: '' }));
    }
  };

  const handleSelectAll = () => {
    setSelectedMemberIds(activeMembers.map(m => m.id));
    if (errors.members) {
      setErrors((prev) => ({ ...prev, members: '' }));
    }
  };

  const handleDeselectAll = () => {
    setSelectedMemberIds([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amountNum = Number(formData.amount);
    if (!amountNum || amountNum <= 0) {
      setErrors({ amount: 'Please enter a valid bill amount greater than 0.' });
      return;
    }

    let finalIncluded = [];
    if (splitMode === 'custom') {
      if (selectedMemberIds.length === 0) {
        setErrors({ members: 'Please select at least one member to share this bill.' });
        return;
      }
      finalIncluded = selectedMemberIds;
    } else {
      finalIncluded = []; // empty means all active members
    }

    const result = await onSubmit({
      ...formData,
      amount: amountNum,
      includedMembers: finalIncluded,
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

  const activeCount = splitMode === 'all' ? activeMembers.length : selectedMemberIds.length;
  const currentAmount = Number(formData.amount) || 0;
  const perPersonCalculated = activeCount > 0 && currentAmount > 0
    ? Math.round((currentAmount / activeCount) * 100) / 100
    : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Utility Bill' : 'Record Utility Expense'}
      subtitle="Record utility bill and select which members share the cost"
      maxWidth="max-w-xl"
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

        {/* Member Selection for this Bill */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-primary-600" />
              Who Pays This Bill?
            </label>
            <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setSplitMode('all')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  splitMode === 'all'
                    ? 'bg-primary-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Members ({activeMembers.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setSplitMode('custom');
                  if (selectedMemberIds.length === 0) {
                    setSelectedMemberIds(activeMembers.map(m => m.id));
                  }
                }}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  splitMode === 'custom'
                    ? 'bg-primary-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Select Members
              </button>
            </div>
          </div>

          {/* Custom Member Checkbox List */}
          {splitMode === 'custom' ? (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs text-slate-500 pb-1 border-b border-slate-200">
                <span>Select members who will contribute to this bill:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-primary-600 hover:underline font-medium"
                  >
                    Select All
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="text-slate-500 hover:underline"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {errors.members && (
                <div className="flex items-center gap-1.5 text-xs text-red-600 font-medium bg-red-50 p-2 rounded-lg border border-red-200">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.members}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {activeMembers.map((member) => {
                  const isSelected = selectedMemberIds.includes(member.id);
                  return (
                    <label
                      key={member.id}
                      onClick={() => handleToggleMember(member.id)}
                      className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition-all select-none ${
                        isSelected
                          ? 'bg-primary-50/80 border-primary-300 text-primary-950 font-semibold'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={isSelected}
                        onChange={() => {}}
                      />
                      <div className={`p-0.5 rounded ${isSelected ? 'text-primary-600' : 'text-slate-300'}`}>
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 fill-primary-600 text-white" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="truncate block">{member.name}</span>
                        {member.room && (
                          <span className="text-[10px] text-slate-400 font-normal">Room {member.room}</span>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              This bill will be divided equally among all <strong>{activeMembers.length} active mess members</strong>.
            </p>
          )}

          {/* Dynamic Per-Person Share Pill */}
          <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 text-xs font-medium">
            <span className="text-slate-600">
              Split among <strong>{activeCount}</strong> member{activeCount === 1 ? '' : 's'}:
            </span>
            <span className="text-amber-700 font-bold text-sm">
              {formatCurrency(perPersonCalculated)} / person
            </span>
          </div>
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
