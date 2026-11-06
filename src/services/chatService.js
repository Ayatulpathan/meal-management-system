import {
  db,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
  isFirebaseConfigured
} from './firebase';
import {
  getMessCollection,
  getMessDoc,
  getRootCollection,
  getRootDoc,
  addMessDocData,
  deleteMessDocData
} from './dbPaths';
import { DEFAULT_MESS_ID, getActiveMessId } from '../models/messModel';

const CHAT_STORAGE_KEY_PREFIX = 'mms_chat_messages_';

const getLocalMessages = (messId = DEFAULT_MESS_ID) => {
  const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;
  const key = `${CHAT_STORAGE_KEY_PREFIX}${targetMessId}`;
  const stored = localStorage.getItem(key);
  if (!stored) {
    if (targetMessId === DEFAULT_MESS_ID) {
      const legacy = localStorage.getItem('mms_chat_messages');
      if (legacy) {
        try { return JSON.parse(legacy); } catch (e) { return []; }
      }
    }
    const initial = [
      {
        id: 'msg_welcome',
        text: 'Welcome to MessHishab Chat! Discuss meals, schedules, and costs here in real time.',
        senderId: 'system',
        senderName: 'Mess Bot',
        senderRole: 'admin',
        messId: targetMessId,
        createdAt: new Date().toISOString(),
      }
    ];
    localStorage.setItem(key, JSON.stringify(initial));
    return initial;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
};

const saveLocalMessages = (messages, messId = DEFAULT_MESS_ID) => {
  const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;
  const key = `${CHAT_STORAGE_KEY_PREFIX}${targetMessId}`;
  localStorage.setItem(key, JSON.stringify(messages));
};

export const chatService = {
  /**
   * Subscribes to real-time chat messages for a specific mess
   * Path: messes/{messId}/chatMessages
   */
  subscribeMessages(callback, messId) {
    const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;

    if (!isFirebaseConfigured()) {
      const load = () => callback(getLocalMessages(targetMessId));
      load();
      window.addEventListener('storage', load);
      return () => window.removeEventListener('storage', load);
    }

    try {
      const messagesRef = getMessCollection(targetMessId, 'chatMessages');
      const q = query(messagesRef, orderBy('createdAt', 'asc'), limit(250));

      return onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const messages = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            let createdAtStr = data.createdAtIso || new Date().toISOString();
            if (data.createdAt) {
              if (data.createdAt.toDate && typeof data.createdAt.toDate === 'function') {
                createdAtStr = data.createdAt.toDate().toISOString();
              } else if (data.createdAt.seconds) {
                createdAtStr = new Date(data.createdAt.seconds * 1000).toISOString();
              } else if (typeof data.createdAt === 'string') {
                createdAtStr = data.createdAt;
              }
            }
            return {
              id: docSnap.id,
              text: data.text || '',
              senderId: data.senderId || 'unknown',
              senderName: data.senderName || 'Member',
              senderRole: data.senderRole || 'member',
              messId: targetMessId,
              createdAt: createdAtStr,
            };
          });
          messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          saveLocalMessages(messages, targetMessId);
          callback(messages);
          return;
        }

        // If Khadok Mess and empty, fallback to root
        if (targetMessId === DEFAULT_MESS_ID) {
          getDocs(query(getRootCollection('chatMessages'), orderBy('createdAt', 'asc'), limit(250)))
            .then((rootSnap) => {
              if (!rootSnap.empty) {
                const rootMessages = rootSnap.docs.map((docSnap) => {
                  const data = docSnap.data();
                  let createdAtStr = data.createdAtIso || new Date().toISOString();
                  if (data.createdAt) {
                    if (data.createdAt.toDate && typeof data.createdAt.toDate === 'function') {
                      createdAtStr = data.createdAt.toDate().toISOString();
                    } else if (data.createdAt.seconds) {
                      createdAtStr = new Date(data.createdAt.seconds * 1000).toISOString();
                    } else if (typeof data.createdAt === 'string') {
                      createdAtStr = data.createdAt;
                    }
                  }
                  return {
                    id: docSnap.id,
                    text: data.text || '',
                    senderId: data.senderId || 'unknown',
                    senderName: data.senderName || 'Member',
                    senderRole: data.senderRole || 'member',
                    messId: DEFAULT_MESS_ID,
                    createdAt: createdAtStr,
                  };
                });
                rootMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                saveLocalMessages(rootMessages, DEFAULT_MESS_ID);
                callback(rootMessages);
              } else {
                callback(getLocalMessages(targetMessId));
              }
            })
            .catch(() => callback(getLocalMessages(targetMessId)));
          return;
        }

        callback(getLocalMessages(targetMessId));
      }, (error) => {
        console.error('Error in chat real-time listener:', error);
        callback(getLocalMessages(targetMessId));
      });
    } catch (err) {
      console.error('Chat subscription init error:', err);
      callback(getLocalMessages(targetMessId));
      return () => {};
    }
  },

  /**
   * Send a new chat message to a specific mess
   */
  async sendMessage(messageData, messId) {
    const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;
    const { text, senderId, senderName, senderRole } = messageData;
    if (!text || !text.trim()) {
      throw new Error('Message text cannot be empty.');
    }

    const payload = {
      text: text.trim(),
      senderId: senderId || 'user',
      senderName: senderName || 'Member',
      senderRole: senderRole || 'member',
      messId: targetMessId,
      createdAt: isFirebaseConfigured() ? serverTimestamp() : new Date().toISOString(),
      createdAtIso: new Date().toISOString(),
    };

    if (!isFirebaseConfigured()) {
      const messages = getLocalMessages(targetMessId);
      const newMsg = {
        id: `msg_${Date.now()}`,
        ...payload,
        createdAt: new Date().toISOString(),
      };
      messages.push(newMsg);
      saveLocalMessages(messages, targetMessId);
      window.dispatchEvent(new Event('storage'));
      return newMsg;
    }

    try {
      const docRef = await addMessDocData(targetMessId, ['chatMessages'], payload);
      return { id: docRef.id, ...payload, createdAt: payload.createdAtIso };
    } catch (err) {
      console.error('Error sending chat message to Firebase:', err);
      throw new Error('Failed to send chat message.');
    }
  },

  /**
   * Delete a chat message
   */
  async deleteMessage(messageId, messId) {
    if (!messageId) return;
    const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;

    if (!isFirebaseConfigured()) {
      const messages = getLocalMessages(targetMessId);
      const filtered = messages.filter(m => m.id !== messageId);
      saveLocalMessages(filtered, targetMessId);
      window.dispatchEvent(new Event('storage'));
      return;
    }

    try {
      await deleteMessDocData(targetMessId, ['chatMessages', messageId]);
    } catch (err) {
      console.error('Error deleting chat message:', err);
      const messages = getLocalMessages(targetMessId);
      const filtered = messages.filter(m => m.id !== messageId);
      saveLocalMessages(filtered, targetMessId);
      window.dispatchEvent(new Event('storage'));
    }
  },

  /**
   * Clear all chat messages for a specific mess
   */
  async clearAllMessages(messId) {
    const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;

    if (!isFirebaseConfigured()) {
      saveLocalMessages([], targetMessId);
      window.dispatchEvent(new Event('storage'));
      return;
    }

    try {
      const messagesRef = getMessCollection(targetMessId, 'chatMessages');
      const snapshot = await getDocs(messagesRef);
      const deletePromises = snapshot.docs.map(d => deleteMessDocData(targetMessId, ['chatMessages', d.id]));
      await Promise.all(deletePromises);
      saveLocalMessages([], targetMessId);
    } catch (err) {
      console.error('Error clearing messages:', err);
      saveLocalMessages([], targetMessId);
      window.dispatchEvent(new Event('storage'));
    }
  }
};
