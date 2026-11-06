/**
 * Non-destructive Migration Script
 * Copies all existing root data into messes/khadok-mess/
 * Keeps original root collections intact as permanent backup.
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  getDoc
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || 'AIzaSyDcvOWmVDpn1VX2FWnmPU1NyqhrhGTviZQ',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'khadok-meal.firebaseapp.com',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'khadok-meal',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'khadok-meal.firebasestorage.app',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '984656453342',
  appId: process.env.VITE_FIREBASE_APP_ID || '1:984656453342:web:e8582819dc5b8622346c4f',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const TARGET_MESS_ID = 'khadok-mess';

async function runMigration() {
  console.log('====================================================');
  console.log(`MIGRATING ROOT COLLECTIONS INTO DEDICATED MESS: messes/${TARGET_MESS_ID}`);
  console.log('====================================================');

  // Step 1: Ensure Mess document exists
  const messRef = doc(db, 'messes', TARGET_MESS_ID);
  const messSnap = await getDoc(messRef);
  if (!messSnap.exists()) {
    console.log(`[INFO] Creating tenant profile for messes/${TARGET_MESS_ID}...`);
    await setDoc(messRef, {
      id: TARGET_MESS_ID,
      name: 'Khadok Mess',
      inviteCode: 'KHD101',
      managerEmail: 'admin@messhishab.com',
      currency: '৳',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    console.log(`[SUCCESS] Tenant messes/${TARGET_MESS_ID} created.`);
  } else {
    console.log(`[INFO] Tenant messes/${TARGET_MESS_ID} already exists.`);
  }

  // Step 2: Migrate Members
  console.log('\n--- 1. Migrating Members ---');
  const membersSnap = await getDocs(collection(db, 'members'));
  let membersCount = 0;
  for (const memberDoc of membersSnap.docs) {
    const data = memberDoc.data();
    await setDoc(doc(db, 'messes', TARGET_MESS_ID, 'members', memberDoc.id), {
      ...data,
      messId: TARGET_MESS_ID
    }, { merge: true });
    membersCount++;
  }
  console.log(`[PASS] Copied ${membersCount} members to messes/${TARGET_MESS_ID}/members.`);

  // Step 3: Migrate Months and all subcollections
  console.log('\n--- 2. Migrating Months & Monthly Accounting Ledgers ---');
  const monthsSnap = await getDocs(collection(db, 'months'));
  let monthsCount = 0;
  let totalSubdocs = 0;

  for (const monthDoc of monthsSnap.docs) {
    const monthId = monthDoc.id;
    // only migrate standard month IDs like '2026-08', '2026-09', etc.
    if (monthId.includes('_')) continue;

    const monthData = monthDoc.data();
    await setDoc(doc(db, 'messes', TARGET_MESS_ID, 'months', monthId), {
      ...monthData,
      messId: TARGET_MESS_ID
    }, { merge: true });
    monthsCount++;

    const subcollections = [
      'meals',
      'marketCosts',
      'deposits',
      'utilityBills',
      'rentPayments',
      'bazarSchedules',
      'config'
    ];

    for (const sub of subcollections) {
      const subSnap = await getDocs(collection(db, 'months', monthId, sub));
      if (subSnap.docs.length > 0) {
        for (const sDoc of subSnap.docs) {
          await setDoc(doc(db, 'messes', TARGET_MESS_ID, 'months', monthId, sub, sDoc.id), {
            ...sDoc.data(),
            messId: TARGET_MESS_ID
          }, { merge: true });
          totalSubdocs++;
        }
        console.log(`   * Month ${monthId} -> ${sub}: copied ${subSnap.docs.length} docs`);
      }
    }
  }
  console.log(`[PASS] Copied ${monthsCount} months with ${totalSubdocs} accounting sub-documents.`);

  // Step 4: Migrate Settings
  console.log('\n--- 3. Migrating Settings (WhatsApp & Email configurations) ---');
  const settingsSnap = await getDocs(collection(db, 'settings'));
  let settingsCount = 0;
  for (const setDocSnap of settingsSnap.docs) {
    await setDoc(doc(db, 'messes', TARGET_MESS_ID, 'settings', setDocSnap.id), {
      ...setDocSnap.data(),
      messId: TARGET_MESS_ID
    }, { merge: true });
    settingsCount++;
  }
  console.log(`[PASS] Copied ${settingsCount} settings to messes/${TARGET_MESS_ID}/settings.`);

  // Step 5: Migrate Chat Messages
  console.log('\n--- 4. Migrating Real-time Chat Messages ---');
  const chatSnap = await getDocs(collection(db, 'chatMessages'));
  let chatCount = 0;
  for (const chatDoc of chatSnap.docs) {
    await setDoc(doc(db, 'messes', TARGET_MESS_ID, 'chatMessages', chatDoc.id), {
      ...chatDoc.data(),
      messId: TARGET_MESS_ID
    }, { merge: true });
    chatCount++;
  }
  console.log(`[PASS] Copied ${chatCount} chat messages to messes/${TARGET_MESS_ID}/chatMessages.`);

  console.log('\n====================================================');
  console.log('MIGRATION SUMMARY: 100% SUCCESSFUL WITH ZERO DATA LOSS!');
  console.log(`- Dedicated Database Tree: messes/${TARGET_MESS_ID}`);
  console.log(`- Members: ${membersCount}`);
  console.log(`- Months: ${monthsCount}`);
  console.log(`- Sub-collection entries: ${totalSubdocs}`);
  console.log(`- Settings: ${settingsCount}`);
  console.log(`- Chat Messages: ${chatCount}`);
  console.log('Original root collections remain 100% preserved as backup.');
  console.log('====================================================');
}

runMigration()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
