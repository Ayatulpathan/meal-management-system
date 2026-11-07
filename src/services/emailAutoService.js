/**
 * Automated Email & Gmail Notification Service
 * Supports EmailJS (Free & Browser-native), Google Apps Script Webhook Relay (100% Free personal Gmail),
 * Brevo API (Free 300/day), Resend API (Free 3,000/mo), Gmail SMTP (Cloud runner with App Password), and Simulation
 */

import {
  db,
  doc,
  getDoc,
  setDoc,
  isFirebaseConfigured
} from './firebase';
import {
  getMessDoc,
  getRootDoc,
  setMessDocData,
  updateMessDocData
} from './dbPaths';
import { formatDateDisplay, getTodayDateString } from '../utils/dateUtils';
import { formatCurrency } from '../utils/currencyUtils';
import { DEFAULT_MESS_ID, getActiveMessId } from '../models/messModel';

const CONFIG_STORAGE_KEY = 'mms_email_config';

export const EMAIL_PROVIDERS = {
  EMAILJS: 'emailjs',
  GOOGLE_SCRIPT: 'google_script',
  BREVO: 'brevo',
  RESEND: 'resend',
  GMAIL_SMTP: 'gmail_smtp',
  SIMULATION: 'simulation',
};

const DEFAULT_CONFIG = {
  enabled: true,
  provider: EMAIL_PROVIDERS.EMAILJS,
  senderEmail: '',
  senderName: 'MessHishab Manager',
  gmailAppPassword: '',
  resendApiKey: '',
  brevoApiKey: '',
  emailjsServiceId: '',
  emailjsTemplateId: '',
  emailjsPublicKey: '',
  googleScriptUrl: '',
  testEmail: '',
  notifyTime: '07:00',
  sendAdvanceNoticeEveningBefore: false,
  lastUpdated: null,
};

/**
 * Generate rich, mobile-responsive HTML email template
 */
