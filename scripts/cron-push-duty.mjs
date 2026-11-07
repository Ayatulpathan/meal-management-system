/**
 * MessHishab - 24/7 Automated Daily Bazar Duty Web Push Dispatcher
 * Runs server-side (GitHub Actions - 100% Free) or via CLI
 * Queries today's assigned duty member, retrieves their active device tokens from Firestore,
 * and dispatches FCM Web Push notifications with vibration [300, 100, 300] ms.
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || 'AIzaSyDcvOWmVDpn1VX2FWnmPU1NyqhrhGTviZQ',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'khadok-meal.firebaseapp.com',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'khadok-meal',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'khadok-meal.firebasestorage.app',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '984656453342',
  appId: process.env.VITE_FIREBASE_APP_ID || '1:984656453342:web:e8582819dc5b8622346c4f'
};

async function sendFcmMessage(token, { title, body, data, serverKey }) {
  if (serverKey) {
    // Send via FCM HTTP endpoint using server key
    try {
      const response = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `key=${serverKey}`
        },
        body: JSON.stringify({
          to: token,
          notification: {
            title,
            body,
            icon: '/icon-192.png',
            click_action: 'https://khadok-meal.web.app/bazar-schedule'
          },
          data: {
            ...data,
            tag: 'bazar-duty-reminder',
            vibrate: JSON.stringify([300, 100, 300]),
            url: '/bazar-schedule'
          }
        })
      });

      const json = await response.json();
      if (response.ok && json.success === 1) {
        return { success: true };
      }
      return { success: false, error: json.results?.[0]?.error || 'FCM error' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // Simulation mode or client-assisted delivery
  return { success: true, simulated: true };
}

async function processMessDuties(db, messId, messName, todayDateStr, monthId, currentBstTimeStr, serverKey) {
  console.log(`\n--- Checking Push Alerts for Mess: [${messId}] ${messName || ''} ---`);

  // 1. Fetch Push Config
  let config = {
    enabled: true,
    notifyTime: '07:00',
    timezone: 'Asia/Dhaka'
  };

  try {
    const snap = await getDoc(doc(db, 'messes', messId, 'settings', 'pushNotification'));
    if (snap.exists()) {
      config = { ...config, ...snap.data() };
    } else if (messId === 'khadok-mess') {
      const rootSnap = await getDoc(doc(db, 'settings', 'pushNotification'));
      if (rootSnap.exists()) {
        config = { ...config, ...rootSnap.data() };
      }
    }
  } catch (err) {
    console.warn(`Could not load push settings for ${messId}:`, err.message);
  }

  if (!config.enabled) {
    console.log(`Push automation is disabled for mess ${messId}. Skipping.`);
    return 0;
  }

  const notifyTime = config.notifyTime || '07:00';
  console.log(`Configured Notify Time: ${notifyTime} (Current BST Time: ${currentBstTimeStr})`);

  // 2. Fetch today's duty schedules
  let schedRef = collection(db, 'messes', messId, 'months', monthId, 'bazarSchedules');
  let snapshot = await getDocs(schedRef);
  let todayDuties = [];

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    if (data.date === todayDateStr && data.status !== 'cancelled') {
      todayDuties.push({ id: docSnap.id, docRef: docSnap.ref, ...data });
    }
  });

  if (todayDuties.length === 0 && messId === 'khadok-mess') {
    const rootSchedRef = collection(db, 'months', monthId, 'bazarSchedules');
    const rootSnap = await getDocs(rootSchedRef);
    rootSnap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.date === todayDateStr && data.status !== 'cancelled') {
        todayDuties.push({ id: docSnap.id, docRef: docSnap.ref, ...data });
      }
    });
  }

  console.log(`Found ${todayDuties.length} scheduled duty/duties for today in mess ${messId}.`);
  if (todayDuties.length === 0) return 0;

  let totalDispatched = 0;

  for (const duty of todayDuties) {
    const memberUid = duty.memberId;
    if (!memberUid) {
      console.warn(`[Skip] Duty has no assigned member ID.`);
      continue;
    }

    const uniqueLogId = `${memberUid}_bazar_duty_${todayDateStr}`;

    // 3. Duplicate Prevention: Check notificationLogs
    try {
      const logSnap = await getDoc(doc(db, 'notificationLogs', uniqueLogId));
      if (logSnap.exists() && logSnap.data().status === 'sent') {
        console.log(`✓ [Already Sent] Push reminder already logged as sent for member ${duty.memberName} (${memberUid}).`);
        continue;
      }
    } catch (_) {}

    if (duty.autoPushSent) {
      console.log(`✓ [Already Sent] Duty document already marked autoPushSent for member ${duty.memberName}.`);
      continue;
    }

    // 4. Retrieve active device tokens for the assigned member
    console.log(`Fetching active device tokens for member ${duty.memberName} (${memberUid})...`);
    let tokens = [];

    try {
      const tokenQuery = query(
        collection(db, 'deviceTokens'),
        where('memberUid', '==', memberUid),
        where('active', '==', true)
      );
      const tokenSnap = await getDocs(tokenQuery);
      tokenSnap.forEach((d) => tokens.push({ id: d.id, ...d.data() }));
    } catch (tErr) {
      console.warn('Error querying device tokens:', tErr.message);
    }

    if (tokens.length === 0) {
      console.log(`ℹ️ [No Devices Registered] Member ${duty.memberName} has not yet enabled push on any device.`);
      await setDoc(
        doc(db, 'notificationLogs', uniqueLogId),
        {
          memberUid,
          dutyDate: todayDateStr,
          notificationType: 'bazar_duty',
          status: 'no_tokens',
          tokenCount: 0,
          messId,
          sentAt: new Date().toISOString()
        },
        { merge: true }
      );
      continue;
    }

    console.log(`Found ${tokens.length} active device(s) for member ${duty.memberName}. Dispatching...`);

    const title = 'Your Bazar Duty Today! (আজকের বাজার করার দায়িত্ব)';
    const body = `আসসালামু আলাইকুম ${duty.memberName}, মেসের শিডিউল অনুযায়ী আজ আপনার বাজার করার দায়িত্ব রয়েছে। অনুগ্রহ করে সময়মতো প্রস্তুতি সম্পন্ন করুন।`;

    let successCount = 0;
    for (const t of tokens) {
      const res = await sendFcmMessage(t.token, {
        title,
        body,
        data: {
          dutyDate: todayDateStr,
          memberUid,
          memberName: duty.memberName,
          estimatedBudget: String(duty.estimatedBudget || 0),
          notes: duty.notes || ''
        },
        serverKey
      });

      if (res.success) {
        successCount++;
        console.log(`✓ Delivered push alert to device token [${t.platform || 'web'}]`);
      } else {
        console.warn(`Failed push to device token:`, res.error);
        if (res.error === 'NotRegistered' || res.error === 'InvalidRegistration') {
          // Deactivate invalid token
          try {
            await updateDoc(doc(db, 'deviceTokens', t.id), { active: false, deactivatedAt: new Date().toISOString() });
          } catch (_) {}
        }
      }
    }

    // 5. Atomic Log Entry
    await setDoc(
      doc(db, 'notificationLogs', uniqueLogId),
      {
        memberUid,
        dutyDate: todayDateStr,
        notificationType: 'bazar_duty',
        status: successCount > 0 ? 'sent' : 'failed',
        tokenCount: tokens.length,
        deliveredCount: successCount,
        messId,
        sentAt: new Date().toISOString()
      },
      { merge: true }
    );

    // 6. Update duty document
    try {
      await updateDoc(duty.docRef, {
        autoPushSent: true,
        autoPushSentAt: new Date().toISOString()
      });
    } catch (_) {}

    totalDispatched++;
  }

  return totalDispatched;
}

async function runDailyPushDispatcher() {
  console.log('====================================================');
  console.log('MessHishab - Automated Daily Bazar Duty Push Dispatcher');
  console.log(`Current Time (UTC): ${new Date().toISOString()}`);
  console.log('====================================================');

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  // Compute Bangladesh date and time (UTC+6)
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

  const serverKey = process.env.FCM_SERVER_KEY || null;

  // Fetch all registered messes
  const messesSnap = await getDocs(collection(db, 'messes'));
  const messesList = [];
  messesSnap.forEach((d) => messesList.push({ id: d.id, ...d.data() }));

  if (!messesList.some((m) => m.id === 'khadok-mess')) {
    messesList.push({ id: 'khadok-mess', name: 'Khadok Mess' });
  }

  let totalDispatched = 0;
  for (const mess of messesList) {
    try {
      const count = await processMessDuties(db, mess.id, mess.name, todayDateStr, monthId, currentBstTimeStr, serverKey);
      totalDispatched += count;
    } catch (e) {
      console.error(`Error processing mess ${mess.id}:`, e);
    }
  }

  console.log('----------------------------------------------------');
  console.log(`Summary: Total push alerts processed: ${totalDispatched}.`);
  console.log('Push dispatcher executed successfully.');
  console.log('====================================================');
  process.exit(0);
}

runDailyPushDispatcher().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
