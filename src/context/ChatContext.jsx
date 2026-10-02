import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { chatService } from '../services/chatService';
import { useAuthContext } from './AuthContext';

const ChatContext = createContext(null);

const STORAGE_LAST_READ_KEY = 'mms_last_read_chat_time';

export const ChatProvider = ({ children }) => {
  const { user, isAdmin } = useAuthContext();
  const location = useLocation();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const currentUserId = user?.uid || user?.memberId || 'user';
  const currentUserName = user?.displayName || '';

  // Get stored last read timestamp
  const getStoredLastReadTime = () => {
    const key = `${STORAGE_LAST_READ_KEY}_${currentUserId}`;
    const stored = localStorage.getItem(key);
    return stored ? Number(stored) : Date.now();
  };

  const [lastReadTime, setLastReadTime] = useState(getStoredLastReadTime);

  // Mark all messages as read
  const markAsRead = useCallback(() => {
    const now = Date.now();
    setLastReadTime(now);
    const key = `${STORAGE_LAST_READ_KEY}_${currentUserId}`;
    localStorage.setItem(key, String(now));
  }, [currentUserId]);

  // Subscribe to real-time messages
  useEffect(() => {
    setLoading(true);
    const unsubscribe = chatService.subscribeMessages((incomingMessages) => {
      setMessages(incomingMessages);
      setLoading(false);
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // When user visits /chat, automatically mark messages as read
  useEffect(() => {
    if (location.pathname === '/chat') {
      markAsRead();
    }
  }, [location.pathname, markAsRead, messages.length]);

  // Calculate unread count (messages sent by others after lastReadTime)
  const isCurrentlyOnChatPage = location.pathname === '/chat';

  const unreadCount = isCurrentlyOnChatPage
    ? 0
    : messages.filter((msg) => {
        const msgTime = new Date(msg.createdAt).getTime();
        const isFromOther = msg.senderId !== currentUserId && msg.senderName !== currentUserName;
        return isFromOther && msgTime > lastReadTime;
      }).length;

  const sendMessage = useCallback(async (text) => {
    if (!text || !text.trim()) return { success: false, error: 'Message cannot be empty.' };

    setSending(true);
    setError(null);
    try {
      const senderName = user?.displayName || (isAdmin ? 'Administrator' : 'Member');
      const senderId = user?.uid || user?.memberId || 'user';
      const senderRole = user?.role || (isAdmin ? 'admin' : 'member');

      await chatService.sendMessage({
        text: text.trim(),
        senderId,
        senderName,
        senderRole,
      });

      // Update our own read time on sending
      markAsRead();
      return { success: true };
    } catch (err) {
      console.error('Failed to send message:', err);
      setError(err.message || 'Failed to send message.');
      return { success: false, error: err.message };
    } finally {
      setSending(false);
    }
  }, [user, isAdmin, markAsRead]);

  const deleteMessage = useCallback(async (messageId) => {
    try {
      await chatService.deleteMessage(messageId);
      return { success: true };
    } catch (err) {
      console.error('Failed to delete message:', err);
      return { success: false, error: err.message };
    }
  }, []);

  const clearAllMessages = useCallback(async () => {
    if (!isAdmin) return { success: false, error: 'Only admins can clear chat.' };
    try {
      await chatService.clearAllMessages();
      markAsRead();
      return { success: true };
    } catch (err) {
      console.error('Failed to clear chat:', err);
      return { success: false, error: err.message };
    }
  }, [isAdmin, markAsRead]);

  return (
    <ChatContext.Provider
      value={{
        messages,
        loading,
        sending,
        error,
        unreadCount,
        markAsRead,
        sendMessage,
        deleteMessage,
        clearAllMessages,
        currentUser: user,
        isAdmin,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};
