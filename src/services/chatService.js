import {
  db,
  collection,
  doc,
  getDocs,
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

const LOCAL_STORAGE_KEY = 'mms_chat_messages';

const getLocalMessages = () => {
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!stored) {
    const initial = [
      {
        id: 'msg_001',
        text: 'Welcome to the Mess Group Chat! 👋 All members can communicate here in real-time.',
        senderId: 'admin',
        senderName: 'Administrator',
        senderRole: 'admin',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: 'msg_002',
        text: 'Please make sure to check today\'s grocery list and deposit updates. 🛒🍲',
        senderId: 'admin',
        senderName: 'Administrator',
        senderRole: 'admin',
        createdAt: new Date(Date.now() - 1800000).toISOString(),
      },
    ];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
};

const saveLocalMessages = (messages) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(messages));
};

export const chatService = {
  /**
   * Subscribes to real-time chat messages
   */
  subscribeMessages(callback) {
    if (!isFirebaseConfigured()) {
      const load = () => callback(getLocalMessages());
      load();
      window.addEventListener('storage', load);
      return () => window.removeEventListener('storage', load);
    }

    try {
      const messagesRef = collection(db, 'chatMessages');
      const q = query(messagesRef, orderBy('createdAt', 'asc'), limit(200));

      return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          let createdAtStr = new Date().toISOString();
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
            createdAt: createdAtStr,
          };
        });
        callback(messages);
      }, (error) => {
        console.error('Error in chat real-time listener:', error);
        // Fallback to local storage on error
        callback(getLocalMessages());
      });
    } catch (err) {
      console.error('Chat subscription init error:', err);
      callback(getLocalMessages());
      return () => {};
    }
  },

  /**
   * Send a new chat message
   */
  async sendMessage(messageData) {
    const { text, senderId, senderName, senderRole } = messageData;
    if (!text || !text.trim()) {
      throw new Error('Message text cannot be empty.');
    }

    const payload = {
      text: text.trim(),
      senderId: senderId || 'user',
      senderName: senderName || 'Member',
      senderRole: senderRole || 'member',
      createdAt: isFirebaseConfigured() ? serverTimestamp() : new Date().toISOString(),
    };

    if (!isFirebaseConfigured()) {
      const messages = getLocalMessages();
      const newMsg = {
        id: `msg_${Date.now()}`,
        ...payload,
        createdAt: new Date().toISOString(),
      };
      messages.push(newMsg);
      saveLocalMessages(messages);
      window.dispatchEvent(new Event('storage'));
      return newMsg;
    }

    try {
      const messagesRef = collection(db, 'chatMessages');
      const docRef = await addDoc(messagesRef, payload);
      return { id: docRef.id, ...payload };
    } catch (err) {
      console.error('Error sending chat message to Firebase:', err);
      // Fallback to local storage
      const messages = getLocalMessages();
      const newMsg = {
        id: `msg_${Date.now()}`,
        ...payload,
        createdAt: new Date().toISOString(),
      };
      messages.push(newMsg);
      saveLocalMessages(messages);
      window.dispatchEvent(new Event('storage'));
      return newMsg;
    }
  },

  /**
   * Delete a chat message
   */
  async deleteMessage(messageId) {
    if (!messageId) return;

    if (!isFirebaseConfigured()) {
      const messages = getLocalMessages();
      const filtered = messages.filter(m => m.id !== messageId);
      saveLocalMessages(filtered);
      window.dispatchEvent(new Event('storage'));
      return;
    }

    try {
      const docRef = doc(db, 'chatMessages', messageId);
      await deleteDoc(docRef);
    } catch (err) {
      console.error('Error deleting chat message:', err);
      const messages = getLocalMessages();
      const filtered = messages.filter(m => m.id !== messageId);
      saveLocalMessages(filtered);
      window.dispatchEvent(new Event('storage'));
    }
  },

  /**
   * Clear all chat messages (Admin)
   */
  async clearAllMessages() {
    if (!isFirebaseConfigured()) {
      saveLocalMessages([]);
      window.dispatchEvent(new Event('storage'));
      return;
    }

    try {
      const messagesRef = collection(db, 'chatMessages');
      const snapshot = await getDocs(messagesRef);
      const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deletePromises);
    } catch (err) {
      console.error('Error clearing messages:', err);
      saveLocalMessages([]);
      window.dispatchEvent(new Event('storage'));
    }
  }
};
