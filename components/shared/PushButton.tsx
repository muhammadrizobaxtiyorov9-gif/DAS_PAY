'use client';

import { Bell, BellOff, BellRing } from 'lucide-react';
import { toast } from 'sonner';
import { usePushSubscription } from '@/hooks/usePushSubscription';

interface PushButtonProps {
  clientId?: number;
  className?: string;
  /** Compact icon-only variant (e.g. header) */
  compact?: boolean;
}

export function PushButton({ clientId, className = '', compact = false }: PushButtonProps) {
  const { supported, permission, subscribed, busy, subscribe, unsubscribe } = usePushSubscription({ clientId });

  if (!supported) return null;

  const handle = async () => {
    if (subscribed) {
      const ok = await unsubscribe();
      if (ok) toast.success('Bildirishnomalar o\'chirildi');
    } else {
      const ok = await subscribe();
      if (ok) {
        toast.success('Bildirishnomalar yoqildi');
      } else if (permission === 'denied') {
        toast.error('Brauzer sozlamalarida bildirishnomaga ruxsat bering');
      } else {
        toast.error('Yoqib bo\'lmadi. Qayta urinib ko\'ring.');
      }
    }
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={handle}
        disabled={busy}
        title={subscribed ? 'Bildirishnomalarni o\'chirish' : 'Bildirishnomalarni yoqish'}
        className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
          subscribed
            ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
            : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
        } disabled:opacity-50 ${className}`}
      >
        {subscribed ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handle}
      disabled={busy}
      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        subscribed
          ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
      } disabled:opacity-50 ${className}`}
    >
      {subscribed ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
      {subscribed ? 'Bildirishnomalar yoqilgan' : 'Bildirishnomalarni yoqish'}
    </button>
  );
}
