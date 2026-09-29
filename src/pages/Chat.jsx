import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  MessageSquare, 
  Trash2, 
  Sparkles, 
  ShieldCheck, 
  User, 
  Clock, 
  CheckCheck,
  AlertCircle,
  Smile,
  RefreshCw
} from 'lucide-react';
import { useChat } from '../controllers/useChat';
import { useAuthContext } from '../context/AuthContext';
import { formatTimeDisplay, formatDateDisplay } from '../utils/dateUtils';
import { Button } from '../components/common/Button';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Loader } from '../components/common/Loader';

export const Chat = () => {
  const { user, isAdmin } = useAuthContext();
  const { messages, loading, sending, sendMessage, deleteMessage, clearAllMessages } = useChat();

  const [inputMessage, setInputMessage] = useState('');
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [deletingMsgId, setDeletingMsgId] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || sending) return;

    const textToSend = inputMessage;
    setInputMessage('');
    const res = await sendMessage(textToSend);
    if (!res.success) {
      setInputMessage(textToSend); // restore on error
    } else {
      setTimeout(scrollToBottom, 50);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return <Loader message="Connecting to real-time mess chat..." fullScreen />;
  }

  const currentUserId = user?.uid || user?.memberId || 'user';
  const currentUserName = user?.displayName || '';

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] max-h-[850px] bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
      {/* Chat Room Header */}
      <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-wide">
                Mess Community Chat
              </h2>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Live Realtime
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Instant group communication for dining members & management
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && messages.length > 0 && (
            <button
              onClick={() => setIsClearModalOpen(true)}
              title="Clear all messages (Admin)"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Stream Container */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto custom-scrollbar bg-slate-50/50 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-3 shadow-inner">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Messages Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Start the discussion! Send grocery alerts, meal count inquiries, or mess updates to everyone.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMine = msg.senderId === currentUserId || (msg.senderName && msg.senderName === currentUserName);
            const isMsgAdmin = msg.senderRole === 'admin';
            const formattedTime = formatTimeDisplay(msg.createdAt);

            return (
              <div
                key={msg.id || index}
                className={`flex gap-3 max-w-[85%] sm:max-w-[75%] ${isMine ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* Avatar Icon */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 shadow-sm ${
                    isMine
                      ? 'bg-emerald-600 text-white'
                      : isMsgAdmin
                      ? 'bg-amber-100 text-amber-900 border border-amber-200'
                      : 'bg-teal-100 text-teal-900 border border-teal-200'
                  }`}
                >
                  {(msg.senderName || 'M').charAt(0).toUpperCase()}
                </div>

                {/* Message Bubble Content */}
                <div className="flex flex-col group">
                  {/* Sender Header info */}
                  <div className={`flex items-center gap-1.5 mb-1 text-[11px] ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <span className="font-semibold text-slate-700">
                      {isMine ? 'You' : msg.senderName}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded-md font-bold uppercase ${
                        isMsgAdmin
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200/80 text-slate-700'
                      }`}
                    >
                      {isMsgAdmin ? 'Admin' : 'Member'}
                    </span>
                  </div>

                  {/* Bubble */}
                  <div
                    className={`relative p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm transition-all ${
                      isMine
                        ? 'bg-emerald-600 text-white rounded-tr-none'
                        : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.text}</p>

                    {/* Footer Time and Actions */}
                    <div className={`flex items-center gap-1.5 mt-1 text-[10px] ${isMine ? 'text-emerald-200 justify-end' : 'text-slate-400 justify-end'}`}>
                      <span>{formattedTime}</span>
                      {isMine && <CheckCheck className="w-3 h-3 text-emerald-300" />}

                      {/* Delete option for admin or sender */}
                      {(isAdmin || isMine) && (
                        <button
                          onClick={() => deleteMessage(msg.id)}
                          title="Delete message"
                          className={`opacity-0 group-hover:opacity-100 transition-opacity ml-1.5 ${
                            isMine ? 'text-rose-200 hover:text-white' : 'text-slate-400 hover:text-rose-600'
                          }`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Form */}
      <form onSubmit={handleSend} className="p-3.5 bg-white border-t border-slate-200 shrink-0 flex items-center gap-2.5">
        <input
          ref={inputRef}
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message to mess members... (Press Enter to send)"
          className="flex-1 px-4 py-2.5 bg-slate-100/90 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
        />

        <Button
          type="submit"
          variant="primary"
          size="md"
          loading={sending}
          disabled={!inputMessage.trim()}
          icon={Send}
          className="px-4.5 py-2.5 rounded-xl shadow-md font-semibold shrink-0"
        >
          Send
        </Button>
      </form>

      {/* Clear Chat Confirmation Modal */}
      <ConfirmDialog
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={async () => {
          await clearAllMessages();
          setIsClearModalOpen(false);
        }}
        title="Clear Entire Chat History"
        message="Are you sure you want to permanently delete all messages in the mess community chat? This action cannot be undone."
        confirmText="Clear All Messages"
        variant="danger"
      />
    </div>
  );
};
