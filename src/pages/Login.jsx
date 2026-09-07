import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UtensilsCrossed, Lock, Mail, ArrowRight, UserCheck, ShieldCheck, Sparkles, User } from 'lucide-react';
import { useAuthContext } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { isFirebaseConfigured } from '../services/firebase';

export const Login = () => {
  const { login } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState('admin'); // 'admin' or 'member'
  const [email, setEmail] = useState('admin@mealmanager.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const from = location.state?.from?.pathname;

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError(null);
    if (tab === 'admin') {
      setEmail('admin@mealmanager.com');
      setPassword('admin123');
    } else {
      setEmail('rahim@example.com');
      setPassword('member123');
    }
  };

  const selectQuickMember = (memberEmail) => {
    setActiveTab('member');
    setEmail(memberEmail);
    setPassword('member123');
    setError(null);
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
        setError(result.error || 'Failed to sign in. Please verify credentials.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-xl shadow-emerald-500/20 mb-4">
          <UtensilsCrossed className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          Meal Management System
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Sign in as a Manager or Mess Member to access your accounts.
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-3xl sm:px-10 border border-slate-100">
          {/* Role Selection Tabs */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => handleTabChange('admin')}
              className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'admin'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Admin Portal
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('member')}
              className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'member'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4 text-emerald-600" />
              Member Portal
            </button>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
              <Lock className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Demo Credentials Badges */}
          <div className="mb-5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-600">Quick Test Accounts:</span>
              <span className="text-[10px] text-emerald-600 font-bold">1-Click Sign-in</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => { handleTabChange('admin'); setEmail('admin@mealmanager.com'); setPassword('admin123'); }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  activeTab === 'admin' ? 'bg-slate-900 text-white' : 'bg-white border text-slate-700 hover:bg-slate-100'
                }`}
              >
                👑 Admin
              </button>
              <button
                type="button"
                onClick={() => selectQuickMember('rahim@example.com')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  activeTab === 'member' && email === 'rahim@example.com' ? 'bg-emerald-600 text-white' : 'bg-white border text-slate-700 hover:bg-slate-100'
                }`}
              >
                👤 Rahim
              </button>
              <button
                type="button"
                onClick={() => selectQuickMember('karim@example.com')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  activeTab === 'member' && email === 'karim@example.com' ? 'bg-emerald-600 text-white' : 'bg-white border text-slate-700 hover:bg-slate-100'
                }`}
              >
                👤 Karim
              </button>
              <button
                type="button"
                onClick={() => selectQuickMember('hasan@example.com')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  activeTab === 'member' && email === 'hasan@example.com' ? 'bg-emerald-600 text-white' : 'bg-white border text-slate-700 hover:bg-slate-100'
                }`}
              >
                👤 Hasan
              </button>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              label={activeTab === 'admin' ? 'Admin Email Address' : 'Member Email Address'}
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. rahim@example.com"
              prefix={<Mail className="w-4 h-4" />}
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
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full mt-2 font-semibold"
            >
              Sign In as {activeTab === 'admin' ? 'Admin' : 'Member'} <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Bangladeshi Taka (৳) Group Dining & Expense Management
        </p>
      </div>
    </div>
  );
};
