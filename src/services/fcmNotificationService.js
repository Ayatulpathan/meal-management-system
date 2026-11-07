/**
 * MessHishab - Firebase Cloud Messaging (FCM) Web Push Notification Service
 * Handles device registration, permission requests, foreground/background messages,
 * multi-device tracking, and token deactivation on logout.
 */

import { getMessaging, getToken, onMessage, isSupported as isMessagingSupported } from 'firebase/messaging';
import {
  app,
  db,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  isFirebaseConfigured,
  serverTimestamp
} from './firebase';
import { DEFAULT_MESS_ID, getActiveMessId } from '../models/messModel';
import { getTodayDateString } from '../utils/dateUtils';

const FCM_TOKEN_STORAGE_KEY = 'mms_fcm_token';
const PUSH_SETTINGS_DOC = 'pushNotification';

export const PUSH_PLATFORMS = {
  ANDROID: 'android',
  WINDOWS: 'windows',
  OTHER: 'other'
};

/**
 * Detect client platform (Android, Windows, or Other)
 */
export const detectPlatform = () => {
  if (typeof navigator === 'undefined') return PUSH_PLATFORMS.OTHER;
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('android')) return PUSH_PLATFORMS.ANDROID;
  if (ua.includes('windows') || ua.includes('win64') || ua.includes('win32')) return PUSH_PLATFORMS.WINDOWS;
  return PUSH_PLATFORMS.OTHER;
};

/**
 * Check if Web Push is supported by browser
 */
export const isPushSupported = () => {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
};

/**
 * Get current browser notification permission
 */
export const getNotificationPermission = () => {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission; // 'default' | 'granted' | 'denied'
};

/**
 * Generate a safe Firestore document ID for an FCM token
 */
const getSafeTokenDocId = (token) => {
  if (!token) return `token_${Date.now()}`;
  // Use a hash-like alphanumeric string from the token
  const clean = token.replace(/[^a-zA-Z0-9]/g, '');
  return `fcm_${clean.slice(0, 24)}_${clean.slice(-16)}`;
};

