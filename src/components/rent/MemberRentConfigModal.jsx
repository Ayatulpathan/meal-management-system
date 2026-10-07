import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { CURRENCY_SYMBOL, formatCurrency } from '../../utils/currencyUtils';
import { Building, Users, Sparkles, AlertCircle } from 'lucide-react';

export const MemberRentConfigModal = ({
  isOpen,
  onClose,
  onSave,
  activeMembers = [],
  currentRentsMap = {},
  loading = false,
}) => {
  const [rentConfig, setRentConfig] = useState({});
  const [flatRentTotal, setFlatRentTotal] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const initialConfig = {};
    activeMembers.forEach((member) => {
      const existing = currentRentsMap[member.id];
      initialConfig[member.id] = {
        seatRent: existing?.seatRent !== undefined ? existing.seatRent : (member.rent || 0),
        room: existing?.room || member.room || '',
      };
    });
    setRentConfig(initialConfig);
    setError(null);
  }, [isOpen, activeMembers, currentRentsMap]);

  const handleSeatRentChange = (memberId, value) => {
    const numValue = Math.max(0, Number(value) || 0);
    setRentConfig((prev) => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        seatRent: numValue,
      },
    }));
  };

  const handleRoomChange = (memberId, value) => {
    setRentConfig((prev) => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        room: value,
      },
    }));
  };

  const handleDistributeFlatRent = () => {
    const total = Number(flatRentTotal);
    if (!total || total <= 0 || activeMembers.length === 0) return;

    const perMember = Math.round((total / activeMembers.length) * 100) / 100;
    const newConfig = { ...rentConfig };
    activeMembers.forEach((member) => {
      newConfig[member.id] = {
        ...(newConfig[member.id] || {}),
        seatRent: perMember,
      };
    });
    setRentConfig(newConfig);
  };

  const totalCalculatedSeatRent = Object.values(rentConfig).reduce(
    (acc, curr) => acc + (Number(curr.seatRent) || 0),
    0
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const result = await onSave(rentConfig);
      if (result?.success) {
        onClose();
      } else {
        setError(result?.error || 'Failed to save member rent configurations.');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Configure Room & Seat Rent"
      subtitle="Set seat/room rent for each active mess member for this month"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Equal Rent Split Tool */}
        <div className="p-4 bg-primary-50/60 border border-primary-100 rounded-xl">
          <div className="flex items-center gap-2 mb-2 text-primary-900 font-semibold text-sm">
            <Sparkles className="w-4 h-4 text-primary-600" />
            <span>Quick Flat Rent Splitter</span>
          </div>
          <p className="text-xs text-slate-600 mb-3">
            If your flat rent is fixed and shared equally, enter the total flat rent to distribute it among all {activeMembers.length} active members automatically.
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1">
              <Input
                name="flatRentTotal"
                type="number"
                step="any"
                min="0"
                placeholder="Total Flat Rent (e.g. 25000)"
                value={flatRentTotal}
                onChange={(e) => setFlatRentTotal(e.target.value)}
                prefix={CURRENCY_SYMBOL}
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={handleDistributeFlatRent}
              disabled={!flatRentTotal || Number(flatRentTotal) <= 0 || activeMembers.length === 0}
              className="whitespace-nowrap"
            >
              Distribute Equally ({activeMembers.length ? formatCurrency(Math.round(((Number(flatRentTotal) || 0) / activeMembers.length) * 100) / 100) : 0}/person)
            </Button>
          </div>
        </div>

        {/* Member-by-Member Rent Table / Inputs */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider px-2">
            <span>Member</span>
            <div className="flex items-center gap-8">
              <span className="w-24 text-center">Room / Seat</span>
              <span className="w-32 text-right">Rent ({CURRENCY_SYMBOL})</span>
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
            {activeMembers.map((member) => {
              const current = rentConfig[member.id] || { seatRent: 0, room: '' };
              return (
                <div key={member.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-800 text-sm truncate">{member.name}</p>
                    <p className="text-xs text-slate-400">{member.phone || 'Active Member'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="Room #"
                      value={current.room || ''}
                      onChange={(e) => handleRoomChange(member.id, e.target.value)}
                      className="w-24 px-2.5 py-1.5 text-xs text-center border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    />
                    <div className="relative w-32">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
                        {CURRENCY_SYMBOL}
                      </span>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={current.seatRent === 0 ? '' : current.seatRent}
                        onChange={(e) => handleSeatRentChange(member.id, e.target.value)}
                        placeholder="0"
                        className="w-full pl-6 pr-2.5 py-1.5 text-xs font-semibold text-right border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            {activeMembers.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">No active members found in mess.</p>
            )}
          </div>
        </div>

        {/* Total Footer */}
        <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
          <span className="text-sm font-medium text-slate-700">Total Fixed House Rent:</span>
          <span className="text-base font-bold text-slate-900">
            {formatCurrency(totalCalculatedSeatRent)}
          </span>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Save Rent Configuration
          </Button>
        </div>
      </form>
    </Modal>
  );
};
