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
  Zap,
  Building2,
  MessageSquare,
  FileSpreadsheet
} from 'lucide-react';
import { useAuthContext } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';

export const Login = () => {
  const { login } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState('admin'); // 'admin' or 'member'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const from = location.state?.from?.pathname;

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError(null);
    setEmail('');
    setPassword('');
  };

  const handleQuickDemo = (role) => {
    if (role === 'admin') {
      setActiveTab('admin');
      setEmail('admin@mealmanager.com');
      setPassword('admin123');
    } else {
      setActiveTab('member');
      setEmail('member@mealmanager.com');
      setPassword('member123');
    }
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
          MealManager
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
              placeholder={activeTab === 'admin' ? 'admin@mealmanager.com' : 'member@mealmanager.com'}
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

          {/* Quick Demo Fill Buttons */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Quick 1-Click Demo Fill
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('admin')}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-all flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Demo Admin</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('member')}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-all flex items-center justify-center gap-1.5"
              >
                <User className="w-3.5 h-3.5 text-emerald-600" />
                <span>Demo Member</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center space-y-1">
          <p className="text-xs text-slate-400">
            Bangladeshi Taka (৳) Group Dining & Expense Management
          </p>
          <p className="text-[11px] text-slate-500 font-medium">
            © {new Date().getFullYear()} Ayatul Khan Pathan. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};