export const generateDutyEmailHtml = ({
  memberName = 'সহযোদ্ধা',
  date = '',
  estimatedBudget = 0,
  notes = '',
  messName = 'MessHishab',
}) => {
  const formattedDate = date ? formatDateDisplay(date) : 'আজকে';
  const formattedBudget = estimatedBudget > 0 ? formatCurrency(estimatedBudget) : 'প্রয়োজন অনুযায়ী';
  const notesHtml = notes
    ? `<div style="margin-top:12px; padding:12px; background-color:#f1f5f9; border-left:4px solid #10b981; border-radius:6px; font-size:14px; color:#334155;">
        <strong>📝 বাজারের ফর্দ / নোট:</strong><br/>${notes}
       </div>`
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bazar Duty Reminder - ${messName}</title>
</head>
<body style="margin:0; padding:0; background-color:#f8fafc; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color:#1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f8fafc; padding:30px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:540px; background-color:#ffffff; border-radius:18px; overflow:hidden; box-shadow:0 10px 25px rgba(0,0,0,0.06); border:1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background:linear-gradient(135deg, #059669 0%, #0d9488 100%); padding:28px 24px; text-align:center;">
              <h1 style="color:#ffffff; margin:0; font-size:24px; font-weight:800; letter-spacing:-0.5px;">
                🛒 ${messName}
              </h1>
              <p style="color:#a7f3d0; margin:6px 0 0 0; font-size:13px; font-weight:500;">
                দৈনিক বাজার শিডিউল নোটিফিকেশন (Bazar Duty Alert)
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding:28px 24px;">
              <p style="font-size:16px; line-height:24px; margin:0 0 16px 0; color:#0f172a;">
                আসসালামু আলাইকুম <strong>${memberName}</strong>,
              </p>
              
              <p style="font-size:14px; line-height:22px; color:#475569; margin:0 0 20px 0;">
                আপনাকে জানানো হচ্ছে যে, মেসের শিডিউল অনুযায়ী <strong>${formattedDate}</strong> তারিখে আপনার বাজার করার দায়িত্ব রয়েছে।
              </p>

              <!-- Duty Details Card -->
              <table role="presentation" width="100%" style="background-color:#ecfdf5; border:1px solid #a7f3d0; border-radius:12px; padding:16px; margin-bottom:20px;">
                <tr>
                  <td>
                    <table width="100%" cellspacing="0" cellpadding="6" style="font-size:14px; color:#065f46;">
                      <tr>
                        <td width="35%" style="font-weight:600; color:#047857;">📅 তারিখ:</td>
                        <td style="font-weight:700; color:#064e3b;">${formattedDate}</td>
                      </tr>
                      <tr>
                        <td style="font-weight:600; color:#047857;">👤 দায়িত্বপ্রাপ্ত:</td>
                        <td style="font-weight:700; color:#064e3b;">${memberName}</td>
                      </tr>
                      <tr>
                        <td style="font-weight:600; color:#047857;">💵 আনুমানিক বাজেট:</td>
                        <td style="font-weight:800; color:#059669; font-size:15px;">${formattedBudget}</td>
                      </tr>
                    </table>
                    ${notesHtml}
                  </td>
                </tr>
              </table>

              <p style="font-size:13px; line-height:20px; color:#64748b; margin:0 0 24px 0;">
                অনুগ্রহ করে মেসের দায়িত্বপ্রাপ্তদের সাথে যোগাযোগ করে বাজারের ফর্দ ও প্রয়োজনীয় টাকা সংগ্রহ করে নিবেন। বাজার সম্পন্ন হওয়ার পর মেস ম্যানেজারে খরচের ভাউচার যুক্ত করার অনুরোধ করা হলো।
              </p>

              <!-- Button -->
              <div style="text-align:center; margin:25px 0 10px 0;">
                <a href="https://khadok-meal.web.app/bazar-schedule" style="background-color:#059669; color:#ffffff; padding:12px 28px; text-decoration:none; font-weight:700; font-size:14px; border-radius:10px; display:inline-block; box-shadow:0 4px 12px rgba(5,150,105,0.25);">
                  View Full Schedule Online →
                </a>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc; padding:18px 24px; border-top:1px solid #e2e8f0; text-align:center; font-size:12px; color:#94a3b8;">
              <p style="margin:0 0 4px 0;">
                This is an automated notification from <strong>${messName}</strong>.
              </p>
              <p style="margin:0;">
                © 2026 ${messName}. Developed for group dining & mess management.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

export const emailAutoService = {
  /**
   * Get current email configuration for a specific mess
   * @param {string} messId
   */
  async getConfig(messId = DEFAULT_MESS_ID) {
    const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;
    const storageKey = (!targetMessId || targetMessId === DEFAULT_MESS_ID) ? CONFIG_STORAGE_KEY : `${CONFIG_STORAGE_KEY}_${targetMessId}`;
    const local = localStorage.getItem(storageKey);
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
      const docRef = getMessDoc(targetMessId, 'settings', 'email');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const firestoreConfig = { ...DEFAULT_CONFIG, ...snap.data() };
        localStorage.setItem(storageKey, JSON.stringify(firestoreConfig));
        return firestoreConfig;
      }
      if (targetMessId === DEFAULT_MESS_ID) {
        const rootSnap = await getDoc(getRootDoc('settings', 'email'));
        if (rootSnap.exists()) {
          const firestoreConfig = { ...DEFAULT_CONFIG, ...rootSnap.data() };
          localStorage.setItem(storageKey, JSON.stringify(firestoreConfig));
          return firestoreConfig;
        }
        const legacySnap = await getDoc(getRootDoc('settings', 'emailConfig'));
        if (legacySnap.exists()) {
          const firestoreConfig = { ...DEFAULT_CONFIG, ...legacySnap.data() };
          localStorage.setItem(storageKey, JSON.stringify(firestoreConfig));
          return firestoreConfig;
        }
      }
      return cached;
    } catch (err) {
      console.warn('Could not load email config from Firestore:', err);
      return cached;
    }
  },

  /**
   * Save email configuration to Firestore and LocalStorage
   * @param {Object} newConfig
   * @param {string} messId
   */
  async saveConfig(newConfig, messId = DEFAULT_MESS_ID) {
    const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;
    const storageKey = (!targetMessId || targetMessId === DEFAULT_MESS_ID) ? CONFIG_STORAGE_KEY : `${CONFIG_STORAGE_KEY}_${targetMessId}`;

    const merged = {
      ...DEFAULT_CONFIG,
      ...newConfig,
      lastUpdated: new Date().toISOString(),
    };

    localStorage.setItem(storageKey, JSON.stringify(merged));

    if (!isFirebaseConfigured()) {
      return { success: true, config: merged };
    }

    try {
      await setMessDocData(targetMessId, ['settings', 'email'], merged);
      // For default mess, also mirror to legacy settings/emailConfig so older scripts read it
      if (targetMessId === DEFAULT_MESS_ID) {
        try {
          await setMessDocData(targetMessId, ['settings', 'emailConfig'], merged);
        } catch (_) {}
      }
      return { success: true, config: merged };
    } catch (err) {
      console.error('Error saving email config to Firestore:', err);
      return { success: false, error: err.message, config: merged };
    }
  },

  /**
   * Send email using EmailJS REST API (Free & Works natively in browser without backend)
   */
  async sendViaEmailJS({ to, subject, html, memberName = 'সহযোদ্ধা', config }) {
    const serviceId = config.emailjsServiceId;
    const templateId = config.emailjsTemplateId;
    const publicKey = config.emailjsPublicKey;

    if (!publicKey || !serviceId || !templateId) {
      return {
        success: false,
        error: 'Missing EmailJS credentials. Please enter your Public Key, Service ID, and Template ID in Settings.',
      };
    }

    try {
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: serviceId,
          template_id: templateId,
          user_id: publicKey,
          template_params: {
            to_email: to,
            recipient_email: to,
            to_name: memberName,
            subject,
            message: html,
            html_message: html,
            mess_name: config.senderName || 'MessHishab',
          },
        }),
      });

      const responseText = await response.text();
      if (response.ok) {
        return { success: true, messageId: `emailjs_${Date.now()}` };
      }
      return {
        success: false,
        error: responseText || `EmailJS returned HTTP ${response.status}`,
      };
    } catch (err) {
      return { success: false, error: `EmailJS connection failed: ${err.message}` };
    }
  },

  /**
   * Send email using Google Apps Script Web App Relay (100% Free - Sends from user's Gmail)
   */
  async sendViaGoogleScript({ to, subject, html, config }) {
    const scriptUrl = config.googleScriptUrl;
    if (!scriptUrl || !scriptUrl.startsWith('http')) {
      return {
        success: false,
        error: 'Please enter your Google Apps Script Web App URL in Settings.',
      };
    }

    try {
      await fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to,
          subject,
          html,
          senderName: config.senderName || 'MessHishab Manager',
        }),
      });

      return {
        success: true,
        messageId: `gas_${Date.now()}`,
        note: 'Dispatched via Google Apps Script Gmail Webhook',
      };
    } catch (err) {
      return { success: false, error: `Google Script relay error: ${err.message}` };
    }
  },

  /**
   * Send email using Brevo (Sendinblue) API (Free - 300 emails/day)
   */
  async sendViaBrevo({ to, subject, html, config }) {
    const apiKey = config.brevoApiKey;
    if (!apiKey) {
      return { success: false, error: 'Brevo API Key is missing. Please enter it in Settings.' };
    }

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: {
            name: config.senderName || 'MessHishab Manager',
            email: config.senderEmail || 'manager@messhishab.com',
          },
          to: [{ email: to }],
          subject,
          htmlContent: html,
        }),
      });

      const data = await response.json();
      if (response.ok && data.messageId) {
        return { success: true, messageId: data.messageId };
      }
      return {
        success: false,
        error: data.message || `Brevo returned HTTP ${response.status}`,
      };
    } catch (err) {
      return { success: false, error: `Brevo dispatch failed: ${err.message}` };
    }
  },

  /**
   * Send email using Resend API (Free - 3,000 emails/month)
   */
  async sendViaResend({ to, subject, html, config }) {
    const apiKey = config.resendApiKey;
    if (!apiKey) {
      return { success: false, error: 'Resend API Key is missing. Please enter it in Settings.' };
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${config.senderName || 'MessHishab'} <onboarding@resend.dev>`,
          to: [to],
          subject,
          html,
        }),
      });

      const data = await response.json();
      if (response.ok && data.id) {
        return { success: true, messageId: data.id };
      }
      return {
        success: false,
        error: data.message || `Resend returned HTTP ${response.status}`,
      };
    } catch (err) {
      return { success: false, error: `Resend dispatch failed: ${err.message}` };
    }
  },

  /**
   * Send an automated email through configured provider
   */
  async sendEmail({ to, subject, html, memberName, config = null }) {
    const activeConfig = config || (await this.getConfig());

    if (!to || !to.includes('@')) {
      return { success: false, error: 'Recipient email address is invalid.' };
    }

    const { provider } = activeConfig;

    try {
      if (provider === EMAIL_PROVIDERS.SIMULATION) {
        console.log(`[SIMULATED EMAIL SENT] To: ${to}\nSubject: ${subject}`);
        return { success: true, messageId: `sim_email_${Date.now()}` };
      }

      if (provider === EMAIL_PROVIDERS.EMAILJS) {
        return await this.sendViaEmailJS({ to, subject, html, memberName, config: activeConfig });
      }

      if (provider === EMAIL_PROVIDERS.GOOGLE_SCRIPT) {
        return await this.sendViaGoogleScript({ to, subject, html, config: activeConfig });
      }

      if (provider === EMAIL_PROVIDERS.BREVO) {
        return await this.sendViaBrevo({ to, subject, html, config: activeConfig });
      }

      if (provider === EMAIL_PROVIDERS.RESEND) {
        return await this.sendViaResend({ to, subject, html, config: activeConfig });
      }

      if (provider === EMAIL_PROVIDERS.GMAIL_SMTP) {
        // If an API key or webhook is configured alongside, use it for browser dispatch
        if (activeConfig.emailjsPublicKey && activeConfig.emailjsServiceId) {
          return await this.sendViaEmailJS({ to, subject, html, memberName, config: activeConfig });
        }
        if (activeConfig.googleScriptUrl) {
          return await this.sendViaGoogleScript({ to, subject, html, config: activeConfig });
        }
        if (activeConfig.brevoApiKey) {
          return await this.sendViaBrevo({ to, subject, html, config: activeConfig });
        }
        if (activeConfig.resendApiKey) {
          return await this.sendViaResend({ to, subject, html, config: activeConfig });
        }

        // Validate that sender credentials exist
        if (!activeConfig.senderEmail || !activeConfig.gmailAppPassword) {
          return {
            success: false,
            error: 'Sender Gmail or Google App Password is missing. Please enter them above in Settings.',
          };
        }

        // Honest error message: Browser cannot open raw TCP port 465 to Gmail SMTP
        return {
          success: false,
          error:
            'Notice: Direct Gmail SMTP using an App Password is executed 24/7 by the automated Cloud Runner (cron-email-duty.mjs via GitHub Actions), because browsers cannot open raw TCP connections to smtp.gmail.com:465. To send live emails directly from this browser right now, please select EmailJS, Google Apps Script, or Brevo in the provider dropdown above.',
        };
      }

      return { success: false, error: `Unknown email provider: ${provider}` };
    } catch (err) {
      console.error('Email dispatch error:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Send test email to verify credentials
   */
  async sendTestEmail(recipientEmail, configOverride = null) {
    const config = configOverride || (await this.getConfig());
    const targetEmail = recipientEmail || config.testEmail;

    if (!targetEmail || !targetEmail.includes('@')) {
      return { success: false, error: 'Please enter a valid recipient email address.' };
    }

    const testHtml = generateDutyEmailHtml({
      memberName: 'টেস্ট মেম্বার (Test Member)',
      date: getTodayDateString(),
      estimatedBudget: 2500,
      notes: 'মাছ, শাকসবজি, ডিম ও মশলাপাতি',
      messName: config.senderName || 'MessHishab',
    });

    return await this.sendEmail({
      to: targetEmail,
      subject: `🛒 [${config.senderName || 'MessHishab'}] বাজার শিডিউল টেস্ট ইমেইল অ্যালার্ট (Test Alert)`,
      html: testHtml,
      memberName: 'টেস্ট মেম্বার',
      config,
    });
  },

  /**
   * Check and auto-dispatch today's duty email alert if reached scheduled time
   * @param {Array} schedules
   * @param {string} activeMonthId
   * @param {string} messId
   */
  async checkAndAutoDispatchToday(schedules = [], activeMonthId, messId = DEFAULT_MESS_ID) {
    const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;
    const config = await this.getConfig(targetMessId);
    if (!config.enabled) {
      return { dispatched: 0, skipped: true, reason: 'Email automation is disabled in Settings' };
    }

    // Check if the current time has reached the scheduled notification time
    if (config.notifyTime) {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMins = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMins}`;
      if (currentTimeStr < config.notifyTime) {
        return {
          dispatched: 0,
          skipped: true,
          reason: `Alert scheduled for ${config.notifyTime} (current time is ${currentTimeStr})`,
        };
      }
    }

    const todayStr = getTodayDateString();
    const todayDuties = schedules.filter(
      (s) => s.date === todayStr && !s.autoEmailSent && (s.memberEmail || s.email)
    );

    if (todayDuties.length === 0) {
      return { dispatched: 0, message: 'No pending email duties for today.' };
    }

    const results = [];
    for (const duty of todayDuties) {
      const recipientEmail = duty.memberEmail || duty.email;
      const emailHtml = generateDutyEmailHtml({
        memberName: duty.memberName || 'সহযোদ্ধা',
        date: duty.date,
        estimatedBudget: duty.estimatedBudget || 0,
        notes: duty.notes || '',
        messName: config.senderName || 'MessHishab',
      });

      const res = await this.sendEmail({
        to: recipientEmail,
        subject: `🛒 [${config.senderName || 'MessHishab'}] আজ (${duty.date}) আপনার বাজার করার দায়িত্ব রয়েছে`,
        html: emailHtml,
        memberName: duty.memberName || 'সহযোদ্ধা',
        config,
      });

      if (res.success && isFirebaseConfigured()) {
        try {
          await updateMessDocData(targetMessId, ['months', activeMonthId, 'bazarSchedules', duty.id], {
            autoEmailSent: true,
            autoEmailSentAt: new Date().toISOString(),
            emailStatus: 'sent',
          });
        } catch (dbErr) {
          console.warn('Failed to update duty email status:', dbErr);
        }
      }

      results.push({
        id: duty.id,
        memberName: duty.memberName,
        email: recipientEmail,
        success: res.success,
        error: res.error,
      });
    }

    const successfulCount = results.filter((r) => r.success).length;
    return { dispatched: successfulCount, results };
  },
};
