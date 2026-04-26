'use client';

import { useState } from 'react';
import { confirmReceive } from '@/app/actions/receive';
import { CheckCircle2, MapPin, Package, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  shipment: {
    trackingCode: string;
    senderName: string;
    receiverName: string;
    origin: string;
    destination: string;
    weight: number | null;
  };
  token: string;
  locale: string;
}

export function ReceiveConfirmClient({ shipment, token, locale }: Props) {
  const [signature, setSignature] = useState(shipment.receiverName ?? '');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (signature.trim().length < 2) {
      toast.error("Iltimos, ism familiyangizni to'liq kiriting");
      return;
    }
    setLoading(true);
    try {
      // Try to capture geo (best-effort)
      const geo: { lat: number; lng: number } | undefined = await new Promise((resolve) => {
        if (!('geolocation' in navigator)) return resolve(undefined);
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => resolve(undefined),
          { enableHighAccuracy: true, timeout: 5000 },
        );
      });

      const res = await confirmReceive(shipment.trackingCode, token, signature.trim(), geo);
      if ('ok' in res) {
        setDone(true);
        toast.success('Tasdiqlandi! Rahmat.');
      } else {
        toast.error(`Xatolik: ${res.error}`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <main className="min-h-screen bg-emerald-50 py-12 px-4">
        <div className="mx-auto max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-emerald-500" />
          <h1 className="text-xl font-bold text-slate-800">Rahmat!</h1>
          <p className="mt-2 text-sm text-slate-500">
            Yuk qabul qilinganligi tasdiqlandi. {shipment.trackingCode}
          </p>
          <a
            href={`/${locale}/tracking/${shipment.trackingCode}`}
            className="mt-6 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Yuk holatini ko'rish
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="mx-auto max-w-md space-y-4">
        <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 p-6 text-white shadow-xl">
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8" />
            <div>
              <p className="text-xs uppercase tracking-wider text-blue-200">Yuk qabul tasdiqi</p>
              <p className="font-mono text-lg font-bold">{shipment.trackingCode}</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 rounded-2xl bg-white p-5 shadow-sm">
          <Row label="Yuboruvchi" value={shipment.senderName} />
          <Row label="Qabul qiluvchi" value={shipment.receiverName} />
          <Row icon={<MapPin className="h-3 w-3 text-emerald-500" />} label="Jo'nash" value={shipment.origin} />
          <Row icon={<MapPin className="h-3 w-3 text-rose-500" />} label="Manzil" value={shipment.destination} />
          {shipment.weight && <Row label="Vazn" value={`${shipment.weight} kg`} />}
        </div>

        <div className="space-y-3 rounded-2xl bg-white p-5 shadow-sm">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Imzo (Ism Familiyangiz)
            </span>
            <input
              type="text"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder="Ism Familiya"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-blue-400"
            />
          </label>

          <button
            type="button"
            onClick={submit}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-4 text-base font-bold text-white shadow-lg transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
            Yukni qabul qildim
          </button>

          <p className="text-center text-xs text-slate-400">
            Bosish bilan yukni qabul qilganingizni tasdiqlaysiz va raqamli imzo qo'yiladi
          </p>
        </div>
      </div>
    </main>
  );
}

function Row({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2 last:border-0 last:pb-0">
      <span className="flex items-center gap-1 text-xs uppercase tracking-wider text-slate-400">
        {icon}
        {label}
      </span>
      <span className="text-right text-sm font-semibold text-slate-800">{value}</span>
    </div>
  );
}
