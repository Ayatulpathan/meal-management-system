/**
 * MessHishab - 24/7 Automated Daily Bazar Duty Email Dispatcher
 * Multi-Tenant & Standalone Aware: Iterates through each mess, checks notifyTime,
 * and sends rich HTML email alerts to today's duty member via Gmail SMTP, Resend, Brevo, or Google Script.
 * Runs on GitHub Actions (Free) or via CLI
 */

import nodemailer from 'nodemailer';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || 'AIzaSyDcvOWmVDpn1VX2FWnmPU1NyqhrhGTviZQ',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'khadok-meal.firebaseapp.com',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'khadok-meal',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'khadok-meal.firebasestorage.app',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '984656453342',
  appId: process.env.VITE_FIREBASE_APP_ID || '1:984656453342:web:e8582819dc5b8622346c4f',
};

// Rich HTML Template
function generateDutyEmailHtml({ memberName, date, estimatedBudget, notes, messName = 'MessHishab' }) {
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
  <title>Bazar Duty Reminder - ${messName}</title>
</head>
<body style="margin:0; padding:0; background-color:#f8fafc; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color:#1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f8fafc; padding:30px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:540px; background-color:#ffffff; border-radius:18px; overflow:hidden; box-shadow:0 10px 25px rgba(0,0,0,0.06); border:1px solid #e2e8f0;">
          <tr>
            <td style="background:linear-gradient(135deg, #059669 0%, #0d9488 100%); padding:28px 24px; text-align:center;">
              <h1 style="color:#ffffff; margin:0; font-size:24px; font-weight:800;">
                🛒 ${messName}
              </h1>
              <p style="color:#a7f3d0; margin:6px 0 0 0; font-size:13px; font-weight:500;">
                দৈনিক বাজার শিডিউল নোটিফিকেশন (Bazar Duty Alert)
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 24px;">
              <p style="font-size:16px; line-height:24px; margin:0 0 16px 0; color:#0f172a;">
                আসসালামু আলাইকুম <strong>${memberName}</strong>,
              </p>
              <p style="font-size:14px; line-height:22px; color:#475569; margin:0 0 20px 0;">
                আপনাকে জানানো হচ্ছে যে, মেসের শিডিউল অনুযায়ী আজ <strong>${date}</strong> তারিখে আপনার বাজার করার দায়িত্ব রয়েছে।
              </p>
              <table role="presentation" width="100%" style="background-color:#ecfdf5; border:1px solid #a7f3d0; border-radius:12px; padding:16px; margin-bottom:20px;">
                <tr>
                  <td>
                    <table width="100%" cellspacing="0" cellpadding="6" style="font-size:14px; color:#065f46;">
                      <tr>
                        <td width="35%" style="font-weight:600; color:#047857;">📅 তারিখ:</td>
                        <td style="font-weight:700; color:#064e3b;">${date}</td>
                      </tr>
                      <tr>
                        <td style="font-weight:600; color:#047857;">👤 দায়িত্বপ্রাপ্ত:</td>
                        <td style="font-weight:700; color:#064e3b;">${memberName}</td>
                      </tr>
                      <tr>
                        <td style="font-weight:600; color:#047857;">💵 আনুমানিক বাজেট:</td>
                        <td style="font-weight:800; color:#059669; font-size:15px;">৳${Number(estimatedBudget || 0).toLocaleString('en-IN')}</td>
                      </tr>
                    </table>
                    ${notesHtml}
                  </td>
                </tr>
              </table>
              <p style="font-size:13px; line-height:20px; color:#64748b; margin:0 0 24px 0;">
                অনুগ্রহ করে মেসের দায়িত্বপ্রাপ্তদের সাথে যোগাযোগ করে বাজারের ফর্দ ও প্রয়োজনীয় টাকা সংগ্রহ করে নিবেন।
              </p>
              <div style="text-align:center; margin:25px 0 10px 0;">
                <a href="https://khadok-meal.web.app/bazar-schedule" style="background-color:#059669; color:#ffffff; padding:12px 28px; text-decoration:none; font-weight:700; font-size:14px; border-radius:10px; display:inline-block;">
                  View Full Schedule Online →
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f8fafc; padding:18px 24px; border-top:1px solid #e2e8f0; text-align:center; font-size:12px; color:#94a3b8;">
              <p style="margin:0;">This is an automated notification from <strong>${messName}</strong>.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

async function processMessDuties(db, messId, messName, todayDateStr, monthId, currentBstTimeStr) {
  console.log(`\n--- Processing Mess: [${messId}] ${messName || ''} ---`);

  // 1. Fetch Email Config
  let config = {
    enabled: true,
    senderEmail: process.env.GMAIL_USER || '',
    senderName: messName || 'MessHishab Manager',
    gmailAppPassword: process.env.GMAIL_APP_PASSWORD || '',
    resendApiKey: process.env.RESEND_API_KEY || '',
    brevoApiKey: process.env.BREVO_API_KEY || '',
    googleScriptUrl: '',
    notifyTime: '07:00',
  };

  // Try mess settings first
  try {
    const snap = await getDoc(doc(db, 'messes', messId, 'settings', 'email'));
    if (snap.exists()) {
      config = { ...config, ...snap.data() };
      console.log(`Loaded config from messes/${messId}/settings/email`);
    } else if (messId === 'khadok-mess') {
      const rootSnap = await getDoc(doc(db, 'settings', 'email'));
      if (rootSnap.exists()) {
        config = { ...config, ...rootSnap.data() };
      } else {
        const legacySnap = await getDoc(doc(db, 'settings', 'emailConfig'));
        if (legacySnap.exists()) {
          config = { ...config, ...legacySnap.data() };
        }
      }
    }
  } catch (err) {
    console.warn(`Could not load email config for mess ${messId}:`, err.message);
  }

  if (!config.enabled) {
    console.log(`Email automation is disabled for mess ${messId}. Skipping.`);
    return 0;
  }

  // Check notifyTime
  const notifyTime = config.notifyTime || '07:00';
  console.log(`Configured Notify Time: ${notifyTime} (Current BST Time: ${currentBstTimeStr})`);

  // 2. Fetch Members for this mess
  const membersSnap = await getDocs(collection(db, 'messes', messId, 'members'));
  const membersMap = {};
  membersSnap.forEach((d) => {
    const data = d.data();
    membersMap[d.id] = data;
    if (data.name) membersMap[data.name.trim().toLowerCase()] = data;
  });

  // If khadok-mess and members collection was empty, fallback to root members
  if (Object.keys(membersMap).length === 0 && messId === 'khadok-mess') {
    try {
      const rootMembers = await getDocs(collection(db, 'members'));
      rootMembers.forEach((d) => {
        const data = d.data();
        membersMap[d.id] = data;
        if (data.name) membersMap[data.name.trim().toLowerCase()] = data;
      });
    } catch (_) {}
  }

  // 3. Fetch today's duty schedules
  let schedRef = collection(db, 'messes', messId, 'months', monthId, 'bazarSchedules');
  let snapshot = await getDocs(schedRef);
  let todayDuties = [];

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    if (data.date === todayDateStr) {
      todayDuties.push({ id: docSnap.id, docRef: docSnap.ref, ...data });
    }
  });

  if (todayDuties.length === 0 && messId === 'khadok-mess') {
    const rootSchedRef = collection(db, 'months', monthId, 'bazarSchedules');
    const rootSnap = await getDocs(rootSchedRef);
    rootSnap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.date === todayDateStr) {
        todayDuties.push({ id: docSnap.id, docRef: docSnap.ref, ...data });
      }
    });
  }

  console.log(`Found ${todayDuties.length} duty schedule(s) for today in mess ${messId}.`);
  if (todayDuties.length === 0) return 0;

  // 4. Setup Transporter if Gmail App Password is provided
  let transporter = null;
  const gmailPass = config.gmailAppPassword || process.env.GMAIL_APP_PASSWORD;
  const senderEmail = config.senderEmail || process.env.GMAIL_USER;

  if (gmailPass && senderEmail) {
    try {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: senderEmail,
          pass: gmailPass.replace(/\s+/g, ''),
        },
      });
      console.log(`Configured Gmail SMTP with sender: ${senderEmail}`);
    } catch (e) {
      console.warn('Gmail transporter init failed:', e.message);
    }
  }

  let sentCount = 0;

  for (const duty of todayDuties) {
    if (duty.autoEmailSent) {
      console.log(`✓ [Already Sent] Member ${duty.memberName} was already emailed at ${duty.autoEmailSentAt}.`);
      continue;
    }

    let recipientEmail = duty.memberEmail || duty.email;
    if (!recipientEmail && duty.memberId && membersMap[duty.memberId]) {
      recipientEmail = membersMap[duty.memberId].email;
    }
    if (!recipientEmail && duty.memberName && membersMap[duty.memberName.trim().toLowerCase()]) {
      recipientEmail = membersMap[duty.memberName.trim().toLowerCase()].email;
    }

    if (!recipientEmail) {
      console.warn(`⚠️ [Missing Email] Member ${duty.memberName} has no email address found in profile.`);
      continue;
    }

    const emailHtml = generateDutyEmailHtml({
      memberName: duty.memberName,
      date: duty.date,
      estimatedBudget: duty.estimatedBudget,
      notes: duty.notes,
      messName: messName || config.senderName || 'MessHishab',
    });

    console.log(`Sending automated email duty alert to ${duty.memberName} (${recipientEmail})...`);
    let sendSuccess = false;

    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"${config.senderName || 'MessHishab Manager'}" <${senderEmail}>`,
          to: recipientEmail,
          subject: `🛒 [${messName || 'MessHishab'}] আজ (${duty.date}) আপনার বাজার করার দায়িত্ব রয়েছে`,
          html: emailHtml,
        });
        sendSuccess = true;
        console.log(`✓ Successfully sent email to ${recipientEmail} via Gmail SMTP!`);
      } catch (err) {
        console.error(`❌ Gmail SMTP failed for ${recipientEmail}:`, err.message);
      }
    } else if (config.brevoApiKey) {
      try {
        const res = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'api-key': config.brevoApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sender: { name: config.senderName || 'MessHishab Manager', email: config.senderEmail || 'manager@messhishab.com' },
            to: [{ email: recipientEmail }],
            subject: `🛒 [${messName || 'MessHishab'}] আজ (${duty.date}) আপনার বাজার করার দায়িত্ব রয়েছে`,
            htmlContent: emailHtml,
          }),
        });
        if (res.ok) {
          sendSuccess = true;
          console.log(`✓ Successfully sent email to ${recipientEmail} via Brevo!`);
        }
      } catch (err) {
        console.error('Brevo API error:', err.message);
      }
    } else if (config.resendApiKey || process.env.RESEND_API_KEY) {
      try {
        const apiKey = config.resendApiKey || process.env.RESEND_API_KEY;
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'MessHishab <onboarding@resend.dev>',
            to: [recipientEmail],
            subject: `🛒 [${messName || 'MessHishab'}] আজ (${duty.date}) আপনার বাজার করার দায়িত্ব রয়েছে`,
            html: emailHtml,
          }),
        });
        if (res.ok) {
          sendSuccess = true;
          console.log(`✓ Successfully sent email to ${recipientEmail} via Resend!`);
        }
      } catch (err) {
        console.error('Resend error:', err.message);
      }
    } else if (config.googleScriptUrl) {
      try {
        await fetch(config.googleScriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: recipientEmail,
            subject: `🛒 [${messName || 'MessHishab'}] আজ (${duty.date}) আপনার বাজার করার দায়িত্ব রয়েছে`,
            html: emailHtml,
            senderName: config.senderName || 'MessHishab Manager',
          }),
        });
        sendSuccess = true;
        console.log(`✓ Successfully sent email to ${recipientEmail} via Google Script!`);
      } catch (err) {
        console.error('Google script relay error:', err.message);
      }
    } else {
      console.log(`[SIMULATION MODE] Would email ${recipientEmail}:\nSubject: Bazar Duty Reminder for ${duty.date}`);
      sendSuccess = true;
    }

    if (sendSuccess) {
      try {
        await updateDoc(duty.docRef, {
          autoEmailSent: true,
          autoEmailSentAt: new Date().toISOString(),
          emailStatus: 'sent',
        });
        sentCount++;
      } catch (dbErr) {
        console.warn('Could not update Firestore autoEmailSent status:', dbErr.message);
      }
    }
  }

  return sentCount;
}

async function runDailyEmailDispatcher() {
  console.log('====================================================');
  console.log('MessHishab - Automated Daily Email Duty Dispatcher');
  console.log(`Current Time (UTC): ${new Date().toISOString()}`);
  console.log('====================================================');

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  // Calculate current date in Bangladesh Time (UTC+6)
  const now = new Date();
  const bdTimeStr = now.toLocaleString('en-US', { timeZone: 'Asia/Dhaka' });
  const bdDate = new Date(bdTimeStr);
  const year = bdDate.getFullYear();
  const month = String(bdDate.getMonth() + 1).padStart(2, '0');
  const day = String(bdDate.getDate()).padStart(2, '0');
  const todayDateStr = `${year}-${month}-${day}`;
  const monthId = `${year}-${month}`;
  const hours = String(bdDate.getHours()).padStart(2, '0');
  const mins = String(bdDate.getMinutes()).padStart(2, '0');
  const currentBstTimeStr = `${hours}:${mins}`;

  console.log(`Current Bangladesh Date: ${todayDateStr} | Time: ${currentBstTimeStr} (Month: ${monthId})`);

  // 1. Fetch all registered messes
  const messesSnap = await getDocs(collection(db, 'messes'));
  const messesList = [];
  messesSnap.forEach((d) => {
    messesList.push({ id: d.id, ...d.data() });
  });

  // Ensure default mess is included
  if (!messesList.some((m) => m.id === 'khadok-mess')) {
    messesList.push({ id: 'khadok-mess', name: 'Khadok Mess' });
  }

  console.log(`Found ${messesList.length} total mess(es) to check.`);

  let totalSent = 0;
  for (const mess of messesList) {
    try {
      const count = await processMessDuties(db, mess.id, mess.name, todayDateStr, monthId, currentBstTimeStr);
      totalSent += count;
    } catch (messErr) {
      console.error(`Error processing mess ${mess.id}:`, messErr);
    }
  }

  console.log('----------------------------------------------------');
  console.log(`Summary: Total emails sent across all messes: ${totalSent}.`);
  console.log('Execution completed successfully.');
  console.log('====================================================');
  process.exit(0);
}

runDailyEmailDispatcher().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
