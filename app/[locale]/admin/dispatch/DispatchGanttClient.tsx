'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Truck as TruckIcon,
  CalendarRange,
  AlertTriangle,
  Filter,
} from 'lucide-react';

interface Truck {
  id: number;
  plateNumber: string;
  model: string;
  status: string;
  driverName: string | null;
}

interface Bar {
  truckId: number;
  shipmentId: number;
  trackingCode: string;
  origin: string;
  destination: string;
  status: string;
  startMs: number;
  endMs: number;
}

interface Props {
  trucks: Truck[];
  bars: Bar[];
  startMs: number;
  days: number;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-slate-400',
  confirmed: 'bg-indigo-500',
  arrived_at_loading: 'bg-sky-500',
  documents_ready: 'bg-cyan-500',
  loaded: 'bg-teal-500',
  in_transit: 'bg-amber-500',
  delivered: 'bg-emerald-500',
  unloaded: 'bg-emerald-600',
  cancelled: 'bg-red-400',
};

const TRUCK_STATUS_LABEL: Record<string, string> = {
  available: "Bo'sh",
  assigned: 'Tayinlangan',
  in_transit: "Yo'lda",
  at_station: 'Stansiyada',
  returning: 'Qaytmoqda',
  needs_repair: 'Ta\'mirda',
};

const TRUCK_STATUS_COLOR: Record<string, string> = {
  available: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  assigned: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  in_transit: 'bg-amber-50 text-amber-700 ring-amber-200',
  at_station: 'bg-sky-50 text-sky-700 ring-sky-200',
  returning: 'bg-purple-50 text-purple-700 ring-purple-200',
  needs_repair: 'bg-red-50 text-red-700 ring-red-200',
};

const ROW_H = 56;
const HEADER_H = 56;
const LEFT_W = 240;
const DAY_PX = 100;
const DAY_MS = 24 * 3600_000;

