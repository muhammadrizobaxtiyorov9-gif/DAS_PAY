'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  CheckSquare,
  Square,
  Trash2,
  Loader2,
  X,
  Navigation,
  Edit2,
  Clock,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { bulkShipmentAction, deleteShipment } from '@/app/actions/admin';
import { SHIPMENT_STATUSES, shipmentStatusMeta, ShipmentStatusKey } from '@/lib/shipment-status';

const STATUS_OPTIONS = Object.entries(SHIPMENT_STATUSES).map(([key, meta]) => ({
  value: key,
  label: meta.label.uz,
}));

type Shipment = {
  id: number;
  trackingCode: string;
  senderName: string;
  receiverName: string;
  origin: string;
  destination: string;
  status: string;
  etaAt: Date | string | null;
};

export function ShipmentsTable({ shipments }: { shipments: Shipment[] }) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [pending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const allChecked = shipments.length > 0 && selected.size === shipments.length;

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) =>
      prev.size === shipments.length ? new Set() : new Set(shipments.map((s) => s.id)),
    );
  }

  function clearSelection() {
    setSelected(new Set());
  }

  async function applyStatus(status: string) {
    if (selected.size === 0) return;
    startTransition(async () => {
      const res = await bulkShipmentAction({
        ids: Array.from(selected),
        action: 'setStatus',
        status,
      });
      setNotice(res.success ? `${res.count} ta yuk holati yangilandi` : `Xato: ${res.error}`);
      if (res.success) clearSelection();
    });
  }

  async function bulkDelete() {
    if (selected.size === 0) return;
    if (!confirm(`${selected.size} ta yukni o'chirishni tasdiqlaysizmi?`)) return;
    startTransition(async () => {
      const res = await bulkShipmentAction({
        ids: Array.from(selected),
        action: 'delete',
      });
      setNotice(res.success ? `${res.count} ta yuk o'chirildi` : `Xato: ${res.error}`);
      if (res.success) clearSelection();
    });
  }

  async function handleSingleDelete(id: number) {
    if (!confirm("Haqiqatan ham ushbu yukni bazadan o'chirmokchimisiz?")) return;
    setDeletingId(id);
    await deleteShipment(id);
    setDeletingId(null);
  }

  return (
    <>
      {selected.size > 0 && (
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 rounded-xl border border-[#185FA5]/30 bg-blue-50 p-3 shadow-sm">
          <span className="text-sm font-bold text-[#185FA5]">{selected.size} tanlangan</span>
          <select
            onChange={(e) => {
              const v = e.target.value;
              e.currentTarget.value = '';
              if (v) applyStatus(v);
            }}
            disabled={pending}
            className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-50"
            defaultValue=""
          >
            <option value="" disabled>
              Holatni o&apos;zgartirish...
            </option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <button
            onClick={bulkDelete}
            disabled={pending}
            className="inline-flex items-center gap-1 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50"
          >
            {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
            O&apos;chirish
          </button>
          <button
            onClick={clearSelection}
            className="ml-auto inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            <X className="h-3 w-3" /> Bekor qilish
          </button>
          {notice && <span className="w-full text-xs text-slate-600">{notice}</span>}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-4 w-10">
                  <button
                    type="button"
                    onClick={toggleAll}
                    className="flex h-5 w-5 items-center justify-center text-slate-500 hover:text-[#185FA5]"
                  >
                    {allChecked ? (
                      <CheckSquare className="h-4 w-4 text-[#185FA5]" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-4 font-semibold text-gray-900">Treking Kod</th>
                <th className="px-6 py-4 font-semibold text-gray-900">Jo&apos;natuvchi</th>
                <th className="px-6 py-4 font-semibold text-gray-900">Marshrut</th>
                <th className="px-6 py-4 font-semibold text-gray-900">ETA</th>
                <th className="px-6 py-4 font-semibold text-gray-900">Holat</th>
                <th className="px-6 py-4 font-semibold text-gray-900 text-right">Tahrir</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {shipments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Hozircha hech qanday yuklar bazaga kiritilmagan.
                  </td>
                </tr>
              ) : (
                shipments.map((s) => {
                  const isDeleting = deletingId === s.id;
                  return (
                    <tr
                      key={s.id}
                      className={`transition-colors ${selected.has(s.id) ? 'bg-blue-50/40' : 'hover:bg-gray-50/50'} ${
                        isDeleting ? 'opacity-50' : ''
                      }`}
                    >
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => toggle(s.id)}
                          className="flex h-5 w-5 items-center justify-center text-slate-500 hover:text-[#185FA5]"
                        >
                          {selected.has(s.id) ? (
                            <CheckSquare className="h-4 w-4 text-[#185FA5]" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-blue-600">{s.trackingCode}</td>
                      <td className="px-6 py-4">
                        {s.senderName}
                        <br />
                        <span className="text-xs text-gray-400">oluvchi: {s.receiverName}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Navigation className="w-3 h-3 rotate-45 text-blue-500" />
                          {s.origin} <br />
                          <span className="text-xs ml-5 text-emerald-600">→ {s.destination}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <EtaCell etaAt={s.etaAt} status={s.status} />
                      </td>
                      <td className="px-6 py-4">
                        {(() => {
                          const m = shipmentStatusMeta(s.status);
                          return (
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${m.pill}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
                              {m.labelText}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/uz/admin/shipments/${s.id}`}
                            className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                            title="Tahrirlash"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleSingleDelete(s.id)}
                            disabled={isDeleting}
                            className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                            title="O'chirish"
                          >
                            {isDeleting ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function EtaCell({ etaAt, status }: { etaAt: Date | string | null; status: string }) {
  if (status === 'delivered') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
        <CheckCircle2 className="h-3 w-3" /> Yetkazildi
      </span>
    );
  }
  if (!etaAt) return <span className="text-xs text-gray-400">—</span>;
  const eta = new Date(etaAt);
  const diffH = (eta.getTime() - Date.now()) / 3_600_000;
  const label = eta.toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short' });
  if (diffH < 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
        <AlertCircle className="h-3 w-3" /> Kechikdi · {label}
      </span>
    );
  }
  if (diffH < 24) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
        <Clock className="h-3 w-3" /> Bugun · {label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
      <Clock className="h-3 w-3" /> {label}
    </span>
  );
}
