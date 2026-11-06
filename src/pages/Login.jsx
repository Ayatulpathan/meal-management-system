import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  UtensilsCrossed, 
  Lock, 
  Mail, 
  ArrowRight, 
  ShieldCheck, 
  User, 
  Sparkles,
  Building2,
  MessageSquare,
  KeyRound,
  ShieldAlert,
  Phone
} from 'lucide-react';
import { useAuthContext } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { messService } from '../services/messService';
import { memberService } from '../services/memberService';

export const Login = () => {
  const { login } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState('admin'); // 'admin' or 'member'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Multi-Mess modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  // Create Mess Form fields
  const [newMessName, setNewMessName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminPhone, setAdminPhone] = useState('');

  // Join Mess Form fields
  const [joinCode, setJoinCode] = useState('');
  const [memberName, setMemberName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberPassword, setMemberPassword] = useState('');
  const [memberPhone, setMemberPhone] = useState('');

  const from = location.state?.from?.pathname;

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError(null);
    setEmail('');
    setPassword('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        const userRole = result.user?.role || 'admin';
        const defaultDestination = userRole === 'member' ? '/portal' : '/dashboard';
        navigate(from || defaultDestination, { replace: true });
      } else {
        setError(result.error || 'Invalid credentials. Please check and try again.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during sign in.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMessSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    if (!newMessName.trim() || !adminEmail.trim() || !adminPassword.trim()) {
      setModalError('Please fill in all required fields.');
      return;
    }

    setModalLoading(true);
    try {
      // 1. Create the mess
      const createdMess = await messService.createMess({
        name: newMessName.trim(),
        managerEmail: adminEmail.trim().toLowerCase(),
        managerName: adminName.trim() || 'Mess Manager',
        managerPhone: adminPhone.trim(),
        currency: '৳',
      });

      // 2. Register the manager as admin member of that mess
      await memberService.createMember({
        name: adminName.trim() || 'Mess Manager',
        email: adminEmail.trim().toLowerCase(),
        password: adminPassword.trim(),
        phone: adminPhone.trim(),
        role: 'admin',
        status: 'active',
        messId: createdMess.id,
      }, createdMess.id);

      // 3. Immediately log in
      const res = await login(adminEmail.trim(), adminPassword.trim());
      if (res.success) {
        setIsCreateOpen(false);
        navigate('/dashboard', { replace: true });
      } else {
        setModalError(res.error || 'Mess created! Please log in above.');
      }
    } catch (err) {
      setModalError(err.message || 'Failed to create new mess.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleJoinMessSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    if (!joinCode.trim() || !memberEmail.trim() || !memberPassword.trim() || !memberName.trim()) {
      setModalError('Please fill in all required fields.');
      return;
    }

    setModalLoading(true);
    try {
      // 1. Check if mess exists with this invite code
      const targetMess = await messService.getMessByInviteCode(joinCode.trim().toUpperCase());
      if (!targetMess) {
        setModalError(`No mess found with invite code "${joinCode.trim().toUpperCase()}".`);
        setModalLoading(false);
        return;
      }

      // 2. Register member under this mess
      await memberService.createMember({
        name: memberName.trim(),
        email: memberEmail.trim().toLowerCase(),
        password: memberPassword.trim(),
        phone: memberPhone.trim(),
        role: 'member',
        status: 'active',
        messId: targetMess.id,
      }, targetMess.id);

      // 3. Immediately log in
      const res = await login(memberEmail.trim(), memberPassword.trim());
      if (res.success) {
        setIsJoinOpen(false);
        navigate('/portal', { replace: true });
      } else {
        setModalError(res.error || 'Joined successfully! Please log in above.');
      }
    } catch (err) {
      setModalError(err.message || 'Failed to join mess.');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col justify-center py-10 sm:px-6 lg:px-8 relative overflow-hidden select-none">
      {/* Ambient background glow orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-10 left-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Header Brand */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-2xl shadow-emerald-500/30 mb-4 ring-4 ring-white/10 animate-fade-in">
          <UtensilsCrossed className="w-8 h-8" />
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          MessHishab
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-400 font-medium">
          Modern Mess Dining, Expense & House Rent Management
        </p>

        {/* Feature Pills */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/10 text-slate-300 backdrop-blur-xs border border-white/10">
            <Sparkles className="w-3 h-3 text-emerald-400" /> 31-Day Grid
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/10 text-slate-300 backdrop-blur-xs border border-white/10">
            <Building2 className="w-3 h-3 text-amber-400" /> Rent & Utilities
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/10 text-slate-300 backdrop-blur-xs border border-white/10">
            <MessageSquare className="w-3 h-3 text-sky-400" /> Live Chat
          </span>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 z-10">
        <div className="bg-white/95 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-3xl sm:px-10 border border-white/20 animate-slide-up">
          {/* Role Selection Tabs */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100/80 p-1.5 rounded-2xl mb-6 border border-slate-200/60">
            <button
              type="button"
              onClick={() => handleTabChange('admin')}
              className={`py-2 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'admin'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/70'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Admin Portal
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('member')}
              className={`py-2 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'member'
                  ? 'bg-white text-emerald-900 shadow-sm border border-slate-200/70'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4 text-emerald-600" />
              Member Portal
            </button>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <Lock className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit} autoComplete="off">
            <Input
              label={activeTab === 'admin' ? 'Admin Email Address' : 'Member Email Address'}
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={activeTab === 'admin' ? 'admin@messhishab.com' : 'member@messhishab.com'}
              prefix={<Mail className="w-4 h-4" />}
              autoComplete="off"
              required
            />

            <Input
              label="Password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              prefix={<Lock className="w-4 h-4" />}
              autoComplete="new-password"
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full mt-2 font-bold shadow-md"
            >
              Sign In to {activeTab === 'admin' ? 'Admin Console' : 'Member Portal'}{' '}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          {/* Multi-Mess Quick Actions */}
          <div className="mt-6 pt-5 border-t border-slate-200/70">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center mb-3">
              Need to setup or join another mess?
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setModalError('');
                  setIsCreateOpen(true);
                }}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-xs font-bold transition-all border border-slate-200/80 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                + Create Mess
              </button>
              <button
                type="button"
                onClick={() => {
                  setModalError('');
                  setIsJoinOpen(true);
                }}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-700 text-xs font-bold transition-all border border-slate-200/80 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <KeyRound className="w-3.5 h-3.5 text-sky-600" />
                Join with Code
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-[11px] text-slate-500 font-medium">
            © {new Date().getFullYear()} Ayatul Khan Pathan. All rights reserved.
          </p>
        </div>
      </div>

      {/* Modal: Create a New Mess */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Setup a New Mess"
      >
        <form onSubmit={handleCreateMessSubmit} className="space-y-3.5">
          <p className="text-xs text-slate-500">
            Create an independent dining, meal ledger, and rent management system for your mess or flat.
          </p>

          {modalError && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mess / Apartment Name *
            </label>
            <Input
              type="text"
              placeholder="e.g. Dhanmondi Flat 4B Mess"
              value={newMessName}
              onChange={(e) => setNewMessName(e.target.value)}
              prefix={<Building2 className="w-4 h-4" />}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Manager / Admin Name *
            </label>
            <Input
              type="text"
              placeholder="e.g. Tanvir Rahman"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              prefix={<User className="w-4 h-4" />}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Admin Email *
            </label>
            <Input
              type="email"
              placeholder="e.g. tanvir@gmail.com"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              prefix={<Mail className="w-4 h-4" />}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Password *
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                prefix={<Lock className="w-4 h-4" />}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Phone Number
              </label>
              <Input
                type="tel"
                placeholder="017xxxxxxxx"
                value={adminPhone}
                onChange={(e) => setAdminPhone(e.target.value)}
                prefix={<Phone className="w-4 h-4" />}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
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
              disabled={modalLoading}
            >
              {modalLoading ? 'Creating Mess...' : 'Create & Login'}
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
        <form onSubmit={handleJoinMessSubmit} className="space-y-3.5">
          <p className="text-xs text-slate-500">
            Enter the 6-character invite code provided by your manager to register and join your mess.
          </p>

          {modalError && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mess Invite Code *
            </label>
            <Input
              type="text"
              placeholder="e.g. KHD101"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              prefix={<KeyRound className="w-4 h-4" />}
              className="font-mono uppercase font-black text-center tracking-widest text-lg"
              maxLength={10}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Your Full Name *
            </label>
            <Input
              type="text"
              placeholder="e.g. Sabbir Ahmed"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              prefix={<User className="w-4 h-4" />}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Email Address *
            </label>
            <Input
              type="email"
              placeholder="e.g. sabbir@gmail.com"
              value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)}
              prefix={<Mail className="w-4 h-4" />}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Password *
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={memberPassword}
                onChange={(e) => setMemberPassword(e.target.value)}
                prefix={<Lock className="w-4 h-4" />}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Phone Number
              </label>
              <Input
                type="tel"
                placeholder="017xxxxxxxx"
                value={memberPhone}
                onChange={(e) => setMemberPhone(e.target.value)}
                prefix={<Phone className="w-4 h-4" />}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
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
              disabled={modalLoading}
            >
              {modalLoading ? 'Joining Mess...' : 'Join & Login'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
