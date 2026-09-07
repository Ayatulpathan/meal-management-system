import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Database, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  ShieldCheck, 
  Layers,
  Sparkles
} from 'lucide-react';
import { useMonthContext } from '../context/MonthContext';
import { useAuthContext } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { CURRENCY_SYMBOL } from '../utils/currencyUtils';
import { isFirebaseConfigured } from '../services/firebase';

export const Settings = () => {
  const { currentMonthData, isClosed, toggleMonthStatus } = useMonthContext();
  const { user } = useAuthContext();

  const [appName, setAppName] = useState('Meal Management System');
  const [currency, setCurrency] = useState('BDT (৳)');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const isConfigured = isFirebaseConfigured();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          System Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Application configuration, monthly status, and database details
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Settings saved successfully.</span>
        </div>
      )}

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