export function DispatchGanttClient({ trucks, bars, startMs, days }: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'busy' | 'free' | 'conflict'>('all');

  const startDate = useMemo(() => new Date(startMs), [startMs]);
  const dayHeaders = useMemo(() => {
    const out: Date[] = [];
    for (let i = 0; i < days; i++) out.push(new Date(startMs + i * DAY_MS));
    return out;
  }, [startMs, days]);

  const endMs = startMs + days * DAY_MS;

  // Group bars per truck and detect conflicts (overlapping bars on same truck)
  const barsByTruck = useMemo(() => {
    const map = new Map<number, Bar[]>();
    for (const b of bars) {
      const list = map.get(b.truckId) ?? [];
      list.push(b);
      map.set(b.truckId, list);
    }
    return map;
  }, [bars]);

  const conflictTruckIds = useMemo(() => {
    const set = new Set<number>();
    for (const [tid, list] of barsByTruck) {
      const sorted = [...list].sort((a, b) => a.startMs - b.startMs);
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].startMs < sorted[i - 1].endMs) {
          set.add(tid);
          break;
        }
      }
    }
    return set;
  }, [barsByTruck]);

  const visibleTrucks = useMemo(() => {
    return trucks.filter((t) => {
      const list = barsByTruck.get(t.id) ?? [];
      const hasOverlap = list.some((b) => b.endMs > startMs && b.startMs < endMs);
      if (filter === 'busy') return hasOverlap;
      if (filter === 'free') return !hasOverlap;
      if (filter === 'conflict') return conflictTruckIds.has(t.id);
      return true;
    });
  }, [trucks, filter, barsByTruck, conflictTruckIds, startMs, endMs]);

  const totalWidth = LEFT_W + days * DAY_PX;
  const todayMs = Date.now();
  const todayLeft =
    todayMs >= startMs && todayMs <= endMs
      ? LEFT_W + ((todayMs - startMs) / DAY_MS) * DAY_PX
      : null;

  const shift = (deltaDays: number) => {
    const next = new Date(startMs + deltaDays * DAY_MS);
    const iso = next.toISOString().slice(0, 10);
    router.push(`?start=${iso}`);
  };

  const fmtRange = `${startDate.toLocaleDateString('uz-UZ')} – ${new Date(
    endMs - DAY_MS,
  ).toLocaleDateString('uz-UZ')}`;

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
            <CalendarRange className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Dispatching Gantt</h1>
            <p className="text-sm text-slate-500">
              Avtomobillar bandligi · {fmtRange}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => shift(-7)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => router.push('?')}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Bugun
          </button>
          <button
            type="button"
            onClick={() => shift(7)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-slate-400" />
        {(['all', 'busy', 'free', 'conflict'] as const).map((f) => (
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
            {f === 'all'
              ? `Hammasi (${trucks.length})`
              : f === 'busy'
                ? "Band"
                : f === 'free'
                  ? "Bo'sh"
                  : `Konflikt (${conflictTruckIds.size})`}
          </button>
        ))}
        <div className="ml-auto flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
          <Legend color="bg-amber-500" label="Yo'lda" />
          <Legend color="bg-teal-500" label="Yuklangan" />
          <Legend color="bg-indigo-500" label="Tasdiqlandi" />
          <Legend color="bg-emerald-500" label="Yetkazildi" />
          <Legend color="bg-red-400" label="Bekor" />
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div style={{ width: totalWidth, minWidth: '100%' }} className="relative">
          {/* Header row */}
          <div
            className="sticky top-0 z-20 grid border-b border-slate-200 bg-slate-50"
            style={{ gridTemplateColumns: `${LEFT_W}px repeat(${days}, ${DAY_PX}px)`, height: HEADER_H }}
          >
            <div className="flex items-center border-r border-slate-200 px-4 text-xs font-bold uppercase tracking-wider text-slate-500">
              Avtomobil / Haydovchi
            </div>
            {dayHeaders.map((d, i) => {
              const isWeekend = d.getDay() === 0 || d.getDay() === 6;
              const isToday =
                d.toDateString() === new Date().toDateString();
              return (
                <div
                  key={i}
                  className={`flex flex-col items-center justify-center border-r border-slate-200 text-[10px] font-semibold uppercase tracking-wider ${
                    isToday
                      ? 'bg-blue-50 text-blue-700'
                      : isWeekend
                        ? 'bg-slate-100/80 text-slate-400'
                        : 'text-slate-500'
                  }`}
                >
                  <span>{d.toLocaleDateString('uz-UZ', { weekday: 'short' })}</span>
                  <span className="mt-0.5 text-base font-bold tracking-tight text-slate-900">
                    {d.getDate()}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Today vertical line */}
          {todayLeft !== null && (
            <div
              className="pointer-events-none absolute top-0 z-10 w-px bg-blue-500/60"
              style={{ left: todayLeft, height: HEADER_H + visibleTrucks.length * ROW_H }}
            >
              <span className="absolute -top-1 -translate-x-1/2 rounded-full bg-blue-500 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                Bugun
              </span>
            </div>
          )}

          {/* Truck rows */}
          {visibleTrucks.length === 0 && (
            <div className="px-6 py-12 text-center text-sm text-slate-400">
              Bu filtrda avtomobil yo&apos;q
            </div>
          )}

          {visibleTrucks.map((t, idx) => {
            const list = (barsByTruck.get(t.id) ?? []).filter(
              (b) => b.endMs > startMs && b.startMs < endMs,
            );
            const conflict = conflictTruckIds.has(t.id);
            return (
              <div
                key={t.id}
                className="relative grid border-b border-slate-100 last:border-b-0"
                style={{
                  gridTemplateColumns: `${LEFT_W}px repeat(${days}, ${DAY_PX}px)`,
                  height: ROW_H,
                }}
              >
                {/* Left cell: truck info */}
                <div
                  className={`flex items-center gap-2 border-r border-slate-200 px-3 ${
                    idx % 2 ? 'bg-slate-50/40' : 'bg-white'
                  }`}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <TruckIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {t.plateNumber}
                      </p>
                      {conflict && (
                        <AlertTriangle
                          className="h-3.5 w-3.5 text-red-500"
                          aria-label="Konflikt"
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase ring-1 ring-inset ${
                          TRUCK_STATUS_COLOR[t.status] ??
                          'bg-slate-100 text-slate-600 ring-slate-200'
                        }`}
                      >
                        {TRUCK_STATUS_LABEL[t.status] ?? t.status}
                      </span>
                      <span className="truncate text-[10px] text-slate-400">
                        {t.driverName ?? "Driver yo'q"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Day cells background */}
                {dayHeaders.map((d, i) => {
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  return (
                    <div
                      key={i}
                      className={`border-r border-slate-100 ${
                        isWeekend ? 'bg-slate-50/40' : ''
                      } ${idx % 2 ? 'bg-slate-50/30' : ''}`}
                    />
                  );
                })}

                {/* Bars */}
                {list.map((b) => {
                  const startClamp = Math.max(b.startMs, startMs);
                  const endClamp = Math.min(b.endMs, endMs);
                  const left = LEFT_W + ((startClamp - startMs) / DAY_MS) * DAY_PX;
                  const width = Math.max(((endClamp - startClamp) / DAY_MS) * DAY_PX - 4, 24);
                  const color = STATUS_COLORS[b.status] ?? 'bg-slate-400';
                  return (
                    <Link
                      key={`${b.shipmentId}-${b.startMs}`}
                      href={`/uz/admin/shipments/${b.shipmentId}`}
                      className={`group absolute top-2 flex items-center gap-1.5 overflow-hidden rounded-md px-2 text-[11px] font-semibold text-white shadow-sm transition-all hover:shadow-lg hover:brightness-110 ${color}`}
                      style={{ left, width, height: ROW_H - 16 }}
                      title={`${b.trackingCode}: ${b.origin} → ${b.destination} (${b.status})`}
                    >
                      <span className="truncate font-mono">{b.trackingCode}</span>
                      <span className="truncate text-white/85">
                        {b.origin} → {b.destination}
                      </span>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {conflictTruckIds.size > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">{conflictTruckIds.size} ta avtomobilda konflikt aniqlandi</p>
              <p className="text-xs text-red-600/80">
                Bir avtomobil bir vaqtning o&apos;zida bir nechta yukga biriktirilgan. Yuklarni qayta taqsimlang.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`h-2.5 w-2.5 rounded-sm ${color}`} />
      {label}
    </span>
  );
}
