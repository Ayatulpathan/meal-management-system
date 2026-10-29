/**
 * MessHishab - 100% Free Autonomous Daily WhatsApp Bazar Duty Cron Dispatcher
 * Can run completely on its own 24/7 at a set time (e.g. 7:00 AM BD Time)
 * via GitHub Actions (Free) or Node Cron.
 */

import https from 'https';
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

// Normalizes BD phone number to 88017... format
export function sanitizeBDPhoneNumber(phone = '') {
  let digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('00880')) digits = digits.slice(2);
  else if (digits.startsWith('880')) { /* already 880 */ }
  else if (digits.startsWith('01') && digits.length === 11) digits = `88${digits}`;
  else if (digits.startsWith('1') && digits.length === 10) digits = `880${digits}`;
  return digits;
}

// Sends WhatsApp via CallMeBot API (100% Free)
export function sendCallMeBotWhatsApp(phone, message, apiKey) {
  return new Promise((resolve, reject) => {
    const cleanPhone = sanitizeBDPhoneNumber(phone);
    if (!cleanPhone) return resolve({ success: false, error: 'Invalid phone number' });
    const target = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;
    const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(target)}&text=${encodeURIComponent(message)}&apikey=${encodeURIComponent(apiKey)}`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, response: data });
        } else {
          resolve({ success: false, error: data || `HTTP ${res.statusCode}` });
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Generate polite message
export function constructBazarDutyMessage(schedule, messName = 'MessHishab') {
  const memberName = schedule.memberName || 'সহযোদ্ধা';
  const notesText = schedule.notes ? `📝 নোট/ফর্দ: ${schedule.notes}\n` : '';
  const budgetText = schedule.estimatedBudget > 0 ? `💵 আনুমানিক বাজেট: ৳${Number(schedule.estimatedBudget).toLocaleString('en-IN')}\n` : '';

  return (
`আসসালামু আলাইকুম ${memberName},
"${messName}" মেস থেকে জানানো হচ্ছে যে, আজ (${schedule.date}) আপনার বাজার করার শিডিউল (Bazar Duty) রয়েছে।

📅 তারিখ: ${schedule.date}
👤 দায়িত্বপ্রাপ্ত: ${memberName}
${notesText}${budgetText}
অনুগ্রহ করে মেসের দায়িত্বপ্রাপ্তদের সাথে যোগাযোগ করে বাজারের ফর্দ ও প্রয়োজনীয় টাকা সংগ্রহ করে নিবেন।

ধন্যবাদ!
— ${messName} Management`
  ).trim();
}

async function runDailyDutyDispatcher() {
  console.log('====================================================');
  console.log('MessHishab - Automated Daily WhatsApp Duty Dispatcher');
  console.log(`Current Time (UTC): ${new Date().toISOString()}`);
  console.log('====================================================');

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  // 1. Fetch WhatsApp configuration
  let config = {
    enabled: true,
    provider: 'callmebot',
    apiKey: process.env.CALLMEBOT_API_KEY || '',
  };

  try {
    const configSnap = await getDoc(doc(db, 'settings', 'whatsappConfig'));
    if (configSnap.exists()) {
      config = { ...config, ...configSnap.data() };
      console.log('Loaded WhatsApp configuration from Firestore.');
    } else {
      console.log('No Firestore whatsappConfig found. Using default/environment settings.');
    }
  } catch (err) {
    console.warn('Warning: Could not fetch settings/whatsappConfig:', err.message);
  }

  if (!config.enabled) {
    console.log('ℹ️ WhatsApp automated alerts are disabled in Settings. Skipping execution.');
    process.exit(0);
  }

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

  // 2. Fetch today's duty schedules
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

  let sentCount = 0;
  let alreadyNotifiedCount = 0;

  for (const duty of todayDuties) {
    if (duty.autoNotified) {
      console.log(`✓ [Already Sent] Member ${duty.memberName} (${duty.memberPhone}) was already alerted at ${duty.autoNotifiedAt}.`);
      alreadyNotifiedCount++;
      continue;
    }

    if (!duty.memberPhone) {
      console.warn(`⚠️ [Missing Phone] Member ${duty.memberName} has no phone number recorded.`);
      continue;
    }

    const message = constructBazarDutyMessage(duty);
    console.log(`Sending WhatsApp alert to ${duty.memberName} at ${duty.memberPhone}...`);

    let dispatchSuccess = false;
    let errorDetail = null;

    if (config.provider === 'simulation') {
      console.log(`[SIMULATION MODE] Dispatched to ${duty.memberPhone}:\n${message}`);
      dispatchSuccess = true;
    } else {
      // CallMeBot (Free Gateway)
      const apiKey = config.apiKey || process.env.CALLMEBOT_API_KEY;
      if (!apiKey) {
        console.error('❌ CallMeBot API Key is missing. Please save it in Settings.');
        continue;
      }
      try {
        const res = await sendCallMeBotWhatsApp(duty.memberPhone, message, apiKey);
        if (res.success) {
          dispatchSuccess = true;
          console.log(`✓ Successfully sent WhatsApp alert to ${duty.memberName}!`);
        } else {
          errorDetail = res.error;
          console.error(`❌ Failed to send to ${duty.memberName}:`, res.error);
        }
      } catch (err) {
        errorDetail = err.message;
        console.error(`❌ Gateway request error for ${duty.memberName}:`, err.message);
      }
    }

    if (dispatchSuccess) {
      // Update document in Firestore
      try {
        const dutyDocRef = doc(db, 'months', monthId, 'bazarSchedules', duty.id);
        await updateDoc(dutyDocRef, {
          autoNotified: true,
          autoNotifiedAt: new Date().toISOString(),
          notificationStatus: 'sent',
        });
        sentCount++;
      } catch (dbErr) {
        console.warn('Could not update Firestore autoNotified status:', dbErr.message);
      }
    }
  }

  console.log('----------------------------------------------------');
  console.log(`Summary: ${sentCount} sent, ${alreadyNotifiedCount} already notified, total today: ${todayDuties.length}.`);
  console.log('Execution completed successfully.');
  console.log('====================================================');
  process.exit(0);
}

// Execute if run directly
if (process.argv[1] && process.argv[1].endsWith('cron-whatsapp-duty.mjs')) {
  runDailyDutyDispatcher().catch((err) => {
    console.error('Fatal execution error:', err);
    process.exit(1);
  });
}
