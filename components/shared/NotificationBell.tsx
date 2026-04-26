'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, Check, Filter, Loader2 } from 'lucide-react';

interface NotificationItem {
  id: number;
  userId: number | null;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

const TYPE_LABEL: Record<string, string> = {
  lead: 'Ariza',
  shipment: 'Yuk',
  invoice: 'Hisob',
  sla: 'SLA',
  driver: 'Haydovchi',
  system: 'Tizim',
};

const TYPE_COLOR: Record<string, string> = {
  lead: 'bg-emerald-100 text-emerald-700',
  shipment: 'bg-blue-100 text-blue-700',
  invoice: 'bg-amber-100 text-amber-700',
  sla: 'bg-red-100 text-red-700',
  driver: 'bg-indigo-100 text-indigo-700',
  system: 'bg-slate-100 text-slate-700',
};

const FILTERS: Array<{ key: string | null; label: string }> = [
  { key: null, label: 'Hammasi' },
  { key: 'lead', label: 'Arizalar' },
  { key: 'shipment', label: 'Yuklar' },
  { key: 'invoice', label: 'Hisoblar' },
  { key: 'sla', label: 'SLA' },
];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return 'hozirgina';
  const min = Math.floor(diff / 60_000);
  if (min < 60) return `${min} daq`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} soat`;
  const d = Math.floor(h / 24);
  return `${d} kun`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = filter ? `/api/notifications?type=${filter}` : '/api/notifications';
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setUnread(data.unreadCount || 0);
      }
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // Initial load + 30s poll for unread count when closed
  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      const res = await fetch('/api/notifications?unread=1&limit=1', { cache: 'no-store' });
      if (cancelled) return;
      if (res.ok) {
        const data = await res.json();
        setUnread(data.unreadCount || 0);
      }
    };
    tick();
    const t = setInterval(tick, 30_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  // Re-fetch full list when popover opens or filter changes
  useEffect(() => {
    if (open) load();
  }, [open, load]);

  // Click-away
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const markOne = async (id: number) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnread((u) => Math.max(0, u - 1));
    fetch('/api/notifications', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ids: [id] }),
    }).catch(() => null);
  };

  const markAll = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ all: true }),
    }).catch(() => null);
  };

  return (
    <div ref={popoverRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
        title="Bildirishnomalar"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[360px] max-w-[92vw] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
          <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">Bildirishnomalar</p>
              <p className="text-xs text-slate-400">{unread} o&apos;qilmagan</p>
            </div>
            <button
              type="button"
              onClick={markAll}
              disabled={unread === 0}
              className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-40"
            >
              <Check className="h-3 w-3" /> Hammasini o&apos;qildim
            </button>
          </header>

          <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-100 px-2 py-2">
            <Filter className="h-3 w-3 shrink-0 text-slate-400" />
            {FILTERS.map((f) => (
              <button
                key={f.key ?? 'all'}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  (filter ?? null) === f.key
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="max-h-[480px] overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center gap-2 py-6 text-xs text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Yuklanmoqda…
              </div>
            )}
            {!loading && items.length === 0 && (
              <div className="px-4 py-12 text-center text-xs text-slate-400">
                Bildirishnomalar yo&apos;q
              </div>
            )}
            {items.map((n) => {
              const Inner = (
                <div
                  className={`flex gap-3 px-4 py-3 transition-colors ${
                    n.isRead ? 'bg-white' : 'bg-blue-50/40'
                  } hover:bg-slate-50`}
                >
                  <span
                    className={`mt-0.5 inline-flex h-5 shrink-0 items-center rounded-full px-2 text-[10px] font-semibold uppercase ${
                      TYPE_COLOR[n.type] ?? TYPE_COLOR.system
                    }`}
                  >
                    {TYPE_LABEL[n.type] ?? n.type}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-sm ${
                        n.isRead ? 'font-medium text-slate-700' : 'font-semibold text-slate-900'
                      }`}
                    >
                      {n.title}
                    </p>
                    <p className="line-clamp-2 text-xs text-slate-500">{n.message}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-400">
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>
                  {!n.isRead && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-500" />}
                </div>
              );

              const handleClick = () => {
                if (!n.isRead) markOne(n.id);
                setOpen(false);
              };

              return n.link ? (
                <Link key={n.id} href={n.link} onClick={handleClick}>
                  {Inner}
                </Link>
              ) : (
                <button
                  key={n.id}
                  type="button"
                  onClick={handleClick}
                  className="block w-full text-left"
                >
                  {Inner}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
