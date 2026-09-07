import React, { useState } from 'react';
import { 
  Menu, 
  Calendar, 
  Plus, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  ChevronDown,
  User
} from 'lucide-react';
import { useMonthContext } from '../../context/MonthContext';
import { useAuthContext } from '../../context/AuthContext';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { formatMonthName } from '../../utils/dateUtils';

export const Header = ({ onMenuClick }) => {
  const { 
    selectedMonth, 
    selectMonth, 
    recentOptions, 
    monthsList, 
    createMonth, 
    isClosed,
    toggleMonthStatus 
  } = useMonthContext();

  const { isAdmin, user } = useAuthContext();

  const [isMonthModalOpen, setIsMonthModalOpen] = useState(false);
  const [newMonthInput, setNewMonthInput] = useState('');
  const [creating, setCreating] = useState(false);

  // Combine recent standard options with existing months in database
  const uniqueMonthsMap = new Map();
  recentOptions.forEach(opt => uniqueMonthsMap.set(opt.id, opt));
  monthsList.forEach(m => {
    uniqueMonthsMap.set(m.month || m.id, {
      id: m.month || m.id,
      name: m.monthName || formatMonthName(m.month || m.id),
      status: m.status,
    });
  });

  const monthOptions = Array.from(uniqueMonthsMap.values()).sort((a, b) => b.id.localeCompare(a.id));

  const handleCreateNewMonth = async (e) => {
    e.preventDefault();
    if (!newMonthInput) return;

    setCreating(true);
    try {
      await createMonth(newMonthInput);
      setIsMonthModalOpen(false);
      setNewMonthInput('');
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8 py-3.5 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:block">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Active Accounting Period
          </span>
          <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            {formatMonthName(selectedMonth)}
            {isClosed ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                <Lock className="w-2.5 h-2.5" /> Closed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-2.5 h-2.5" /> Active
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Global Month Selector & Quick Actions */}
      <div className="flex items-center gap-2.5">
        <div className="relative">
          <div className="flex items-center bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 cursor-pointer shadow-sm transition-colors">
            <Calendar className="w-4 h-4 text-emerald-600 mr-2 shrink-0" />
            <select
              value={selectedMonth}
              onChange={(e) => selectMonth(e.target.value)}
              className="bg-transparent border-none text-slate-800 font-semibold focus:outline-none focus:ring-0 cursor-pointer pr-5 appearance-none"
            >
              {monthOptions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.status === 'closed' ? '🔒' : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 pointer-events-none" />
          </div>
        </div>

        {isAdmin && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMonthModalOpen(true)}
              title="Add New Month"
              icon={Plus}
              className="hidden md:inline-flex text-slate-700"
            >
              New Month
            </Button>

            <Button
              variant={isClosed ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => toggleMonthStatus()}
              title={isClosed ? 'Reopen this month for editing' : 'Close this month to make it read-only'}
              icon={isClosed ? Unlock : Lock}
              className={`text-xs ${isClosed ? 'border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100' : 'text-slate-600'}`}
            >
              {isClosed ? 'Reopen' : 'Close Month'}
            </Button>
          </>
        )}
      </div>

      {/* Modal for creating custom/future month (Admin only) */}
      <Modal
        isOpen={isMonthModalOpen}
        onClose={() => setIsMonthModalOpen(false)}
        title="Create New Month"
        subtitle="Initialize a new monthly record ledger"
      >
        <form onSubmit={handleCreateNewMonth} className="space-y-4">
          <Input
            label="Month (YYYY-MM)"
            type="month"
            value={newMonthInput}
            onChange={(e) => setNewMonthInput(e.target.value)}
            required
            helperText="Select the year and month to initialize"
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsMonthModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={creating}>
              Initialize Month
            </Button>
          </div>
        </form>
      </Modal>
    </header>
  );
};
