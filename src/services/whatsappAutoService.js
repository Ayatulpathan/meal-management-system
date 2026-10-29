/**
 * Automated WhatsApp Gateway & Notification Dispatcher Service
 * Supports CallMeBot (Free), UltraMsg, GreenAPI, and Custom Webhooks
 */

import {
  db,
  doc,
  getDoc,
  setDoc,
  isFirebaseConfigured
} from './firebase';
import { sanitizeBDPhoneNumber, generateWhatsAppMessage } from '../utils/bazarNotificationUtils';
import { bazarScheduleService } from './bazarScheduleService';
import { getTodayDateString, getCurrentMonthId } from '../utils/dateUtils';

const CONFIG_STORAGE_KEY = 'mms_whatsapp_config';

export const WHATSAPP_PROVIDERS = {
  CALLMEBOT: 'callmebot',
  ULTRAMSG: 'ultramsg',
  GREENAPI: 'greenapi',
  CUSTOM_WEBHOOK: 'custom_webhook',
  SIMULATION: 'simulation',
};

const DEFAULT_CONFIG = {
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
  lastUpdated: null,
};

export const whatsappAutoService = {
  /**
   * Fetch current WhatsApp automation configuration
   * @returns {Promise<Object>}
   */
  async getConfig() {
    const local = localStorage.getItem(CONFIG_STORAGE_KEY);
    let cached = DEFAULT_CONFIG;
    if (local) {
      try {
        cached = { ...DEFAULT_CONFIG, ...JSON.parse(local) };
      } catch (e) {
        // use default
      }
    }

    if (!isFirebaseConfigured()) {
      return cached;
    }

    try {
      const docRef = doc(db, 'settings', 'whatsappConfig');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const firestoreConfig = { ...DEFAULT_CONFIG, ...snap.data() };
        localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(firestoreConfig));
        return firestoreConfig;
      }
      return cached;
    } catch (err) {
      console.warn('Could not load WhatsApp config from Firestore, using local cache:', err);
      return cached;
    }
  },

  /**
   * Save WhatsApp automation configuration to Firestore and LocalStorage
   * @param {Object} newConfig 
   * @returns {Promise<Object>}
   */
  async saveConfig(newConfig) {
    const merged = {
      ...DEFAULT_CONFIG,
      ...newConfig,
      lastUpdated: new Date().toISOString(),
    };

    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(merged));

    if (!isFirebaseConfigured()) {
      return { success: true, config: merged };
    }

    try {
      const docRef = doc(db, 'settings', 'whatsappConfig');
      await setDoc(docRef, merged, { merge: true });
      return { success: true, config: merged };
    } catch (err) {
      console.error('Error saving WhatsApp config to Firestore:', err);
      return { success: false, error: err.message, config: merged };
    }
  },

  /**
   * Sends an automated message using the configured gateway provider
   * @param {Object} params
   * @param {string} params.phone - Raw or formatted recipient phone number
   * @param {string} params.message - Body text to send
   * @param {Object} [params.config] - Optional config override
   * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
   */
  async sendViaGateway({ phone, message, config = null }) {
    const activeConfig = config || (await this.getConfig());
    const cleanPhone = sanitizeBDPhoneNumber(phone);

    if (!cleanPhone) {
      return { success: false, error: 'Recipient phone number is missing or invalid' };
    }

    if (!message || !message.trim()) {
      return { success: false, error: 'Message body cannot be empty' };
    }

    const { provider, apiKey, instanceId, token, webhookUrl } = activeConfig;

    try {
      // 1. Simulation Mode (for testing without real credentials)
      if (provider === WHATSAPP_PROVIDERS.SIMULATION) {
        console.log(`[SIMULATED WHATSAPP SENT] To: +${cleanPhone}\nBody: ${message}`);
        return {
          success: true,
          messageId: `sim_${Date.now()}`,
          note: `Simulated dispatch to +${cleanPhone}`,
        };
      }

      // 2. CallMeBot Gateway (Free personal WhatsApp Bot)
      if (provider === WHATSAPP_PROVIDERS.CALLMEBOT) {
        if (!apiKey) {
          return { success: false, error: 'CallMeBot API Key is required. Please enter it in Settings.' };
        }
        // CallMeBot takes BD phone as +88017...
        const targetPhone = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;
        const encodedText = encodeURIComponent(message);
        const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(targetPhone)}&text=${encodedText}&apikey=${encodeURIComponent(apiKey)}`;

        const response = await fetch(url, { method: 'GET' });
        const text = await response.text();

        if (response.ok && (text.includes('Message queued') || text.includes('Success') || text.includes('200'))) {
          return { success: true, messageId: `cmb_${Date.now()}` };
        }
        return {
          success: false,
          error: text || `CallMeBot returned status ${response.status}`,
        };
      }

      // 3. UltraMsg Gateway
      if (provider === WHATSAPP_PROVIDERS.ULTRAMSG) {
        if (!instanceId || !token) {
          return { success: false, error: 'UltraMsg Instance ID and Token are required.' };
        }

        const url = `https://api.ultramsg.com/${instanceId}/messages/chat`;
        const params = new URLSearchParams();
        params.append('token', token);
        params.append('to', `+${cleanPhone}`);
        params.append('body', message);

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params,
        });

        const data = await response.json();
        if (data.sent === 'true' || data.sent === true || data.id) {
          return { success: true, messageId: data.id };
        }
        return { success: false, error: data.error || data.message || 'UltraMsg failed to dispatch' };
      }

      // 4. Green API Gateway
      if (provider === WHATSAPP_PROVIDERS.GREENAPI) {
        if (!instanceId || !token) {
          return { success: false, error: 'Green API Instance ID and Token are required.' };
        }

        const url = `https://api.green-api.com/waInstance${instanceId}/sendMessage/${token}`;
        const chatId = `${cleanPhone}@c.us`;

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chatId, message }),
        });

        const data = await response.json();
        if (data.idMessage) {
          return { success: true, messageId: data.idMessage };
        }
        return { success: false, error: data.message || 'Green API failed to dispatch' };
      }

      // 5. Custom Webhook (n8n, Make, Zapier, custom Node.js bot)
      if (provider === WHATSAPP_PROVIDERS.CUSTOM_WEBHOOK) {
        if (!webhookUrl) {
          return { success: false, error: 'Custom Webhook URL is required.' };
        }

        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: cleanPhone,
            message,
            timestamp: new Date().toISOString(),
          }),
        });

        if (response.ok) {
          return { success: true, messageId: `wh_${Date.now()}` };
        }
        return { success: false, error: `Webhook returned HTTP ${response.status}` };
      }

      return { success: false, error: `Unsupported WhatsApp provider: ${provider}` };
    } catch (err) {
      console.error('WhatsApp Gateway dispatch error:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Automatically dispatches a bazar duty notification to the assigned member
   * @param {Object} schedule - Bazar schedule record
   * @param {string} [monthId]
   * @param {Object} [config]
   * @returns {Promise<Object>}
   */
  async dispatchDutyAlert(schedule, monthId = null, config = null) {
    if (!schedule || !schedule.memberPhone) {
      return { success: false, error: 'Schedule has no member phone number.' };
    }

    const activeConfig = config || (await this.getConfig());
    const message = generateWhatsAppMessage({ schedule });
    const targetMonth = monthId || schedule.monthId || getCurrentMonthId();

    const result = await this.sendViaGateway({
      phone: schedule.memberPhone,
      message,
      config: activeConfig,
    });

    if (result.success) {
      // Mark as auto-notified in Firestore / local storage
      await bazarScheduleService.updateSchedule(schedule.id, {
        monthId: targetMonth,
        autoNotified: true,
        autoNotifiedAt: new Date().toISOString(),
        notificationStatus: 'sent',
      });
    } else {
      await bazarScheduleService.updateSchedule(schedule.id, {
        monthId: targetMonth,
        notificationStatus: 'failed',
      });
    }

    return result;
  },

  /**
   * Scans today's schedule entries and auto-dispatches WhatsApp messages for unnotified members
   * @param {Array} schedules 
   * @param {string} activeMonthId 
   * @returns {Promise<{dispatched: number, results: Array}>}
   */
  async checkAndAutoDispatchToday(schedules = [], activeMonthId) {
    const config = await this.getConfig();
    if (!config.enabled) {
      return { dispatched: 0, skipped: true, reason: 'Automation is disabled in Settings' };
    }

    const todayStr = getTodayDateString();
    const todayDuties = schedules.filter(
      (s) => s.date === todayStr && !s.autoNotified && s.memberPhone
    );

    if (todayDuties.length === 0) {
      return { dispatched: 0, message: 'No pending duties to notify for today.' };
    }

    const results = [];
    for (const duty of todayDuties) {
      const res = await this.dispatchDutyAlert(duty, activeMonthId, config);
      results.push({
        id: duty.id,
        memberName: duty.memberName,
        phone: duty.memberPhone,
        success: res.success,
        error: res.error,
      });
    }

    const successfulCount = results.filter((r) => r.success).length;
    return { dispatched: successfulCount, results };
  },

  /**
   * Sends a test WhatsApp message to the admin's own phone to verify setup
   * @param {string} testPhone 
   * @param {Object} [configOverride]
   * @returns {Promise<Object>}
   */
  async sendTestMessage(testPhone, configOverride = null) {
    const config = configOverride || (await this.getConfig());
    const phone = testPhone || config.testPhone;

    if (!phone) {
      return { success: false, error: 'Please enter a test phone number.' };
    }

    const testMessage = `🔔 [MessHishab Test Alert]
আসসালামু আলাইকুম!
আপনার মেসের স্বয়ংক্রিয় হোয়াটসঅ্যাপ অ্যালার্ট সফলভাবে কনফিগার ও কানেক্ট হয়েছে।
এখন থেকে বাজার শিডিউলের দায়িত্বপ্রাপ্ত মেম্বাররা সরাসরি এই গেটওয়ে থেকে স্বয়ংক্রিয় নোটিফিকেশন পাবেন।

Time: ${new Date().toLocaleTimeString()}
Date: ${getTodayDateString()}
— MessHishab Automated Dispatcher`;

    return await this.sendViaGateway({
      phone,
      message: testMessage,
      config,
    });
  },
};