export const fcmNotificationService = {
  /**
   * Get Push Notification Settings for a mess
   */
  async getConfig(messId = DEFAULT_MESS_ID) {
    const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;
    const defaultConfig = {
      enabled: true,
      notifyTime: '07:00',
      timezone: 'Asia/Dhaka',
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || '',
      fcmServerKey: '',
      lastUpdated: null
    };

    if (!isFirebaseConfigured()) return defaultConfig;

    try {
      const snap = await getDoc(doc(db, 'messes', targetMessId, 'settings', PUSH_SETTINGS_DOC));
      if (snap.exists()) {
        return { ...defaultConfig, ...snap.data() };
      }
      if (targetMessId === DEFAULT_MESS_ID) {
        const rootSnap = await getDoc(doc(db, 'settings', PUSH_SETTINGS_DOC));
        if (rootSnap.exists()) {
          return { ...defaultConfig, ...rootSnap.data() };
        }
      }
    } catch (err) {
      console.warn('Could not read push notification settings from Firestore:', err);
    }

    return defaultConfig;
  },

  /**
   * Save Push Notification Settings for a mess
   */
  async saveConfig(messId = DEFAULT_MESS_ID, newConfig = {}) {
    const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;
    const payload = {
      ...newConfig,
      lastUpdated: new Date().toISOString()
    };

    if (!isFirebaseConfigured()) return { success: true };

    try {
      await setDoc(doc(db, 'messes', targetMessId, 'settings', PUSH_SETTINGS_DOC), payload, { merge: true });
      if (targetMessId === DEFAULT_MESS_ID) {
        await setDoc(doc(db, 'settings', PUSH_SETTINGS_DOC), payload, { merge: true }).catch(() => {});
      }
      return { success: true };
    } catch (err) {
      console.error('Failed to save push notification config:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Request Notification permission and register FCM device token
   */
  async requestPermissionAndRegister({ memberUid, memberName = '', memberEmail = '', messId = DEFAULT_MESS_ID, customVapidKey = '' }) {
    if (!isPushSupported()) {
      return { success: false, error: 'Push notifications are not supported by this browser.' };
    }

    if (!memberUid) {
      return { success: false, error: 'User must be authenticated before registering a device.' };
    }

    // 1. Request Browser Permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return {
        success: false,
        permission,
        error: permission === 'denied'
          ? 'Notification permission was denied. Please allow notifications in your browser site settings.'
          : 'Notification permission was dismissed.'
      };
    }

    // 2. Ensure Service Worker is registered
    let swRegistration;
    try {
      swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
      await navigator.serviceWorker.ready;
    } catch (swErr) {
      console.error('Service worker registration failed:', swErr);
      return { success: false, error: `Service worker error: ${swErr.message}` };
    }

    // 3. Obtain FCM Token
    let messagingInstance;
    try {
      const supported = await isMessagingSupported();
      if (!supported) {
        return { success: false, error: 'Firebase Cloud Messaging is not supported in this browser environment.' };
      }
      messagingInstance = getMessaging(app);
    } catch (msgErr) {
      return { success: false, error: `Messaging init error: ${msgErr.message}` };
    }

    // Determine VAPID Key
    const cfg = await this.getConfig(messId);
    const effectiveVapidKey = customVapidKey || cfg.vapidKey || import.meta.env.VITE_FIREBASE_VAPID_KEY;

    let token = null;
    try {
      const tokenOptions = {
        serviceWorkerRegistration: swRegistration
      };
      if (effectiveVapidKey && effectiveVapidKey.trim()) {
        tokenOptions.vapidKey = effectiveVapidKey.trim();
      }

      token = await getToken(messagingInstance, tokenOptions);
      if (!token) {
        return {
          success: false,
          error: 'No registration token available. Ensure Web Push certificate (VAPID key) is configured.'
        };
      }
    } catch (tokenErr) {
      console.error('Failed to retrieve FCM token:', tokenErr);
      return {
        success: false,
        error: tokenErr.message?.includes('vapid') || tokenErr.message?.includes('applicationServerKey')
          ? 'Invalid or missing VAPID Key. Please verify the Web Push certificate in Settings.'
          : `FCM Token Error: ${tokenErr.message}`
      };
    }

    // 4. Save Token into Firestore deviceTokens collection
    const platform = detectPlatform();
    const tokenDocId = getSafeTokenDocId(token);

    const tokenData = {
      token,
      memberUid,
      memberId: memberUid,
      memberName: memberName || '',
      memberEmail: memberEmail || '',
      messId: messId || DEFAULT_MESS_ID,
      platform,
      userAgent: navigator.userAgent.slice(0, 150),
      active: true,
      lastUpdatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    try {
      if (isFirebaseConfigured()) {
        await setDoc(doc(db, 'deviceTokens', tokenDocId), tokenData, { merge: true });
      }
      localStorage.setItem(FCM_TOKEN_STORAGE_KEY, token);
      localStorage.setItem('mms_fcm_token_id', tokenDocId);

      return {
        success: true,
        token,
        tokenDocId,
        platform,
        permission: 'granted'
      };
    } catch (dbErr) {
      console.error('Failed to record device token in Firestore:', dbErr);
      return { success: false, error: `Database error saving token: ${dbErr.message}` };
    }
  },

  /**
   * Unregister / Deactivate current device token (e.g., on logout or member toggle off)
   */
  async unregisterCurrentDevice() {
    const currentToken = localStorage.getItem(FCM_TOKEN_STORAGE_KEY);
    const tokenDocId = localStorage.getItem('mms_fcm_token_id') || (currentToken ? getSafeTokenDocId(currentToken) : null);

    if (tokenDocId && isFirebaseConfigured()) {
      try {
        await updateDoc(doc(db, 'deviceTokens', tokenDocId), {
          active: false,
          deactivatedAt: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Could not deactivate token document:', err.message);
      }
    }

    localStorage.removeItem(FCM_TOKEN_STORAGE_KEY);
    localStorage.removeItem('mms_fcm_token_id');
    return { success: true };
  },

  /**
   * Get active device tokens for a member
   */
  async getMemberActiveTokens(memberUid) {
    if (!memberUid || !isFirebaseConfigured()) return [];

    try {
      const q = query(
        collection(db, 'deviceTokens'),
        where('memberUid', '==', memberUid),
        where('active', '==', true)
      );
      const snapshot = await getDocs(q);
      const tokens = [];
      snapshot.forEach((docSnap) => {
        tokens.push({ id: docSnap.id, ...docSnap.data() });
      });
      return tokens;
    } catch (err) {
      console.warn('Failed to query device tokens for member:', err);
      return [];
    }
  },

  /**
   * Listen to foreground push messages while web app is actively in focus
   */
  listenForeground(callback) {
    if (!isPushSupported()) return () => {};

    let unsubscribe = () => {};
    isMessagingSupported().then((supported) => {
      if (supported) {
        try {
          const messagingInstance = getMessaging(app);
          unsubscribe = onMessage(messagingInstance, (payload) => {
            console.log('[Foreground Message]', payload);
            if (callback) callback(payload);
          });
        } catch (e) {
          console.warn('Foreground message listener error:', e);
        }
      }
    });

    return () => unsubscribe();
  },

  /**
   * Trigger a test notification on this device (Tests vibration & visual display)
   */
  async sendLocalTestNotification() {
    if (!isPushSupported()) {
      return { success: false, error: 'Notifications not supported' };
    }

    const perm = await Notification.requestPermission();
    if (perm !== 'granted') {
      return { success: false, error: 'Permission not granted' };
    }

    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification('Your Bazar Duty Today! (টেস্ট অ্যালার্ট)', {
        body: 'You are assigned bazar duty today. Please complete your duty on time. (ভাইব্রেশন টেস্ট)',
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        tag: 'bazar-duty-reminder-test',
        renotify: true,
        vibrate: [300, 100, 300],
        data: {
          url: '/bazar-schedule',
          dutyDate: getTodayDateString(),
          isTest: true
        }
      });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Record a notification attempt in notificationLogs to prevent duplicate sends
   * Key: {memberUid}_{dutyDate}_{notificationType}
   */
  async logNotificationAttempt({ memberUid, dutyDate, status = 'sent', messId = DEFAULT_MESS_ID, tokenCount = 1, error = null }) {
    const uniqueLogId = `${memberUid}_bazar_duty_${dutyDate}`;
    const logData = {
      memberUid,
      dutyDate,
      notificationType: 'bazar_duty',
      status, // 'sent' | 'failed' | 'no_tokens'
      tokenCount,
      error: error || null,
      messId: messId || DEFAULT_MESS_ID,
      sentAt: new Date().toISOString()
    };

    if (isFirebaseConfigured()) {
      try {
        await setDoc(doc(db, 'notificationLogs', uniqueLogId), logData, { merge: true });
      } catch (err) {
        console.warn('Could not record notification log:', err.message);
      }
    }

    return { logId: uniqueLogId, ...logData };
  },

  /**
   * Check if a duty notification has already been logged for today
   */
  async hasNotificationBeenSent({ memberUid, dutyDate }) {
    const uniqueLogId = `${memberUid}_bazar_duty_${dutyDate}`;
    if (!isFirebaseConfigured()) return false;

    try {
      const snap = await getDoc(doc(db, 'notificationLogs', uniqueLogId));
      if (snap.exists()) {
        const data = snap.data();
        return data.status === 'sent';
      }
    } catch (_) {}
    return false;
  },

  /**
   * Fetch recent notification logs for the admin settings viewer
   */
  async getRecentLogs(limitCount = 20) {
    if (!isFirebaseConfigured()) return [];
    try {
      const snap = await getDocs(collection(db, 'notificationLogs'));
      const logs = [];
      snapshotToLogs(snap, logs);
      logs.sort((a, b) => (a.sentAt < b.sentAt ? 1 : -1));
      return logs.slice(0, limitCount);
    } catch (err) {
      console.warn('Failed to load recent notification logs:', err);
      return [];
    }
  },

  /**
   * Check and auto-dispatch today's push notification for the assigned bazar duty member
   */
  async checkAndAutoDispatchToday(schedules = [], activeMonthId, messId = DEFAULT_MESS_ID, currentMemberUid = null) {
    const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;
    const config = await this.getConfig(targetMessId);
    if (!config.enabled) {
      return { dispatched: 0, skipped: true, reason: 'Push notification automation is disabled.' };
    }

    // Check time in Asia/Dhaka
    const now = new Date();
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMins = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHours}:${currentMins}`;

    if (config.notifyTime && currentTimeStr < config.notifyTime) {
      return {
        dispatched: 0,
        skipped: true,
        reason: `Scheduled for ${config.notifyTime} (current is ${currentTimeStr})`
      };
    }

    const todayDateStr = getTodayDateString();
    let dutyList = schedules;

    if (!dutyList || dutyList.length === 0) {
      const cleanMonth = (activeMonthId || todayDateStr.slice(0, 7)).includes('_')
        ? (activeMonthId || todayDateStr.slice(0, 7)).split('_').pop()
        : (activeMonthId || todayDateStr.slice(0, 7));

      if (isFirebaseConfigured()) {
        try {
          const snap = await getDocs(collection(db, 'messes', targetMessId, 'months', cleanMonth, 'bazarSchedules'));
          dutyList = [];
          snap.forEach((d) => dutyList.push({ id: d.id, ...d.data(), docRef: d.ref }));
          if (dutyList.length === 0 && targetMessId === DEFAULT_MESS_ID) {
            const rootSnap = await getDocs(collection(db, 'months', cleanMonth, 'bazarSchedules'));
            rootSnap.forEach((d) => dutyList.push({ id: d.id, ...d.data(), docRef: d.ref }));
          }
        } catch (e) {
          console.warn('Could not query duty schedules for push check:', e);
        }
      }
    }

    const todayDuties = (dutyList || []).filter(
      (s) => s.date === todayDateStr && s.status !== 'cancelled'
    );

    if (todayDuties.length === 0) {
      return { dispatched: 0, message: 'No duty assigned for today.' };
    }

    let dispatchedCount = 0;
    const results = [];

    for (const duty of todayDuties) {
      const targetMemberUid = duty.memberId;
      if (!targetMemberUid) continue;

      // Deduplication check: prevent multiple sends for the same duty date & member
      const alreadySent = await this.hasNotificationBeenSent({
        memberUid: targetMemberUid,
        dutyDate: todayDateStr
      });

      if (alreadySent || duty.autoPushSent) {
        continue;
      }

      // Query active device tokens for target member
      const activeTokens = await this.getMemberActiveTokens(targetMemberUid);

      if (activeTokens.length === 0) {
        // Record in logs so we know attempt occurred but no devices were registered
        await this.logNotificationAttempt({
          memberUid: targetMemberUid,
          dutyDate: todayDateStr,
          status: 'no_tokens',
          messId: targetMessId,
          tokenCount: 0
        });
        results.push({ memberUid: targetMemberUid, status: 'no_tokens', memberName: duty.memberName });
        continue;
      }

      // If current logged in member is the assigned duty member on this active browser, trigger notification!
      if (currentMemberUid && currentMemberUid === targetMemberUid && isPushSupported()) {
        try {
          await this.sendLocalTestNotification();
        } catch (_) {}
      }

      // Record successful notification in log
      await this.logNotificationAttempt({
        memberUid: targetMemberUid,
        dutyDate: todayDateStr,
        status: 'sent',
        messId: targetMessId,
        tokenCount: activeTokens.length
      });

      // Mark duty schedule document
      if (duty.docRef) {
        try {
          await updateDoc(duty.docRef, {
            autoPushSent: true,
            autoPushSentAt: new Date().toISOString()
          });
        } catch (_) {}
      }

      dispatchedCount++;
      results.push({
        memberUid: targetMemberUid,
        status: 'sent',
        memberName: duty.memberName,
        tokenCount: activeTokens.length
      });
    }

    return { dispatched: dispatchedCount, results };
  }
};

function snapshotToLogs(snapshot, list) {
  snapshot.forEach((d) => {
    list.push({ id: d.id, ...d.data() });
  });
}
