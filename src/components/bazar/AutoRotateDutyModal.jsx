import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { RefreshCw, Users, Check, Calendar } from 'lucide-react';
import { getTodayDayNumber } from '../../utils/dateUtils';

export const AutoRotateDutyModal = ({
  isOpen,
  onClose,
  onGenerate,
  activeMembers = [],
  currentUser = null,
  loading = false,
}) => {
  const [selectedMemberIds, setSelectedMemberIds] = useState(
    activeMembers.map((m) => m.id)
  );
  const [startDay, setStartDay] = useState(1);
  const [endDay, setEndDay] = useState(31);
  const [intervalDays, setIntervalDays] = useState(2);

  const toggleMember = (id) => {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelectedMemberIds(activeMembers.map((m) => m.id));
  const deselectAll = () => setSelectedMemberIds([]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (selectedMemberIds.length === 0) {
      alert('Please select at least one member to participate in the duty rotation.');
      return;
    }

    const participating = activeMembers.filter((m) =>
      selectedMemberIds.includes(m.id)
    );

    await onGenerate({
      startDay: Number(startDay) || 1,
      endDay: Number(endDay) || 31,
      intervalDays: Number(intervalDays) || 2,
      selectedMembers: participating,
      assignedBy: currentUser?.displayName || 'Administrator',
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Auto-Rotate Bazar Duties (স্বয়ংক্রিয় শিডিউল)"
      subtitle="Evenly distribute market shopping turns among mess members across the month"
    >
      <form onSubmit={handleGenerate} className="space-y-4">
        {/* Rotation cadence & range */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Start Day</label>
            <input
              type="number"
              min="1"
              max="31"
              value={startDay}
              onChange={(e) => setStartDay(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">End Day</label>
            <input
              type="number"
              min="1"
              max="31"
              value={endDay}
              onChange={(e) => setEndDay(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Duty Interval</label>
            <select
              value={intervalDays}
              onChange={(e) => setIntervalDays(Number(e.target.value))}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium"
            >
              <option value={1}>Every 1 Day (Daily)</option>
              <option value={2}>Every 2 Days (Alternate)</option>
              <option value={3}>Every 3 Days</option>
              <option value={4}>Every 4 Days</option>
            </select>
          </div>
        </div>

        {/* Member Selector List */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-600" />
              Participating Members ({selectedMemberIds.length}/{activeMembers.length})
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="text-[11px] font-semibold text-emerald-600 hover:underline"
              >
                Select All
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={deselectAll}
                className="text-[11px] font-semibold text-slate-500 hover:underline"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto space-y-1.5 p-2 rounded-xl border border-slate-200 bg-slate-50/50">
            {activeMembers.map((member) => {
              const isChecked = selectedMemberIds.includes(member.id);
              return (
                <div
                  key={member.id}
                  onClick={() => toggleMember(member.id)}
                  className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-colors text-xs select-none ${
                    isChecked
                      ? 'bg-emerald-50/70 border-emerald-300 text-slate-900 font-semibold'
                      : 'bg-white border-slate-200/80 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        isChecked
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span>{member.name}</span>
                  </div>
                  {member.phone && (
                    <span className="text-[11px] text-slate-400 font-normal">
                      {member.phone}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-[11px] text-slate-500 leading-relaxed bg-amber-50 p-2.5 rounded-xl border border-amber-200/80 text-amber-900">
          💡 <strong>Tip:</strong> The system rotates duties in round-robin order. Once created, you can easily notify any member directly on WhatsApp with 1 click!
        </p>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading} icon={RefreshCw}>
            Generate Schedule
          </Button>
        </div>
      </form>
    </Modal>
  );
};
