import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { formatCurrency, CURRENCY_SYMBOL } from '../../utils/currencyUtils';
import { getTodayDateString } from '../../utils/dateUtils';
import { PAYMENT_METHODS } from '../../models/rentUtilityModel';
import { Coins, CheckCircle, AlertCircle } from 'lucide-react';

export const RentPaymentForm = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  activeMembers = [],
  memberSummaries = [],
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

  const selectedSummary = memberSummaries.find((m) => m.id === formData.memberId);
  const inputAmount = Number(formData.amount) || 0;
  const prevAmount = isEditing ? (Number(initialData?.amount) || 0) : 0;
  const currentPaid = selectedSummary?.totalPaid || 0;
  const totalPayable = selectedSummary?.totalDue || 0;
  const simulatedPaid = currentPaid - prevAmount + inputAmount;
  const simulatedExtra = Math.round((simulatedPaid - totalPayable) * 100) / 100;
  const isExtraPayment = simulatedExtra > 0;

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

        {selectedSummary && (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1.5">
            <div className="flex items-center justify-between font-semibold text-slate-700">
              <span>Member Overview: {selectedSummary.name}</span>
              <span className="text-slate-500 font-normal">{selectedSummary.room ? `Room ${selectedSummary.room}` : ''}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200 text-slate-600">
              <div>
                <span className="block text-[10px] text-slate-400">Total Due</span>
                <span className="font-bold text-slate-900">{formatCurrency(selectedSummary.totalDue)}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400">Already Paid</span>
                <span className="font-bold text-emerald-600">{formatCurrency(selectedSummary.totalPaid)}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400">Current Due</span>
                <span className={`font-bold ${selectedSummary.dueRemaining > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                  {formatCurrency(selectedSummary.dueRemaining)}
                </span>
              </div>
            </div>
            {selectedSummary.extraAmount > 0 && (
              <div className="pt-1.5 border-t border-slate-200 text-emerald-800 text-[11px] font-semibold flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  Already has <strong>+{formatCurrency(selectedSummary.extraAmount)}</strong> extra (Will get: {formatCurrency(selectedSummary.extraAmount)}).
                </span>
              </div>
            )}
          </div>
        )}

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

        {inputAmount > 0 && isExtraPayment && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/90 text-emerald-950 text-xs flex items-start gap-2.5 shadow-2xs">
            <Coins className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">
                Extra Payment Detected: +{formatCurrency(simulatedExtra)}
              </p>
              <p className="text-emerald-800 text-[11px] mt-0.5 leading-relaxed">
                With this payment, {selectedSummary?.name || 'the member'} pays <strong>+{formatCurrency(simulatedExtra)} extra</strong> beyond their total bill ({formatCurrency(totalPayable)}).
                <br />
                The member <strong className="text-emerald-950 font-bold underline">will get {formatCurrency(simulatedExtra)}</strong> back as a refund or advance adjustment!
              </p>
            </div>
          </div>
        )}

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
