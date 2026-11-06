import React, { useState, useRef, useEffect } from 'react';
import { 
  Building2, 
  ChevronDown, 
  Check, 
  Plus, 
  KeyRound, 
  Copy, 
  CheckCheck,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { useMessContext } from '../../context/MessContext';
import { useAuthContext } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';

export const MessSelector = () => {
  const { 
    currentMess, 
    currentMessId, 
    userMesses, 
    switchMess, 
    createNewMess, 
    joinMessWithCode 
  } = useMessContext();
  const { user, isAdmin } = useAuthContext();

  const [isOpen, setIsOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);

  // Form states
  const [newMessName, setNewMessName] = useState('');
  const [newMessAddress, setNewMessAddress] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopyCode = (e) => {
    e.stopPropagation();
    if (currentMess?.inviteCode) {
      navigator.clipboard.writeText(currentMess.inviteCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newMessName.trim()) {
      setFormError('Please enter a mess name.');
      return;
    }

    setFormLoading(true);
    setFormError('');
    try {
      await createNewMess({
        name: newMessName.trim(),
        address: newMessAddress.trim(),
        currency: '৳',
      });
      setIsCreateOpen(false);
      setNewMessName('');
      setNewMessAddress('');
      setIsOpen(false);
    } catch (err) {
      setFormError(err.message || 'Failed to create mess.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleJoinSubmit = async (e) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) {
      setFormError('Please enter an invite code.');
      return;
    }

    setFormLoading(true);
    setFormError('');
    try {
      await joinMessWithCode(joinCodeInput.trim().toUpperCase());
      setIsJoinOpen(false);
      setJoinCodeInput('');
      setIsOpen(false);
    } catch (err) {
      setFormError(err.message || 'Invalid invite code. Please check and try again.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition-all text-left group"
        title="Active Mess and Switcher"
      >
        <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
          <Building2 className="w-3.5 h-3.5" />
        </div>
        <div className="hidden sm:block">
          <p className="text-xs font-black text-slate-800 leading-tight group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
            {currentMess?.name || 'Khadok Mess'}
          </p>
          <span className="text-[10px] font-bold text-slate-500">
            Code: <strong className="text-emerald-700 font-mono tracking-wider">{currentMess?.inviteCode || 'KHD101'}</strong>
          </span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-transform ml-0.5" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 sm:right-auto mt-2 w-72 origin-top-left rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/10 border border-slate-200/80 z-50 overflow-hidden animate-slide-up p-1.5">
          {/* Header */}
          <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Active Mess Accounts
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 transition-colors"
              title="Copy Mess Invite Code"
            >
              {copiedCode ? (
                <>
                  <CheckCheck className="w-3 h-3 text-emerald-600" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" /> Code: {currentMess?.inviteCode}
                </>
              )}
            </button>
          </div>

          {/* List of Messes */}
          <div className="max-h-56 overflow-y-auto py-1 space-y-0.5">
            {userMesses.map((m) => {
              const isSelected = m.id === currentMessId;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    switchMess(m.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-colors ${
                    isSelected
                      ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200/60'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="w-2 h-2 rounded-full shrink-0 bg-emerald-500" />
                    <div className="truncate">
                      <p className="truncate font-bold text-slate-900">{m.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">Code: {m.inviteCode}</p>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="pt-1.5 mt-1 border-t border-slate-100 grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => {
                setFormError('');
                setIsCreateOpen(true);
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-[11px] font-bold transition-colors border border-slate-200"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-600" /> + New Mess
            </button>

            <button
              type="button"
              onClick={() => {
                setFormError('');
                setIsJoinOpen(true);
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-700 text-[11px] font-bold transition-colors border border-slate-200"
            >
              <KeyRound className="w-3.5 h-3.5 text-sky-600" /> Join Code
            </button>
          </div>
        </div>
      )}

      {/* Modal: Create New Mess */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create a New Mess"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <p className="text-xs text-slate-500">
            Create an independent dining, grocery, and rent management system for another apartment or mess.
          </p>

          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mess / Apartment Name *
            </label>
            <Input
              type="text"
              placeholder="e.g. Dhanmondi Bachelor Mess"
              value={newMessName}
              onChange={(e) => setNewMessName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Location / Address (Optional)
            </label>
            <Input
              type="text"
              placeholder="e.g. Flat 4B, Road 7, Dhaka"
              value={newMessAddress}
              onChange={(e) => setNewMessAddress(e.target.value)}
            />
          </div>

          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong>Instant Setup:</strong> A unique 6-character invite code will be automatically generated. You will be the administrator of this new mess.
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={formLoading}
            >
              {formLoading ? 'Creating...' : 'Create Mess'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Join Mess with Code */}
      <Modal
        isOpen={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
        title="Join Mess with Invite Code"
      >
        <form onSubmit={handleJoinSubmit} className="space-y-4">
          <p className="text-xs text-slate-500">
            Enter the 6-character invite code provided by your mess manager to access your group meals and ledger.
          </p>

          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Invite Code *
            </label>
            <Input
              type="text"
              placeholder="e.g. KHD101"
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
              className="font-mono text-center tracking-widest text-lg font-black uppercase"
              maxLength={10}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsJoinOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={formLoading}
            >
              {formLoading ? 'Checking Code...' : 'Join Mess'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
