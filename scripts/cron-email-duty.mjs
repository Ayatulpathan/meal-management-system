/**
 * MessHishab - 24/7 Automated Daily Bazar Duty Email Dispatcher
 * Sends rich HTML email alerts to today's duty member via Gmail SMTP or Resend/Brevo
 * Can run completely on its own every morning at 07:00 AM via GitHub Actions (Free)
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
function generateDutyEmailHtml({ memberName, date, estimatedBudget, notes }) {
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
  <title>Bazar Duty Reminder</title>
</head>
<body style="margin:0; padding:0; background-color:#f8fafc; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color:#1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f8fafc; padding:30px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:540px; background-color:#ffffff; border-radius:18px; overflow:hidden; box-shadow:0 10px 25px rgba(0,0,0,0.06); border:1px solid #e2e8f0;">
          <tr>
            <td style="background:linear-gradient(135deg, #059669 0%, #0d9488 100%); padding:28px 24px; text-align:center;">
              <h1 style="color:#ffffff; margin:0; font-size:24px; font-weight:800;">
                🛒 MessHishab
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
              <p style="margin:0;">This is an automated notification from <strong>MessHishab</strong>.</p>
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

async function runDailyEmailDispatcher() {
  console.log('====================================================');
  console.log('MessHishab - Automated Daily Email Duty Dispatcher');
  console.log(`Current Time (UTC): ${new Date().toISOString()}`);
  console.log('====================================================');

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  // 1. Fetch Email configuration
  let config = {
    enabled: true,
    senderEmail: process.env.GMAIL_USER || 'messhishab@gmail.com',
    senderName: 'MessHishab Manager',
    gmailAppPassword: process.env.GMAIL_APP_PASSWORD || '',
    resendApiKey: process.env.RESEND_API_KEY || '',
  };

  try {
    const configSnap = await getDoc(doc(db, 'settings', 'emailConfig'));
    if (configSnap.exists()) {
      config = { ...config, ...configSnap.data() };
      console.log('Loaded Email configuration from Firestore.');
    } else {
      console.log('No Firestore emailConfig found. Using default/environment settings.');
    }
  } catch (err) {
    console.warn('Warning: Could not fetch settings/emailConfig:', err.message);
  }

  if (!config.enabled) {
    console.log('ℹ️ Email automated alerts are disabled in Settings. Skipping execution.');
    process.exit(0);
  }

  // 2. Load all members to map emails by ID or Name
  const membersSnap = await getDocs(collection(db, 'members'));
  const membersMap = {};
  membersSnap.forEach((d) => {
    const data = d.data();
    membersMap[d.id] = data;
    if (data.name) membersMap[data.name.trim().toLowerCase()] = data;
  });

  // Calculate current date in Bangladesh Time (UTC+6)
  const now = new Date();
  const bdTimeStr = now.toLocaleString('en-US', { timeZone: 'Asia/Dhaka' });
  const bdDate = new Date(bdTimeStr);
  const year = bdDate.getFullYear();
  const month = String(bdDate.getMonth() + 1).padStart(2, '0');
  const day = String(bdDate.getDate()).padStart(2, '0');
  const todayDateStr = `${year}-${month}-${day}`;
  const monthId = `${year}-${month}`;

  console.log(`Current Bangladesh Date: ${todayDateStr} (Month: ${monthId})`);

  // 3. Fetch today's duty schedules
  const schedRef = collection(db, 'months', monthId, 'bazarSchedules');
  const snapshot = await getDocs(schedRef);

  const todayDuties = [];
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    if (data.date === todayDateStr) {
      todayDuties.push({ id: docSnap.id, ...data });
    }
  });

  console.log(`Found ${todayDuties.length} duty schedule(s) for today (${todayDateStr}).`);

  if (todayDuties.length === 0) {
    console.log('No members scheduled for market duty today. All clear!');
    process.exit(0);
  }

  // 4. Setup Transporter if Gmail App Password is provided
  let transporter = null;
  const gmailPass = config.gmailAppPassword || process.env.GMAIL_APP_PASSWORD;
  const senderEmail = config.senderEmail || process.env.GMAIL_USER;

  if (gmailPass && senderEmail) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: senderEmail,
        pass: gmailPass.replace(/\s+/g, ''),
      },
    });
    console.log(`Configured Gmail SMTP with sender: ${senderEmail}`);
  }

  let sentCount = 0;
  let alreadyNotifiedCount = 0;

  for (const duty of todayDuties) {
    if (duty.autoEmailSent) {
      console.log(`✓ [Already Sent] Member ${duty.memberName} was already emailed at ${duty.autoEmailSentAt}.`);
      alreadyNotifiedCount++;
      continue;
    }

    // Resolve member email
    let recipientEmail = duty.memberEmail;
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
    });

    console.log(`Sending automated Gmail duty alert to ${duty.memberName} (${recipientEmail})...`);

    let sendSuccess = false;

    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"${config.senderName || 'MessHishab Manager'}" <${senderEmail}>`,
          to: recipientEmail,
          subject: `🛒 [MessHishab] আজ (${duty.date}) আপনার বাজার করার দায়িত্ব রয়েছে`,
          html: emailHtml,
        });
        sendSuccess = true;
        console.log(`✓ Successfully sent email to ${recipientEmail} via Gmail SMTP!`);
      } catch (err) {
        console.error(`❌ Gmail SMTP failed for ${recipientEmail}:`, err.message);
      }
    } else if (config.resendApiKey || process.env.RESEND_API_KEY) {
      // Send via Resend
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
            subject: `🛒 [MessHishab] আজ (${duty.date}) আপনার বাজার করার দায়িত্ব রয়েছে`,
            html: emailHtml,
          }),
        });
        const data = await res.json();
        if (res.ok && data.id) {
          sendSuccess = true;
          console.log(`✓ Successfully sent email to ${recipientEmail} via Resend!`);
        } else {
          console.error(`❌ Resend failed for ${recipientEmail}:`, data.message);
        }
      } catch (err) {
        console.error(`❌ Resend error for ${recipientEmail}:`, err.message);
      }
    } else {
      console.log(`[SIMULATION MODE] Would email ${recipientEmail}:\nSubject: Bazar Duty Reminder for ${duty.date}`);
      sendSuccess = true;
    }

    if (sendSuccess) {
      try {
        const dutyDocRef = doc(db, 'months', monthId, 'bazarSchedules', duty.id);
        await updateDoc(dutyDocRef, {
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

  console.log('----------------------------------------------------');
  console.log(`Summary: ${sentCount} sent, ${alreadyNotifiedCount} already notified, total today: ${todayDuties.length}.`);
  console.log('Execution completed successfully.');
  console.log('====================================================');
  process.exit(0);
}

runDailyEmailDispatcher().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
