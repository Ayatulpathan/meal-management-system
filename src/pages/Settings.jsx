import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Database, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  ShieldCheck, 
  UserPlus,
  KeyRound,
  Mail,
  User,
  Shield,
  AlertCircle
} from 'lucide-react';
import { useMonthContext } from '../context/MonthContext';
import { useAuthContext } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { memberService } from '../services/memberService';
import { authService } from '../services/authService';
import { isFirebaseConfigured } from '../services/firebase';

export const Settings = () => {
  const { currentMonthData, isClosed, toggleMonthStatus } = useMonthContext();
  const { user } = useAuthContext();

  const [appName, setAppName] = useState('Meal Management System');
  const [currency, setCurrency] = useState('BDT (৳)');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Admin creation state
  const [adminsList, setAdminsList] = useState([]);
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminError, setAdminError] = useState('');
  const [adminSuccess, setAdminSuccess] = useState('');
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);

  const fetchAdmins = async () => {
    try {
      const allMembers = await memberService.getMembers();
      const admins = allMembers.filter(m => m.role === 'admin' || (m.email && m.email.toLowerCase().includes('admin')));
      setAdminsList(admins);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setAdminError('');
    setAdminSuccess('');

    if (!adminName.trim() || !adminEmail.trim() || !adminPassword.trim()) {
      setAdminError('Please provide Admin Name, Email, and Password.');
      return;
    }

    if (adminPassword.length < 6) {
      setAdminError('Password must be at least 6 characters.');
      return;
    }

    setIsCreatingAdmin(true);
    try {
      const res = await authService.createAccount(
        adminName,
        adminEmail,
        adminPassword,
        'admin',
        adminPhone
      );

      if (res.error) {
        setAdminError(res.error);
      } else {
        setAdminSuccess(`Administrator "${adminName}" created successfully! They can now log in using ${adminEmail}.`);
        setAdminName('');
        setAdminEmail('');
        setAdminPassword('');
        setAdminPhone('');
        fetchAdmins();
      }
    } catch (err) {
      setAdminError('Failed to create admin account: ' + err.message);
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  const isConfigured = isFirebaseConfigured();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          System Settings & Administration
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Application configuration, monthly status, database details, and admin accounts
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Settings saved successfully.</span>
        </div>
      )}

      {/* Admin Management Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Administrator Accounts & Access Control
            </h3>
            <p className="text-xs text-slate-500">
              Create and manage manager accounts who have full permission over meals, costs, and deposits.
            </p>
          </div>
        </div>

        {/* Instructions Box */}
        <div className="mt-4 p-4 rounded-xl bg-purple-50/60 border border-purple-100 text-xs text-purple-900 space-y-2">
          <p className="font-bold flex items-center gap-1.5 text-purple-950">
            <Shield className="w-4 h-4 text-purple-700" />
            How to Add a New Admin:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-purple-800">
            <li>Fill out the <strong>"Create New Administrator"</strong> form below with their Name, Email, and Password.</li>
            <li>Alternatively, navigate to <strong>Members &gt; Add New Member</strong> and select <strong>Account Role: Administrator / Manager</strong>.</li>
            <li>The newly added admin can immediately log in from the login page with their credentials.</li>
          </ol>
        </div>

        {/* Add Admin Form */}
        <form onSubmit={handleCreateAdmin} className="mt-6 space-y-4">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Create New Administrator
          </h4>

          {adminError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{adminError}</span>
            </div>
          )}

          {adminSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{adminSuccess}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Admin Full Name"
              placeholder="e.g. Tanvir Hassan"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              prefix={<User className="w-4 h-4 text-slate-400" />}
              required
            />
            <Input
              label="Admin Email Address (Login ID)"
              type="email"
              placeholder="e.g. tanvir.admin@example.com"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              prefix={<Mail className="w-4 h-4 text-slate-400" />}
              required
            />
            <Input
              label="Admin Password"
              type="password"
              placeholder="At least 6 characters"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              prefix={<KeyRound className="w-4 h-4 text-slate-400" />}
              required
            />
            <Input
              label="Phone Number (Optional)"
              placeholder="e.g. 018XXXXXXXX"
              value={adminPhone}
              onChange={(e) => setAdminPhone(e.target.value)}
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              loading={isCreatingAdmin}
              icon={UserPlus}
            >
              Add New Administrator
            </Button>
          </div>
        </form>

        {/* Existing Admins List */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            Current Administrators
          </h4>
          <div className="space-y-2">
            {/* Default Master Admin */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                  A
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-900">Administrator (Default)</div>
                  <div className="text-[11px] text-slate-500">admin@mealmanager.com</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                Master Admin
              </span>
            </div>

            {adminsList.map((admin) => (
              <div key={admin.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    {admin.name?.charAt(0).toUpperCase() || 'A'}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900">{admin.name}</div>
                    <div className="text-[11px] text-slate-500">{admin.email}</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                  Manager / Admin
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Month Closing Management Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isClosed ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
              {isClosed ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Monthly Accounting Lock: {currentMonthData?.monthName}
              </h3>
              <p className="text-xs text-slate-500">
                Current Status: <strong>{isClosed ? 'Closed (Read-Only)' : 'Open for Editing'}</strong>
              </p>
            </div>
          </div>

          <Button
            variant={isClosed ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => toggleMonthStatus()}
            icon={isClosed ? Unlock : Lock}
          >
            {isClosed ? 'Reopen Month' : 'Close Month'}
          </Button>
        </div>

        <p className="text-xs text-slate-600 mt-4 leading-relaxed">
          Closing a month locks all daily meal entries, grocery costs, and deposit transactions from accidental modifications. The generated financial report remains permanently accessible.
        </p>
      </div>

      {/* General Settings Form */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-emerald-600" />
          General Preferences
        </h3>

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <Input
            label="Organization / Mess Name"
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
            required
          />

          <Input
            label="Primary Currency"
            value={currency}
            disabled
            helperText="Default system currency is locked to Bangladeshi Taka (৳)"
          />

          <div className="flex items-center justify-end pt-3 border-t border-slate-100">
            <Button type="submit" variant="primary">
              Save Preferences
            </Button>
          </div>
        </form>
      </div>

      {/* Architecture & Database Status */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-emerald-600" />
          Database & Cloud Infrastructure
        </h3>

        <div className="space-y-3 text-xs text-slate-600">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
            <span className="font-semibold text-slate-700">Firebase Firestore Connection:</span>
            <span className={`font-bold px-2.5 py-0.5 rounded-full ${isConfigured ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
              {isConfigured ? 'Connected to Cloud Firestore' : 'Running in Local Storage Sync Mode'}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
            <span className="font-semibold text-slate-700">Architecture Pattern:</span>
            <span className="font-medium text-slate-800">MVC (Model-View-Controller + Services)</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
            <span className="font-semibold text-slate-700">Logged in Admin:</span>
            <span className="font-medium text-slate-800">{user?.email || 'admin@mealmanager.com'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

