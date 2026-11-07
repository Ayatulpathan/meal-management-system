/**
 * MessHishab - Firebase Cloud Messaging Service Worker
 * Handles background push notifications when website is closed or in background.
 * Supports Android vibration [300, 100, 300] and desktop notifications on Windows/Chrome/Edge.
 */

/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

// Initialize Firebase inside the Service Worker
firebase.initializeApp({
  apiKey: 'AIzaSyDcvOWmVDpn1VX2FWnmPU1NyqhrhGTviZQ',
  authDomain: 'khadok-meal.firebaseapp.com',
  projectId: 'khadok-meal',
  storageBucket: 'khadok-meal.firebasestorage.app',
  messagingSenderId: '984656453342',
  appId: '1:984656453342:web:e8582819dc5b8622346c4f'
});

const messaging = firebase.messaging();

// Activate immediately upon registration
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Background message handler (triggered when browser is closed or running in background)
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const title = payload.notification?.title || payload.data?.title || 'Your Bazar Duty Today!';
  const body =
    payload.notification?.body ||
    payload.data?.body ||
    payload.data?.message ||
    'You are assigned bazar duty today. Please complete your duty on time.';

  const notificationOptions = {
    body,
    icon: payload.notification?.icon || payload.data?.icon || '/icon-192.png',
    badge: '/badge-72.png',
    tag: payload.data?.tag || 'bazar-duty-reminder',
    renotify: true,
    // Vibration pattern: 300ms buzz, 100ms pause, 300ms buzz (Android compatible)
    vibrate: [300, 100, 300],
    data: {
      url: payload.data?.url || '/bazar-schedule',
      dutyDate: payload.data?.dutyDate || payload.data?.date || '',
      memberUid: payload.data?.memberUid || '',
      timestamp: Date.now()
    },
    actions: [
      { action: 'view_schedule', title: 'View Schedule (শিডিউল দেখুন)' }
    ]
  };

  return self.registration.showNotification(title, notificationOptions);
});

// Handle notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetPath = event.notification.data?.url || '/bazar-schedule';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a tab is already open with the app, focus it and navigate
      for (const client of clientList) {
        if ('focus' in client) {
          if (client.url.includes(targetPath) || client.url.includes('/bazar')) {
            return client.focus();
          }
        }
      }
      // If no tab is open or focused, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetPath);
      }
    })
  );
});
