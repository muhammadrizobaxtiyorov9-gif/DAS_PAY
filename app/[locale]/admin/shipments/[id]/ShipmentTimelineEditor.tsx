'use client';

import { useState, useTransition, useEffect, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import {
  Clock,
  MapPin,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Send,
  User,
} from 'lucide-react';
import { addShipmentEvent, deleteShipmentEvent } from '@/app/actions/admin';

const LazyEventLocationPicker = lazy(() => import('./EventLocationPicker'));

function MapPickerLoader() {
  return (
    <div className="h-[220px] w-full bg-slate-100 animate-pulse flex items-center justify-center rounded-lg border border-slate-200">
      <MapPin className="text-slate-400 w-6 h-6" />
    </div>
  );
}

function EventMapPicker(props: {
  lat: string;
  lng: string;
  location: string;
  onLatChange: (v: string) => void;
  onLngChange: (v: string) => void;
  onLocationChange: (v: string) => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return <MapPickerLoader />;
  return (
    <Suspense fallback={<MapPickerLoader />}>
      <LazyEventLocationPicker {...props} />
    </Suspense>
  );
}

interface TimelineEvent {
  status: string | { uz?: string; ru?: string; en?: string };
  location?: string;
  date?: string;
  note?: string;
  lat?: number;
  lng?: number;
  addedBy?: string;
  addedAt?: string;
}

interface Props {
  shipmentId: number;
  trackingCode: string;
  currentStatus: string;
  events: TimelineEvent[];
  hasClientTelegram: boolean;
}

const STATUS_PRESETS = [
  { key: 'processing', uz: 'Qayta ishlanmoqda', ru: 'В обработке', en: 'Processing' },
  { key: 'in_transit', uz: "Yo'lda", ru: 'В пути', en: 'In transit' },
  { key: 'customs', uz: 'Bojxonada', ru: 'На таможне', en: 'At customs' },
  { key: 'warehouse', uz: 'Omborxonada', ru: 'На складе', en: 'At warehouse' },
  { key: 'out_for_delivery', uz: 'Yetkazish uchun chiqdi', ru: 'Выдан на доставку', en: 'Out for delivery' },
  { key: 'delivered', uz: 'Yetkazildi', ru: 'Доставлено', en: 'Delivered' },
];

function resolveStatus(
  status: TimelineEvent['status'],
  lang: 'uz' | 'ru' | 'en' = 'uz',
): string {
  if (typeof status === 'string') return status;
  return status?.[lang] || status?.uz || status?.en || '—';
}

export function ShipmentTimelineEditor({
  shipmentId,
  trackingCode,
  currentStatus,
  events,
  hasClientTelegram,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [preset, setPreset] = useState<string>('in_transit');
  const [customUz, setCustomUz] = useState('');
  const [customRu, setCustomRu] = useState('');
  const [customEn, setCustomEn] = useState('');
  const [location, setLocation] = useState('');
  const [lat, setLat] = useState<string>('');
  const [lng, setLng] = useState<string>('');
  const [note, setNote] = useState('');
  const [updateTopLevel, setUpdateTopLevel] = useState(true);
  const [notifyClient, setNotifyClient] = useState(true);

  function resetForm() {
    setCustomUz('');
    setCustomRu('');
    setCustomEn('');
    setLocation('');
    setLat('');
    setLng('');
    setNote('');
  }

  function chosenStatusLabels() {
    if (preset === 'custom') {
      return { uz: customUz, ru: customRu, en: customEn };
    }
    const p = STATUS_PRESETS.find((s) => s.key === preset);
    return p ? { uz: p.uz, ru: p.ru, en: p.en } : null;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const labels = chosenStatusLabels();
    if (!labels || !labels.uz || !labels.ru || !labels.en) {
      setError("Status nomi (uz/ru/en) to'liq to'ldirilmagan.");
      return;
    }
    if (!location.trim()) {
      setError('Joylashuv maydoni majburiy.');
      return;
    }

    const latNum = lat ? parseFloat(lat) : null;
    const lngNum = lng ? parseFloat(lng) : null;
    if ((lat && isNaN(latNum!)) || (lng && isNaN(lngNum!))) {
      setError("Koordinatalar noto'g'ri formatda.");
      return;
    }

    startTransition(async () => {
      const res = await addShipmentEvent(shipmentId, {
        statusUz: labels.uz,
        statusRu: labels.ru,
        statusEn: labels.en,
        location: location.trim(),
        lat: latNum,
        lng: lngNum,
        note: note.trim() || undefined,
        updateTopLevelStatus: updateTopLevel && preset !== 'custom' ? preset : null,
        notifyClient,
      });
      if (res.success) {
        const notifyMsg = notifyClient
          ? res.notified
            ? ' Mijozga Telegram bildirishnoma yuborildi.'
            : ' (Mijozga bildirishnoma yuborilmadi — Telegram ulanmagan.)'
          : '';
        setSuccess(`Yangi status qo'shildi.${notifyMsg}`);
        resetForm();
        router.refresh();
      } else {
        setError(res.error || 'Xatolik yuz berdi');
      }
    });
  }

  function handleDelete(index: number) {
    if (!confirm('Ushbu voqeani o\'chirishni tasdiqlaysizmi?')) return;
    startTransition(async () => {
      const res = await deleteShipmentEvent(shipmentId, index);
      if (res.success) {
        router.refresh();
      } else {
        setError(res.error || 'Xatolik yuz berdi');
      }
    });
  }




  const sorted = [...events].reverse();

  return (
    <div className="space-y-6">
      {/* Add event form */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Plus className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Yangi voqea qo&apos;shish</h3>
            <p className="text-xs text-slate-500">
              Yuk holatini yangilang — mijoz avtomatik Telegram orqali xabardor qilinadi.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
              Holat
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {STATUS_PRESETS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPreset(p.key)}
                  className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                    preset === p.key
                      ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {p.uz}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPreset('custom')}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                  preset === 'custom'
                    ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                ✏️ Maxsus
              </button>
            </div>
          </div>

          {preset === 'custom' && (
            <div className="grid gap-2 sm:grid-cols-3">
              <input
                value={customUz}
                onChange={(e) => setCustomUz(e.target.value)}
                placeholder="Status (UZ)"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <input
                value={customRu}
                onChange={(e) => setCustomRu(e.target.value)}
                placeholder="Статус (RU)"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <input
                value={customEn}
                onChange={(e) => setCustomEn(e.target.value)}
                placeholder="Status (EN)"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
              Joylashuv
            </label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Xaritadan tanlang yoki qo'lda kiriting..."
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
              📍 Xaritadan joylashuvni tanlash
            </label>
            <EventMapPicker
              lat={lat}
              lng={lng}
              location={location}
              onLatChange={setLat}
              onLngChange={setLng}
              onLocationChange={setLocation}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
              Izoh (ixtiyoriy)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Qo'shimcha ma'lumot, jumladan tasdiqlovchi hujjat raqami va hokazo."
              className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 rounded-lg bg-slate-50 px-3 py-2">
            <label className="inline-flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={updateTopLevel}
                onChange={(e) => setUpdateTopLevel(e.target.checked)}
                disabled={preset === 'custom'}
                className="rounded border-slate-300"
              />
              Yuk umumiy holatini ham yangilash
            </label>
            <label className="inline-flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={notifyClient}
                onChange={(e) => setNotifyClient(e.target.checked)}
                className="rounded border-slate-300"
              />
              Mijozga Telegram orqali xabar berish
              {!hasClientTelegram && (
                <span className="text-[10px] font-semibold text-amber-600">
                  (mijoz hali ulanmagan)
                </span>
              )}
            </label>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
            </div>
          )}
          {success && (
            <div className="flex items-start gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> {success}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-[#185FA5] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#042C53] disabled:opacity-60"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Voqeani qo&apos;shish
          </button>
        </form>
      </div>

      {/* Timeline */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Yuk tarixi ({events.length})
            </h3>
            <p className="text-xs text-slate-500">
              {trackingCode} · joriy holat: <b>{currentStatus}</b>
            </p>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            Hali biror voqea yozilmagan. Yuqoridagi forma orqali birinchi statusni qo&apos;shing.
          </div>
        ) : (
          <ol className="relative space-y-4 border-l-2 border-slate-100 pl-6">
            {sorted.map((ev, reversedIdx) => {
              const originalIdx = events.length - 1 - reversedIdx;
              return (
                <li key={originalIdx} className="relative">
                  <span className="absolute -left-[29px] top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#185FA5] shadow">
                    <span className="h-2 w-2 rounded-full bg-white" />
                  </span>
                  <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-slate-800">
                          {resolveStatus(ev.status)}
                        </div>
                        {ev.location && (
                          <div className="mt-0.5 inline-flex items-center gap-1 text-xs text-slate-600">
                            <MapPin className="h-3 w-3" /> {ev.location}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDelete(originalIdx)}
                        disabled={isPending}
                        className="rounded-md p-1 text-slate-400 opacity-60 hover:bg-red-50 hover:text-red-600 hover:opacity-100"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {ev.note && (
                      <div className="mt-2 rounded-md bg-white px-2 py-1.5 text-xs text-slate-600 ring-1 ring-slate-200">
                        {ev.note}
                      </div>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                      {ev.date && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {ev.date}
                        </span>
                      )}
                      {typeof ev.lat === 'number' && typeof ev.lng === 'number' && (
                        <span className="font-mono">
                          {ev.lat.toFixed(3)}, {ev.lng.toFixed(3)}
                        </span>
                      )}
                      {ev.addedBy && (
                        <span className="inline-flex items-center gap-1">
                          <User className="h-3 w-3" /> {ev.addedBy}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
