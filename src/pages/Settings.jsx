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
  AlertCircle,
  MessageSquare,
  Send,
  Zap,
  Info,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { useMonthContext } from '../context/MonthContext';
import { useAuthContext } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { memberService } from '../services/memberService';
import { authService } from '../services/authService';
import { isFirebaseConfigured } from '../services/firebase';
import { whatsappAutoService, WHATSAPP_PROVIDERS } from '../services/whatsappAutoService';
import { emailAutoService, EMAIL_PROVIDERS } from '../services/emailAutoService';

export const Settings = () => {
  const { currentMonthData, isClosed, toggleMonthStatus } = useMonthContext();
  const { user } = useAuthContext();

  const [appName, setAppName] = useState('MessHishab');
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

  // WhatsApp Automation state
  const [waConfig, setWaConfig] = useState({
    enabled: false,
    provider: WHATSAPP_PROVIDERS.CALLMEBOT,
    apiKey: '',
    instanceId: '',
    token: '',
    webhookUrl: '',
    testPhone: '',
    autoDispatchOnDutyDay: true,
    notifyTime: '07:00',
    sendAdvanceNoticeEveningBefore: false,
  });
  const [isSavingWa, setIsSavingWa] = useState(false);
  const [waSaveSuccess, setWaSaveSuccess] = useState('');
  const [waSaveError, setWaSaveError] = useState('');
  const [testPhone, setTestPhone] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Email Automation state
  const [emailConfig, setEmailConfig] = useState({
    enabled: true,
    provider: EMAIL_PROVIDERS.GMAIL_SMTP,
    senderEmail: 'messhishab@gmail.com',
    senderName: 'MessHishab Manager',
    gmailAppPassword: '',
    resendApiKey: '',
    brevoApiKey: '',
    testEmail: '',
    notifyTime: '07:00',
  });
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [emailSaveSuccess, setEmailSaveSuccess] = useState('');
  const [emailSaveError, setEmailSaveError] = useState('');
  const [testEmailRecipient, setTestEmailRecipient] = useState('');
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState(null);

  const fetchAdmins = async () => {
    try {
      const allMembers = await memberService.getMembers();
      const admins = allMembers.filter(m => m.role === 'admin' || (m.email && m.email.toLowerCase().includes('admin')));
      setAdminsList(admins);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchWaConfig = async () => {
    try {
      const cfg = await whatsappAutoService.getConfig();
      setWaConfig(cfg);
      if (cfg.testPhone) setTestPhone(cfg.testPhone);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchEmailConfig = async () => {
    try {
      const cfg = await emailAutoService.getConfig();
      setEmailConfig(cfg);
      if (cfg.testEmail) setTestEmailRecipient(cfg.testEmail);
      else if (user?.email) setTestEmailRecipient(user.email);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAdmins();
    fetchWaConfig();
    fetchEmailConfig();
  }, []);

  const handleSaveWaConfig = async (e) => {
    e.preventDefault();
    setIsSavingWa(true);
    setWaSaveSuccess('');
    setWaSaveError('');
    try {
      const res = await whatsappAutoService.saveConfig({
        ...waConfig,
        testPhone,
      });
      if (res.success) {
        setWaSaveSuccess('WhatsApp Automation settings updated and saved successfully!');
        setTimeout(() => setWaSaveSuccess(''), 4000);
      } else {
        setWaSaveError(res.error || 'Failed to save settings.');
      }
    } catch (err) {
      setWaSaveError(err.message);
    } finally {
      setIsSavingWa(false);
    }
  };

  const handleSendTestMessage = async () => {
    if (!testPhone.trim()) {
      setTestResult({ success: false, message: 'Please enter a test phone number with WhatsApp.' });
      return;
    }
    setIsSendingTest(true);
    setTestResult(null);
    try {
      const res = await whatsappAutoService.sendTestMessage(testPhone, {
        ...waConfig,
        testPhone,
      });
      if (res.success) {
        setTestResult({
          success: true,
          message: '✓ Test WhatsApp alert dispatched successfully! Please check the recipient phone.',
        });
      } else {
        setTestResult({
          success: false,
          message: `Dispatch failed: ${res.error || 'Unknown error. Check provider credentials.'}`,
        });
      }
    } catch (err) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleSaveEmailConfig = async (e) => {
    e.preventDefault();
    setIsSavingEmail(true);
    setEmailSaveSuccess('');
    setEmailSaveError('');
    try {
      const res = await emailAutoService.saveConfig({
        ...emailConfig,
        testEmail: testEmailRecipient,
      });
      if (res.success) {
        setEmailSaveSuccess('Automated Email settings updated and saved successfully!');
        setTimeout(() => setEmailSaveSuccess(''), 4000);
      } else {
        setEmailSaveError(res.error || 'Failed to save email settings.');
      }
    } catch (err) {
      setEmailSaveError(err.message);
    } finally {
      setIsSavingEmail(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmailRecipient.trim() || !testEmailRecipient.includes('@')) {
      setTestEmailResult({ success: false, message: 'Please enter a valid recipient email address.' });
      return;
    }
    setIsSendingTestEmail(true);
    setTestEmailResult(null);
    try {
      const res = await emailAutoService.sendTestEmail(testEmailRecipient, {
        ...emailConfig,
        testEmail: testEmailRecipient,
      });
      if (res.success) {
        setTestEmailResult({
          success: true,
          message: `✓ Test alert email sent successfully to ${testEmailRecipient}! Please check your inbox or spam folder.`,
        });
      } else {
        setTestEmailResult({
          success: false,
          message: `Dispatch failed: ${res.error || 'Check email configuration and credentials.'}`,
        });
      }
    } catch (err) {
      setTestEmailResult({ success: false, message: err.message });
    } finally {
      setIsSendingTestEmail(false);
    }
  };

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
                  <div className="text-[11px] text-slate-500">admin@messhishab.com</div>
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

      {/* Automated Email & Gmail Alerts Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Automated Email & Gmail Alerts (স্বয়ংক্রিয় ইমেইল নোটিফিকেশন)
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  emailConfig.enabled
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {emailConfig.enabled ? '● Active (100% Free)' : '○ Disabled'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Automatically deliver daily bazar duty notifications to members' Gmail inboxes at 7:00 AM (100% Free & Autonomous)
              </p>
            </div>
          </div>
        </div>

        {emailSaveSuccess && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{emailSaveSuccess}</span>
          </div>
        )}

        {emailSaveError && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{emailSaveError}</span>
          </div>
        )}

        <form onSubmit={handleSaveEmailConfig} className="mt-5 space-y-5">
          {/* Main Activation Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div>
              <label className="text-xs font-bold text-slate-900 block cursor-pointer">
                Enable Daily Automatic Email Alerts (স্বয়ংক্রিয় ইমেইল অ্যালার্ট চালু করুন)
              </label>
              <p className="text-[11px] text-slate-500 mt-0.5">
                The 24/7 cloud runner sends an email notice to the duty member's Gmail every morning.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={emailConfig.enabled}
                onChange={(e) => setEmailConfig({ ...emailConfig, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Email Provider Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Email Dispatcher Provider (ইমেইল সার্ভিস গেটওয়ে)
            </label>
            <select
              value={emailConfig.provider}
              onChange={(e) => setEmailConfig({ ...emailConfig, provider: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
            >
              <option value={EMAIL_PROVIDERS.GMAIL_SMTP}>Gmail SMTP (Free via Google App Password - 500 emails/day)</option>
              <option value={EMAIL_PROVIDERS.RESEND}>Resend API (100% Free - 3,000 emails/month)</option>
              <option value={EMAIL_PROVIDERS.BREVO}>Brevo API (100% Free - 300 emails/day)</option>
              <option value={EMAIL_PROVIDERS.SIMULATION}>Simulation Mode (Log test alerts without sending)</option>
            </select>
          </div>

          {/* Gmail SMTP Fields */}
          {emailConfig.provider === EMAIL_PROVIDERS.GMAIL_SMTP && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Sender Gmail Address"
                  placeholder="e.g. yourmess@gmail.com"
                  value={emailConfig.senderEmail}
                  onChange={(e) => setEmailConfig({ ...emailConfig, senderEmail: e.target.value })}
                  prefix={<Mail className="w-4 h-4 text-slate-400" />}
                />
                <Input
                  label="Sender Display Name"
                  placeholder="e.g. MessHishab Manager"
                  value={emailConfig.senderName}
                  onChange={(e) => setEmailConfig({ ...emailConfig, senderName: e.target.value })}
                  prefix={<User className="w-4 h-4 text-slate-400" />}
                />
              </div>

              <Input
                label="Google App Password (16 letters)"
                type="password"
                placeholder="abcd efgh ijkl mnop"
                value={emailConfig.gmailAppPassword}
                onChange={(e) => setEmailConfig({ ...emailConfig, gmailAppPassword: e.target.value })}
                helperText="Use a Google App Password (not your regular Gmail login password)"
                prefix={<KeyRound className="w-4 h-4 text-slate-400" />}
              />

              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-blue-950 space-y-2">
                <p className="font-bold flex items-center gap-1.5 text-blue-900">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  How to generate your free Google App Password in 1 minute:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-blue-800">
                  <li>Go to your Google Security settings: <strong>myaccount.google.com/security</strong></li>
                  <li>Ensure <strong>2-Step Verification</strong> is enabled.</li>
                  <li>Go to <strong>myaccount.google.com/apppasswords</strong></li>
                  <li>Enter App Name: <strong>MessHishab</strong> and click <strong>Create</strong>.</li>
                  <li>Google will give you a 16-letter password (e.g. <code>abcd efgh ijkl mnop</code>). Paste it into the box above and save!</li>
                </ol>
              </div>
            </div>
          )}

          {/* Resend Fields */}
          {emailConfig.provider === EMAIL_PROVIDERS.RESEND && (
            <Input
              label="Resend API Key"
              placeholder="re_123456789..."
              value={emailConfig.resendApiKey}
              onChange={(e) => setEmailConfig({ ...emailConfig, resendApiKey: e.target.value })}
              helperText="Free 3,000 emails/month from resend.com"
              prefix={<KeyRound className="w-4 h-4 text-slate-400" />}
            />
          )}

          {/* Brevo Fields */}
          {emailConfig.provider === EMAIL_PROVIDERS.BREVO && (
            <Input
              label="Brevo (Sendinblue) API Key"
              placeholder="xkeysib-..."
              value={emailConfig.brevoApiKey}
              onChange={(e) => setEmailConfig({ ...emailConfig, brevoApiKey: e.target.value })}
              helperText="Free 300 emails/day from brevo.com"
              prefix={<KeyRound className="w-4 h-4 text-slate-400" />}
            />
          )}

          {/* Timing Section */}
          <div className="pt-2 border-t border-slate-100 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="text-xs font-bold text-slate-800 block">
                  Daily Automatic Email Dispatch Time:
                </label>
                <p className="text-[11px] text-slate-500">
                  The cloud runner dispatches duty emails at this time every morning.
                </p>
              </div>
              <input
                type="time"
                value={emailConfig.notifyTime || '07:00'}
                onChange={(e) => setEmailConfig({ ...emailConfig, notifyTime: e.target.value })}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              loading={isSavingEmail}
              icon={CheckCircle2}
            >
              Save Email Automation Settings
            </Button>
          </div>
        </form>

        {/* Live Test Email Connection Box */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Send className="w-3.5 h-3.5 text-blue-600" />
            Test Email Alert Connection (টেস্ট ইমেইল পাঠান)
          </h4>
          <p className="text-xs text-slate-500 mb-3">
            Send a sample bazar duty email to your personal inbox right now to verify the look and feel.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="w-full sm:flex-1">
              <Input
                placeholder="Enter recipient email (e.g. you@gmail.com)"
                type="email"
                value={testEmailRecipient}
                onChange={(e) => setTestEmailRecipient(e.target.value)}
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              loading={isSendingTestEmail}
              onClick={handleSendTestEmail}
              icon={Send}
              className="w-full sm:w-auto"
            >
              Send Test Email
            </Button>
          </div>

          {testEmailResult && (
            <div
              className={`mt-3 p-3 rounded-xl text-xs flex items-center gap-2 ${
                testEmailResult.success
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-700'
              }`}
            >
              {testEmailResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{testEmailResult.message}</span>
            </div>
          )}
        </div>
      </div>

      {/* WhatsApp Automation Gateway Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <MessageSquare className="w-5 h-5 text-[#25D366]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  WhatsApp Automation Gateway (হোয়াটসঅ্যাপ স্বয়ংক্রিয় নোটিফিকেশন)
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  waConfig.enabled
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {waConfig.enabled ? '● Active' : '○ Disabled'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Automatically send bazar duty notices to members' WhatsApp numbers without manual typing
              </p>
            </div>
          </div>
        </div>

        {waSaveSuccess && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{waSaveSuccess}</span>
          </div>
        )}

        {waSaveError && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{waSaveError}</span>
          </div>
        )}

        <form onSubmit={handleSaveWaConfig} className="mt-5 space-y-5">
          {/* Main Activation Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div>
              <label className="text-xs font-bold text-slate-900 block cursor-pointer">
                Enable Automatic WhatsApp Alerts (স্বয়ংক্রিয় অ্যালার্ট চালু করুন)
              </label>
              <p className="text-[11px] text-slate-500 mt-0.5">
                When enabled, the system automatically dispatches bazar duty notices on the duty date.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={waConfig.enabled}
                onChange={(e) => setWaConfig({ ...waConfig, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#25D366]"></div>
            </label>
          </div>

          {/* Provider Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              WhatsApp Gateway Provider (গেটওয়ে সার্ভিস)
            </label>
            <select
              value={waConfig.provider}
              onChange={(e) => setWaConfig({ ...waConfig, provider: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
            >
              <option value={WHATSAPP_PROVIDERS.CALLMEBOT}>CallMeBot (Free WhatsApp Bot - Recommended for Personal & Mess)</option>
              <option value={WHATSAPP_PROVIDERS.ULTRAMSG}>UltraMsg (API Gateway)</option>
              <option value={WHATSAPP_PROVIDERS.GREENAPI}>Green API (Cloud Gateway)</option>
              <option value={WHATSAPP_PROVIDERS.CUSTOM_WEBHOOK}>Custom Webhook (Zapier / Make / n8n / Custom Node Server)</option>
              <option value={WHATSAPP_PROVIDERS.SIMULATION}>Simulation Mode (Test & log messages without gateway)</option>
            </select>
          </div>

          {/* Dynamic Provider Fields */}
          {waConfig.provider === WHATSAPP_PROVIDERS.CALLMEBOT && (
            <div className="space-y-4">
              <Input
                label="CallMeBot API Key"
                placeholder="e.g. 123456"
                value={waConfig.apiKey}
                onChange={(e) => setWaConfig({ ...waConfig, apiKey: e.target.value })}
                helperText="Enter your free CallMeBot API Key"
                prefix={<KeyRound className="w-4 h-4 text-slate-400" />}
              />

              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100 text-xs text-emerald-950 space-y-2">
                <p className="font-bold flex items-center gap-1.5 text-emerald-900">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  How to get your free CallMeBot API Key in 30 seconds:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-emerald-800">
                  <li>Active CallMeBot WhatsApp number: <strong>+34 623 78 95 95</strong></li>
                  <li>Send this exact WhatsApp message: <code>I allow callmebot to send me messages</code></li>
                  <li>CallMeBot will immediately reply with your free personal <strong>API Key</strong>.</li>
                  <li>Paste that API Key into the field above and click <strong>Save Settings</strong>.</li>
                </ol>
                <div className="pt-1">
                  <a
                    href="https://wa.me/34623789595?text=I%20allow%20callmebot%20to%20send%20me%20messages"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#25D366] text-slate-950 hover:bg-[#20ba5a] transition-all"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Click here to open WhatsApp with +34 623 78 95 95</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {waConfig.provider === WHATSAPP_PROVIDERS.ULTRAMSG && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="UltraMsg Instance ID"
                placeholder="e.g. instance12345"
                value={waConfig.instanceId}
                onChange={(e) => setWaConfig({ ...waConfig, instanceId: e.target.value })}
              />
              <Input
                label="UltraMsg Token"
                type="password"
                placeholder="e.g. abc123def456"
                value={waConfig.token}
                onChange={(e) => setWaConfig({ ...waConfig, token: e.target.value })}
              />
            </div>
          )}

          {waConfig.provider === WHATSAPP_PROVIDERS.GREENAPI && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Green API IdInstance"
                placeholder="e.g. 1101823456"
                value={waConfig.instanceId}
                onChange={(e) => setWaConfig({ ...waConfig, instanceId: e.target.value })}
              />
              <Input
                label="Green API ApiTokenInstance"
                type="password"
                placeholder="e.g. d123...456"
                value={waConfig.token}
                onChange={(e) => setWaConfig({ ...waConfig, token: e.target.value })}
              />
            </div>
          )}

          {waConfig.provider === WHATSAPP_PROVIDERS.CUSTOM_WEBHOOK && (
            <Input
              label="Custom Webhook URL"
              placeholder="https://your-n8n-or-server.com/api/send-whatsapp"
              value={waConfig.webhookUrl}
              onChange={(e) => setWaConfig({ ...waConfig, webhookUrl: e.target.value })}
              helperText="Receives POST requests with { phone, message, timestamp }"
            />
          )}

          {/* Automation Schedule Options */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Notification Timing & Preferences (অ্যালার্টের সময়সূচী)
            </h4>

            {/* Daily Alert Time Picker */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-800 block">
                    Daily Automatic Alert Time (প্রতিদিন অ্যালার্ট পাঠানোর সময়):
                  </label>
                  <p className="text-[11px] text-slate-500">
                    The system runs 24/7 on GitHub Cloud and auto-sends the WhatsApp notice at this time every morning for free.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={waConfig.notifyTime || '07:00'}
                    onChange={(e) => setWaConfig({ ...waConfig, notifyTime: e.target.value })}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Presets:</span>
                {['06:30', '07:00', '07:30', '08:00', '21:00'].map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setWaConfig({ ...waConfig, notifyTime: time })}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                      waConfig.notifyTime === time
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {time === '21:00' ? '9:00 PM (Night)' : `${time} AM`}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={waConfig.autoDispatchOnDutyDay}
                  onChange={(e) => setWaConfig({ ...waConfig, autoDispatchOnDutyDay: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 mt-0.5"
                />
                <span className="text-xs text-slate-700">
                  <strong>Send alert on duty morning:</strong> Automatically dispatches alert on the day of market duty.
                </span>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={waConfig.sendAdvanceNoticeEveningBefore}
                  onChange={(e) => setWaConfig({ ...waConfig, sendAdvanceNoticeEveningBefore: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 mt-0.5"
                />
                <span className="text-xs text-slate-700">
                  <strong>Send advance notice:</strong> Also alert member the evening before their duty day.
                </span>
              </label>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              loading={isSavingWa}
              icon={CheckCircle2}
            >
              Save WhatsApp Automation Settings
            </Button>
          </div>
        </form>

        {/* Live Test Connection Box */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Send className="w-3.5 h-3.5 text-emerald-600" />
            Test WhatsApp Alert Connection (টেস্ট মেসেজ পাঠান)
          </h4>
          <p className="text-xs text-slate-500 mb-3">
            Verify your gateway setup by sending a live test WhatsApp alert to your personal phone number.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="w-full sm:flex-1">
              <Input
                placeholder="Enter recipient WhatsApp number (e.g. 017XXXXXXXX)"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              loading={isSendingTest}
              onClick={handleSendTestMessage}
              icon={Send}
              className="w-full sm:w-auto"
            >
              Send Test Alert
            </Button>
          </div>

          {testResult && (
            <div
              className={`mt-3 p-3 rounded-xl text-xs flex items-center gap-2 ${
                testResult.success
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-700'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}
        </div>
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
            <span className="font-medium text-slate-800">{user?.email || 'admin@messhishab.com'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

