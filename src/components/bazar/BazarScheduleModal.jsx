import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { CURRENCY_SYMBOL } from '../../utils/currencyUtils';
import { getTodayDateString } from '../../utils/dateUtils';
import { MessageSquare, Phone, Calendar, User, FileText, Send, Mail } from 'lucide-react';

export const BazarScheduleModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  activeMembers = [],
  currentUser = null,
  loading = false,
  onNotifyWhatsApp = null,
}) => {
  const [formData, setFormData] = useState({
    memberId: '',
    memberName: '',
    memberPhone: '',
    memberEmail: '',
    date: getTodayDateString(),
    notes: '',
    estimatedBudget: '',
    autoNotify: true,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        memberId: initialData.memberId || '',
        memberName: initialData.memberName || '',
        memberPhone: initialData.memberPhone || '',
        memberEmail: initialData.memberEmail || '',
        date: initialData.date || getTodayDateString(),
        notes: initialData.notes || '',
        estimatedBudget: initialData.estimatedBudget ? String(initialData.estimatedBudget) : '',
        autoNotify: false,
      });
    } else {
      const defaultMember = activeMembers[0];
      setFormData({
        memberId: defaultMember?.id || '',
        memberName: defaultMember?.name || '',
        memberPhone: defaultMember?.phone || '',
        memberEmail: defaultMember?.email || '',
        date: getTodayDateString(),
        notes: '',
        estimatedBudget: '',
        autoNotify: true,
      });
    }
    setErrors({});
  }, [initialData, isOpen, activeMembers]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;

    setFormData((prev) => {
      const updated = { ...prev, [name]: val };
      if (name === 'memberId') {
        const found = activeMembers.find((m) => m.id === value);
        if (found) {
          updated.memberName = found.name;
          updated.memberPhone = found.phone || '';
          updated.memberEmail = found.email || '';
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
    if (!formData.date) {
      setErrors({ date: 'Please select a date.' });
      return;
    }

    const member = activeMembers.find((m) => m.id === formData.memberId);
    const schedulePayload = {
      ...formData,
      memberName: member ? member.name : formData.memberName,
      memberPhone: formData.memberPhone || member?.phone || '',
      memberEmail: formData.memberEmail || member?.email || '',
      estimatedBudget: Number(formData.estimatedBudget) || 0,
      assignedBy: currentUser?.displayName || 'Administrator',
    };

    const res = await onSubmit(schedulePayload);
    if (res?.success) {
      if (formData.autoNotify && onNotifyWhatsApp) {
        onNotifyWhatsApp(schedulePayload);
      }
    }
  };

  const isEditing = !!initialData;

  const memberOptions = activeMembers.map((m) => ({
    value: m.id,
    label: `${m.name}${m.phone ? ` (${m.phone})` : ''}${m.email ? ` • ${m.email}` : ''}`,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Bazar Duty Schedule' : 'Assign Member Bazar Duty (বাজার শিডিউল)'}
      subtitle="Schedule which mess member goes for grocery shopping on a specific date"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Select Member on Duty"
            name="memberId"
            value={formData.memberId}
            onChange={handleChange}
            options={memberOptions}
            required
            error={errors.memberId}
          />

          <Input
            label="Duty Date"
            name="date"
            type="date"
            value={formData.date}
            onChange={handleChange}
            required
            error={errors.date}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Phone Number (WhatsApp)"
            name="memberPhone"
            value={formData.memberPhone}
            onChange={handleChange}
            placeholder="017XXXXXXXX"
            prefix={<Phone className="w-4 h-4 text-slate-400" />}
            helperText="Used to send WhatsApp duty alert"
          />

          <Input
            label="Email Address (Gmail Alert)"
            name="memberEmail"
            type="email"
            value={formData.memberEmail}
            onChange={handleChange}
            placeholder="member@gmail.com"
            prefix={<Mail className="w-4 h-4 text-slate-400" />}
            helperText="Used for automated email duty alert"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Estimated Budget (Optional)"
            name="estimatedBudget"
            type="number"
            min="0"
            step="any"
            value={formData.estimatedBudget}
            onChange={handleChange}
            placeholder="e.g. 2500"
            prefix={CURRENCY_SYMBOL}
          />

          <Input
            label="Bazar Notes / Grocery Items (Optional)"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="e.g. Fish, fresh vegetables, rice"
            prefix={<FileText className="w-4 h-4 text-slate-400" />}
          />
        </div>

        {!isEditing && (
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-emerald-900 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Send WhatsApp notification to member upon saving?</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="autoNotify"
                checked={formData.autoNotify}
                onChange={handleChange}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading} icon={Send}>
            {isEditing ? 'Save Changes' : 'Assign & Schedule'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
