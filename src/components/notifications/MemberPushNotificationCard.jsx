import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  BellOff,
  Smartphone,
  Laptop,
  CheckCircle2,
  AlertCircle,
  Vibrate,
  Trash2,
  RefreshCw,
  Info,
  ShieldCheck
} from 'lucide-react';
import {
  fcmNotificationService,
  isPushSupported,
  getNotificationPermission,
  detectPlatform,
  PUSH_PLATFORMS
} from '../../services/fcmNotificationService';
import { useAuthContext } from '../../context/AuthContext';
import { useMessContext } from '../../context/MessContext';

export const MemberPushNotificationCard = () => {
  const { user, currentMemberId } = useAuthContext();
  const { currentMessId } = useMessContext();

  const [supported, setSupported] = useState(true);
  const [permission, setPermission] = useState('default');
  const [platform, setPlatform] = useState(PUSH_PLATFORMS.OTHER);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ text: '', type: '' });
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    const isSupp = isPushSupported();
    setSupported(isSupp);
    if (!isSupp) return;

    setPermission(getNotificationPermission());
    setPlatform(detectPlatform());

    const savedToken = localStorage.getItem('mms_fcm_token');
    if (savedToken && Notification.permission === 'granted') {
      setIsRegistered(true);
    }
  }, []);

  const handleEnableNotifications = async () => {
    setLoading(true);
    setStatusMessage({ text: '', type: '' });

    try {
      const res = await fcmNotificationService.requestPermissionAndRegister({
        memberUid: currentMemberId || user?.uid,
        memberName: user?.displayName || '',
        memberEmail: user?.email || '',
        messId: currentMessId
      });

      setPermission(getNotificationPermission());

      if (res.success) {
        setIsRegistered(true);
        setStatusMessage({
          text: '✓ Notifications successfully enabled on this device! You will automatically receive alerts when assigned Bazar Duty.',
          type: 'success'
        });
      } else {
        setStatusMessage({
          text: res.error || 'Failed to enable notifications. Please check your browser settings.',
          type: 'error'
        });
      }
    } catch (err) {
      setStatusMessage({
        text: `Error registering device: ${err.message}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestNotification = async () => {
    setTesting(true);
    setStatusMessage({ text: '', type: '' });

    try {
      const res = await fcmNotificationService.sendLocalTestNotification();
      if (res.success) {
        setStatusMessage({
          text: '✓ Test notification sent! Check your notification tray. (Vibration triggered on compatible devices).',
          type: 'success'
        });
      } else {
        setStatusMessage({
          text: res.error || 'Could not show test notification. Ensure browser permissions are granted.',
          type: 'error'
        });
      }
    } catch (err) {
      setStatusMessage({
        text: `Test failed: ${err.message}`,
        type: 'error'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleUnregisterDevice = async () => {
    setLoading(true);
    setStatusMessage({ text: '', type: '' });

    try {
      await fcmNotificationService.unregisterCurrentDevice();
      setIsRegistered(false);
      setStatusMessage({
        text: '✓ This device has been unregistered. You will no longer receive push notifications on this device.',
        type: 'info'
      });
    } catch (err) {
      setStatusMessage({
        text: `Failed to unregister: ${err.message}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!supported) {
    return (
      <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold block text-sm">Push Notifications Unsupported</strong>
          Your current browser does not support Service Worker push notifications. For automatic alerts when the tab is closed, please use Google Chrome or Microsoft Edge on Android or Windows.
        </div>
      </div>
    );
  }

  const getPlatformIcon = () => {
    if (platform === PUSH_PLATFORMS.ANDROID) return <Smartphone className="w-4 h-4 text-emerald-600" />;
    if (platform === PUSH_PLATFORMS.WINDOWS) return <Laptop className="w-4 h-4 text-sky-600" />;
    return <Bell className="w-4 h-4 text-slate-600" />;
  };

  const getPlatformName = () => {
    if (platform === PUSH_PLATFORMS.ANDROID) return 'Android Phone / Tablet';
    if (platform === PUSH_PLATFORMS.WINDOWS) return 'Windows PC / Laptop';
    return 'Web Browser Device';
  };

  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm transition-all hover:border-slate-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl text-white shadow-md shrink-0 ${
            isRegistered ? 'bg-emerald-600 shadow-emerald-600/20' : 'bg-slate-700 shadow-slate-700/20'
          }`}>
            {isRegistered ? <BellRing className="w-5 h-5 animate-pulse" /> : <BellOff className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm">
                Member Push Notifications (বাজার ডিউটি পুশ নোটিফিকেশন)
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                isRegistered
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : permission === 'denied'
                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}>
                {isRegistered ? 'Active on this Device' : permission === 'denied' ? 'Permission Blocked' : 'Not Registered'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Receive automatic alerts on your phone or laptop at the mess reminder time, even when the website is closed.
            </p>
          </div>
        </div>

        {/* Action Button: Enable / Registered Status */}
        <div className="flex items-center gap-2 shrink-0">
          {!isRegistered ? (
            <button
              type="button"
              onClick={handleEnableNotifications}
              disabled={loading || permission === 'denied'}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Bell className="w-3.5 h-3.5" />}
              <span>Enable Notifications on This Device</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSendTestNotification}
                disabled={testing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-all"
                title="Send a sample reminder with vibration test to verify delivery"
              >
                {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Vibrate className="w-3.5 h-3.5 text-emerald-600" />}
                <span>Test Notification</span>
              </button>
              <button
                type="button"
                onClick={handleUnregisterDevice}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all"
                title="Unregister this device"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Device</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Device & Status Details */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 text-xs">
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700">
          {getPlatformIcon()}
          <div>
            <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Current Device</span>
            <span className="font-bold text-slate-800">{getPlatformName()}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <div>
            <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Browser Permission</span>
            <span className="font-bold text-slate-800 capitalize">{permission}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700">
          <Vibrate className="w-4 h-4 text-indigo-600" />
          <div>
            <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Android Vibration</span>
            <span className="font-bold text-slate-800">
              {platform === PUSH_PLATFORMS.ANDROID ? 'Supported (300ms)' : 'Platform Dependent'}
            </span>
          </div>
        </div>
      </div>

      {/* Feedback Alert */}
      {statusMessage.text && (
        <div className={`mt-3 p-3 rounded-xl text-xs flex items-start gap-2 ${
          statusMessage.type === 'success'
            ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
            : statusMessage.type === 'error'
            ? 'bg-rose-50 text-rose-900 border border-rose-200'
            : 'bg-sky-50 text-sky-900 border border-sky-200'
        }`}>
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}
    </div>
  );
};
