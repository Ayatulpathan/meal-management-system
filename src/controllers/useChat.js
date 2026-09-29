import { useState, useEffect, useCallback } from 'react';
import { chatService } from '../services/chatService';
import { useAuthContext } from '../context/AuthContext';

export const useChat = () => {
  const { user, isAdmin } = useAuthContext();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

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
      return { success: true };
    } catch (err) {
      console.error('Failed to send message:', err);
      setError(err.message || 'Failed to send message.');
      return { success: false, error: err.message };
    } finally {
      setSending(false);
    }
  }, [user, isAdmin]);

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
      return { success: true };
    } catch (err) {
      console.error('Failed to clear chat:', err);
      return { success: false, error: err.message };
    }
  }, [isAdmin]);

  return {
    messages,
    loading,
    sending,
    error,
    sendMessage,
    deleteMessage,
    clearAllMessages,
    currentUser: user,
    isAdmin,
  };
};
