'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Send, Search, Loader2, MessageCircle } from 'lucide-react';

interface Thread {
  userId: number;
  name: string;
  role: string;
  lastMessage: string | null;
  lastAt: string | null;
  unread: number;
}

interface Message {
  id: number;
  fromUserId: number;
  toUserId: number;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export function ChatClient({ currentUserId }: { currentUserId: number }) {
  const sp = useSearchParams();
  const router = useRouter();
  const initialPartner = Number(sp.get('with')) || null;

  const [threads, setThreads] = useState<Thread[]>([]);
  const [activePartner, setActivePartner] = useState<number | null>(initialPartner);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadThreads = useCallback(async () => {
    const res = await fetch('/api/chat/threads', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      setThreads(data.threads || []);
    }
    setLoadingThreads(false);
  }, []);

  useEffect(() => {
    loadThreads();
    const t = setInterval(loadThreads, 15_000);
    return () => clearInterval(t);
  }, [loadThreads]);

  const loadMessages = useCallback(async (partnerId: number) => {
    setLoadingMsgs(true);
    try {
      const res = await fetch(`/api/chat/messages?withUserId=${partnerId}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        // Refresh thread list to clear unread
        loadThreads();
      }
    } finally {
      setLoadingMsgs(false);
    }
  }, [loadThreads]);

  useEffect(() => {
    if (activePartner) loadMessages(activePartner);
  }, [activePartner, loadMessages]);

  // Poll active conversation every 5s
  useEffect(() => {
    if (!activePartner) return;
    const t = setInterval(() => loadMessages(activePartner), 5_000);
    return () => clearInterval(t);
  }, [activePartner, loadMessages]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const handleSelect = (partnerId: number) => {
    setActivePartner(partnerId);
    router.replace(`/uz/admin/chat?with=${partnerId}`, { scroll: false });
  };

  const handleSend = async () => {
    if (!activePartner || !draft.trim()) return;
    setSending(true);
    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ toUserId: activePartner, body: draft.trim() }),
      });
      if (res.ok) {
        setDraft('');
        await loadMessages(activePartner);
      }
    } finally {
      setSending(false);
    }
  };

  const filtered = threads.filter((t) =>
    search ? t.name.toLowerCase().includes(search.toLowerCase()) : true,
  );
  const partner = threads.find((t) => t.userId === activePartner);

  return (
    <div className="grid h-[calc(100vh-160px)] grid-cols-1 gap-4 lg:grid-cols-[320px,1fr]">
      <aside className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-100 p-3">
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Qidiruv..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
        </header>
        <div className="flex-1 overflow-y-auto">
          {loadingThreads ? (
            <p className="py-8 text-center text-xs text-slate-400">Yuklanmoqda…</p>
          ) : filtered.length === 0 ? (
            <p className="px-4 py-12 text-center text-xs text-slate-400">Foydalanuvchilar topilmadi</p>
          ) : (
            filtered.map((t) => (
              <button
                key={t.userId}
                type="button"
                onClick={() => handleSelect(t.userId)}
                className={`flex w-full items-center gap-3 px-3 py-3 text-left transition-colors ${
                  activePartner === t.userId ? 'bg-blue-50' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-sm font-bold uppercase text-white">
                  {t.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-slate-800">{t.name}</p>
                    <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-500">
                      {t.role}
                    </span>
                  </div>
                  {t.lastMessage && (
                    <p className="truncate text-xs text-slate-500">{t.lastMessage}</p>
                  )}
                </div>
                {t.unread > 0 && (
                  <span className="ml-2 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {t.unread}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </aside>

      <section className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
        {!activePartner ? (
          <div className="flex flex-1 flex-col items-center justify-center text-slate-400">
            <MessageCircle className="mb-3 h-10 w-10" />
            <p className="text-sm">Suhbatni boshlash uchun foydalanuvchini tanlang</p>
          </div>
        ) : (
          <>
            <header className="flex items-center gap-3 border-b border-slate-100 p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-sm font-bold uppercase text-white">
                {partner?.name.charAt(0) ?? '?'}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">{partner?.name ?? '—'}</p>
                <p className="text-[11px] uppercase tracking-wider text-slate-400">{partner?.role ?? ''}</p>
              </div>
            </header>

            <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto bg-slate-50 p-4">
              {loadingMsgs && messages.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-xs text-slate-400">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Yuklanmoqda…
                </div>
              ) : messages.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-400">Hali xabar yo'q</p>
              ) : (
                messages.map((m) => {
                  const mine = m.fromUserId === currentUserId;
                  return (
                    <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                          mine
                            ? 'rounded-br-sm bg-blue-600 text-white'
                            : 'rounded-bl-sm bg-white text-slate-800'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{m.body}</p>
                        <p className={`mt-0.5 text-[10px] ${mine ? 'text-blue-200' : 'text-slate-400'}`}>
                          {new Date(m.createdAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <footer className="border-t border-slate-100 p-3">
              <div className="flex items-end gap-2">
                <textarea
                  rows={1}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Xabar yozing..."
                  className="max-h-32 flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-blue-400"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={sending || !draft.trim()}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md transition-colors hover:bg-blue-700 disabled:opacity-40"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </footer>
          </>
        )}
      </section>
    </div>
  );
}
