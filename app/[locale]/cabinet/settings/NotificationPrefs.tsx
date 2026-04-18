'use client';

import { useState } from 'react';
import { Bell, Mail, Save } from 'lucide-react';
import { updateNotificationPrefs } from '@/app/actions/notification-prefs';

interface Props {
  initial: {
    notifyStatusChange: boolean;
    notifyEta: boolean;
    notifyInvoices: boolean;
    notifyPromo: boolean;
    notifyEmail: string | null;
  };
  hasTelegram: boolean;
}

export function NotificationPrefs({ initial, hasTelegram }: Props) {
  const [prefs, setPrefs] = useState({
    notifyStatusChange: initial.notifyStatusChange,
    notifyEta: initial.notifyEta,
    notifyInvoices: initial.notifyInvoices,
    notifyPromo: initial.notifyPromo,
    notifyEmail: initial.notifyEmail || '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await updateNotificationPrefs({
        ...prefs,
        notifyEmail: prefs.notifyEmail || null,
      });
      setMessage({ type: 'ok', text: 'Saqlandi' });
    } catch (err) {
      setMessage({ type: 'err', text: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!hasTelegram && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          Telegram hisobingiz ulanmagan. Push bildirishnomalari uchun botimizga /start buyrug'ini yuboring.
        </div>
      )}

      <Toggle
        label="Yuk holati o'zgarganda"
        description="Tracking yangilanganda Telegram orqali xabar"
        checked={prefs.notifyStatusChange}
        onChange={(v) => setPrefs({ ...prefs, notifyStatusChange: v })}
      />
      <Toggle
        label="ETA o'zgarganda"
        description="Yetkazish muddati qayta hisoblanganda xabar"
        checked={prefs.notifyEta}
        onChange={(v) => setPrefs({ ...prefs, notifyEta: v })}
      />
      <Toggle
        label="Invoys va to'lovlar"
        description="Yangi hisob-faktura yoki to'lov eslatmasi"
        checked={prefs.notifyInvoices}
        onChange={(v) => setPrefs({ ...prefs, notifyInvoices: v })}
      />
      <Toggle
        label="Aksiya va yangiliklar"
        description="DasPay-dan marketing xabarlari"
        checked={prefs.notifyPromo}
        onChange={(v) => setPrefs({ ...prefs, notifyPromo: v })}
      />

      <div className="border-t pt-4">
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          <Mail className="mr-1 inline h-3 w-3" /> Email (ixtiyoriy)
        </label>
        <input
          type="email"
          value={prefs.notifyEmail}
          onChange={(e) => setPrefs({ ...prefs, notifyEmail: e.target.value })}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#185FA5] focus:outline-none"
          placeholder="you@example.com"
        />
        <p className="mt-1 text-[11px] text-slate-400">
          Kiritilsa, muhim bildirishnomalar email orqali ham yuboriladi.
        </p>
      </div>

      {message && (
        <div
          className={`rounded-lg p-2 text-xs ${
            message.type === 'ok'
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-lg bg-[#185FA5] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#0A3D6E] disabled:opacity-50"
      >
        <Save className="h-4 w-4" />
        {saving ? 'Saqlanmoqda...' : 'Saqlash'}
      </button>
    </form>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/50 p-3 transition-colors hover:bg-slate-50">
      <div className="flex-1">
        <div className="text-sm font-semibold text-slate-800">{label}</div>
        <div className="mt-0.5 text-xs text-slate-500">{description}</div>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <div
        className={`relative mt-1 h-6 w-11 flex-shrink-0 rounded-full transition-colors ${
          checked ? 'bg-[#185FA5]' : 'bg-slate-300'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-[22px]' : 'translate-x-0.5'
          }`}
        />
      </div>
    </label>
  );
}
