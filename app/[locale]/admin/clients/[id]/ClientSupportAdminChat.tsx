'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, User as UserIcon, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function ClientSupportAdminChat({
  clientId,
  initialMessages,
}: {
  clientId: number;
  initialMessages: any[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/admin/client-support/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Xatolik');

      setMessages([...messages, data.message]);
      setBody('');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 absolute inset-0">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <p>Mijoz bilan yozishmalar yo'q.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = !msg.isFromClient;
            return (
              <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isMe ? 'bg-[#185FA5] text-white' : 'bg-gray-200 text-gray-600'}`}>
                  {isMe ? <ShieldCheck className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                </div>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 shadow-sm ${isMe ? 'bg-[#185FA5] text-white rounded-tr-none' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'}`}>
                  {isMe && msg.admin && (
                    <div className="text-[10px] font-bold text-blue-200 mb-1">
                      {msg.admin.name || msg.admin.username}
                    </div>
                  )}
                  <div className="text-sm whitespace-pre-wrap">{msg.body}</div>
                  <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex gap-2">
        <input
          type="text"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Javob yozish..."
          disabled={loading}
          className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-[#185FA5] focus:ring-1 focus:ring-[#185FA5] transition-all text-sm"
        />
        <button
          type="submit"
          disabled={loading || !body.trim()}
          className="bg-[#185FA5] hover:bg-[#042C53] text-white rounded-xl px-4 py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-sm"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
