'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, User as UserIcon, ShieldCheck, MessageCircleQuestion, X, MessageSquareText } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function CabinetFloatingChat({
  clientId,
  clientName,
}: {
  clientId: number;
  clientName: string | null;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0 && !fetching) {
      fetchMessages();
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const fetchMessages = async () => {
    setFetching(true);
    try {
      const res = await fetch('/api/cabinet/support/message', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data.messages) {
        setMessages(data.messages);
      } else {
        console.warn("Could not fetch messages:", data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/cabinet/support/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
        cache: 'no-store',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Xatolik. Server qayta ishga tushishi kerak bo\'lishi mumkin.');

      setMessages([...messages, data.message]);
      setBody('');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-4 sm:right-6 lg:right-8 w-[350px] max-w-[calc(100vw-32px)] h-[500px] max-h-[60vh] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-[#042C53] text-white p-4 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Yordam Markazi</h3>
                  <p className="text-[10px] text-blue-200">Mutaxassislarimiz bilan bog'lanish</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {fetching ? (
                <div className="flex justify-center items-center h-full">
                  <div className="w-6 h-6 border-2 border-[#185FA5] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <MessageSquareText className="w-12 h-12 mb-2 opacity-30" />
                  <p className="text-sm text-center px-4">Hozircha xabarlar yo'q. Qanday yordam bera olamiz?</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.isFromClient;
                  return (
                    <div key={msg.id} className={`flex gap-2 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto flex-row'}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-auto ${isMe ? 'bg-[#185FA5] text-white' : 'bg-gray-200 text-gray-600'}`}>
                        {isMe ? <UserIcon className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                      </div>
                      <div className={`rounded-2xl px-3 py-2 shadow-sm ${isMe ? 'bg-[#185FA5] text-white rounded-br-sm' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'}`}>
                        {!isMe && msg.admin && (
                          <div className="text-[9px] font-bold text-gray-400 mb-0.5">
                            {msg.admin.name || 'Menejer'}
                          </div>
                        )}
                        <div className="text-[13px] whitespace-pre-wrap">{msg.body}</div>
                        <div className={`text-[9px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex gap-2">
              <input
                type="text"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Xabar yozing..."
                disabled={loading}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 outline-none focus:border-[#185FA5] focus:ring-1 focus:ring-[#185FA5] transition-all text-[13px]"
              />
              <button
                type="submit"
                disabled={loading || !body.trim()}
                className="bg-[#185FA5] hover:bg-[#042C53] text-white rounded-xl w-10 h-10 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 lg:bottom-8 lg:right-8 w-14 h-14 bg-gradient-to-br from-[#042C53] to-[#185FA5] text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-900/20 z-40"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquareText className="w-6 h-6" />}
      </motion.button>
    </>
  );
}
