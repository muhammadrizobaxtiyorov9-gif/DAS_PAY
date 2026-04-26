'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Filter, Clock, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Alert {
  id: number;
  kind: string;
  entityType: string;
  entityId: number;
  title: string;
  message: string;
  severity: number;
  status: string;
  createdAt: string;
  resolvedAt: string | null;
}

const KIND_LABEL: Record<string, string> = {
  gps_lost: 'GPS yo\'q',
  long_stop: 'Uzoq to\'xtash',
  off_route: 'Yo\'ldan chetga chiqish',
  late_eta: 'ETA kechikishi',
};

const KIND_ICON: Record<string, React.ReactNode> = {
  gps_lost: <MapPin className="h-4 w-4 text-red-500" />,
  long_stop: <Clock className="h-4 w-4 text-amber-500" />,
  off_route: <AlertTriangle className="h-4 w-4 text-orange-500" />,
  late_eta: <Clock className="h-4 w-4 text-rose-500" />,
};

export function AnomaliesClient({ initialAlerts }: { initialAlerts: Alert[] }) {
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);
  const [filter, setFilter] = useState<'open' | 'resolved' | 'all'>('open');

  const filtered = alerts.filter((a) =>
    filter === 'all' ? true : filter === 'open' ? a.status === 'open' : a.status !== 'open',
  );

  const resolve = async (id: number) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'resolved', resolvedAt: new Date().toISOString() } : a)),
    );
    const res = await fetch(`/api/anomalies/${id}/resolve`, { method: 'POST' });
    if (!res.ok) {
      toast.error("Hal qilib bo'lmadi");
      // Revert
      setAlerts(initialAlerts);
    }
  };

  const [checking, setChecking] = useState(false);
  const triggerCheck = async () => {
    setChecking(true);
    try {
      const res = await fetch('/api/anomalies/check', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        toast.success(`Tekshirildi: ${data.checked}, ${data.created} yangi alert`);
        window.location.reload();
      } else {
        toast.error("Tekshirib bo'lmadi");
      }
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Anomaliyalar</h1>
          <p className="text-sm text-slate-500">GPS, geofence va ETA buzilishlari</p>
        </div>
        <button
          type="button"
          onClick={triggerCheck}
          disabled={checking}
          className="rounded-lg bg-slate-700 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
        >
          {checking ? 'Tekshirilmoqda…' : 'Hozir tekshirish'}
        </button>
      </header>

      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-slate-400" />
        {(['open', 'resolved', 'all'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              filter === f
                ? 'bg-blue-100 text-blue-700'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {f === 'open' ? 'Ochiq' : f === 'resolved' ? 'Hal qilingan' : 'Hammasi'}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-400">
            Anomaliyalar yo&apos;q
          </div>
        ) : (
          filtered.map((a) => {
            const sev =
              a.severity === 3
                ? 'border-red-200 bg-red-50'
                : a.severity === 2
                  ? 'border-amber-200 bg-amber-50'
                  : 'border-slate-200 bg-white';
            return (
              <div key={a.id} className={`rounded-2xl border p-4 ${sev}`}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{KIND_ICON[a.kind] ?? <AlertTriangle className="h-4 w-4 text-slate-500" />}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
                        {KIND_LABEL[a.kind] ?? a.kind}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(a.createdAt).toLocaleString('uz-UZ')}
                      </span>
                      {a.status !== 'open' && (
                        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                          <CheckCircle2 className="h-3 w-3" /> Hal qilindi
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{a.title}</p>
                    <p className="text-xs text-slate-600">{a.message}</p>
                    <div className="mt-2 flex items-center gap-2">
                      {a.entityType === 'shipment' && (
                        <Link
                          href={`/uz/admin/shipments/${a.entityId}`}
                          className="text-xs font-medium text-blue-600 hover:underline"
                        >
                          Yukni ochish →
                        </Link>
                      )}
                      {a.status === 'open' && (
                        <button
                          type="button"
                          onClick={() => resolve(a.id)}
                          className="ml-auto rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                        >
                          Hal qilindi
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
