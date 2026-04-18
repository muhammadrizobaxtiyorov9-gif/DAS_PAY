'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateLeadStatus, deleteLead, convertLeadToShipment } from '@/app/actions/admin';
import {
  Clock,
  Phone,
  Mail,
  User as UserIcon,
  GripVertical,
  Trash2,
  AlertTriangle,
  PackagePlus,
} from 'lucide-react';

interface Lead {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  service: string | null;
  message: string;
  status: string;
  transportType: string | null;
  fromStation: string | null;
  toStation: string | null;
  assignedToId: number | null;
  assignee: { id: number; name: string | null; username: string } | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Staff {
  id: number;
  name: string | null;
  username: string;
}

const COLUMNS: Array<{ key: string; label: string; accent: string; headerBg: string }> = [
  { key: 'new', label: 'Yangi', accent: 'border-blue-300', headerBg: 'bg-blue-50 text-blue-800' },
  { key: 'contacted', label: "Bog'lanildi", accent: 'border-amber-300', headerBg: 'bg-amber-50 text-amber-800' },
  { key: 'quoted', label: 'Narx berildi', accent: 'border-purple-300', headerBg: 'bg-purple-50 text-purple-800' },
  { key: 'won', label: 'Yutildi', accent: 'border-emerald-300', headerBg: 'bg-emerald-50 text-emerald-800' },
  { key: 'lost', label: 'Yutilmadi', accent: 'border-red-300', headerBg: 'bg-red-50 text-red-800' },
];

const SLA_HOURS: Record<string, number> = {
  new: 1,
  contacted: 24,
  quoted: 72,
};

export function LeadsKanban({
  columns,
  staff,
}: {
  columns: Record<string, Lead[]>;
  staff: Staff[];
}) {
  const [optimisticColumns, setOptimisticColumns] = useState(columns);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [overColumn, setOverColumn] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const moveLead = (leadId: number, fromStatus: string, toStatus: string) => {
    if (fromStatus === toStatus) return;
    setOptimisticColumns((prev) => {
      const next = { ...prev };
      const lead = next[fromStatus]?.find((l) => l.id === leadId);
      if (!lead) return prev;
      next[fromStatus] = next[fromStatus].filter((l) => l.id !== leadId);
      next[toStatus] = [{ ...lead, status: toStatus }, ...(next[toStatus] || [])];
      return next;
    });
    startTransition(async () => {
      await updateLeadStatus(leadId, toStatus);
      router.refresh();
    });
  };

  const handleAssignee = (leadId: number, status: string, assigneeId: number | undefined) => {
    setOptimisticColumns((prev) => {
      const next = { ...prev };
      const idx = next[status]?.findIndex((l) => l.id === leadId);
      if (idx === undefined || idx < 0) return prev;
      const updated = [...next[status]];
      const matched = staff.find((s) => s.id === assigneeId);
      updated[idx] = {
        ...updated[idx],
        assignedToId: assigneeId ?? null,
        assignee: matched
          ? { id: matched.id, name: matched.name, username: matched.username }
          : null,
      };
      next[status] = updated;
      return next;
    });
    startTransition(async () => {
      await updateLeadStatus(leadId, status, assigneeId);
      router.refresh();
    });
  };

  const handleDelete = (leadId: number, status: string) => {
    if (!confirm("O'chirishni tasdiqlaysizmi?")) return;
    setOptimisticColumns((prev) => ({
      ...prev,
      [status]: prev[status].filter((l) => l.id !== leadId),
    }));
    startTransition(async () => {
      await deleteLead(leadId);
      router.refresh();
    });
  };

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {COLUMNS.map((col) => {
        const items = optimisticColumns[col.key] || [];
        const isOver = overColumn === col.key;
        return (
          <div
            key={col.key}
            onDragOver={(e) => {
              e.preventDefault();
              setOverColumn(col.key);
            }}
            onDragLeave={() => setOverColumn((prev) => (prev === col.key ? null : prev))}
            onDrop={(e) => {
              e.preventDefault();
              const payload = e.dataTransfer.getData('application/json');
              setOverColumn(null);
              setDraggingId(null);
              if (!payload) return;
              try {
                const { id, from } = JSON.parse(payload) as { id: number; from: string };
                moveLead(id, from, col.key);
              } catch {
                /* noop */
              }
            }}
            className={`flex flex-col rounded-2xl border-2 ${col.accent} bg-white/60 transition-colors ${
              isOver ? 'bg-[#185FA5]/5 ring-2 ring-[#185FA5]/40' : ''
            }`}
          >
            <div className={`flex items-center justify-between rounded-t-2xl px-3 py-2 ${col.headerBg}`}>
              <span className="text-xs font-bold uppercase tracking-wider">{col.label}</span>
              <span className="rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-bold">
                {items.length}
              </span>
            </div>
            <div className="flex-1 space-y-2 p-2">
              {items.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 py-8 text-center text-[11px] text-slate-400">
                  Bo'sh
                </p>
              ) : (
                items.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    staff={staff}
                    dragging={draggingId === lead.id}
                    onDragStart={() => setDraggingId(lead.id)}
                    onDragEnd={() => setDraggingId(null)}
                    onAssigneeChange={(val) => handleAssignee(lead.id, lead.status, val)}
                    onDelete={() => handleDelete(lead.id, lead.status)}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LeadCard({
  lead,
  staff,
  dragging,
  onDragStart,
  onDragEnd,
  onAssigneeChange,
  onDelete,
}: {
  lead: Lead;
  staff: Staff[];
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onAssigneeChange: (assigneeId: number | undefined) => void;
  onDelete: () => void;
}) {
  const hoursSince = (Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60);
  const slaLimit = SLA_HOURS[lead.status];
  const slaBreached = slaLimit !== undefined && hoursSince > slaLimit;

  const displayTime =
    hoursSince < 1
      ? `${Math.round(hoursSince * 60)}m`
      : hoursSince < 48
        ? `${Math.round(hoursSince)}h`
        : `${Math.round(hoursSince / 24)}d`;

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/json', JSON.stringify({ id: lead.id, from: lead.status }));
        e.dataTransfer.effectAllowed = 'move';
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      className={`group cursor-grab rounded-xl border bg-white p-3 shadow-sm transition-all hover:shadow-md active:cursor-grabbing ${
        dragging ? 'opacity-40' : ''
      } ${slaBreached ? 'border-red-300' : 'border-slate-200'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <GripVertical className="h-3 w-3" />
            <span>#{lead.id}</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 font-semibold text-slate-900">
            <UserIcon className="h-3.5 w-3.5 text-slate-400" />
            <span className="truncate">{lead.name}</span>
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-600">
            <Phone className="h-3 w-3" /> {lead.phone}
          </div>
          {lead.email && (
            <div className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-slate-500">
              <Mail className="h-3 w-3" /> <span className="truncate">{lead.email}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={async (e) => {
              e.stopPropagation();
              if (!confirm('Bu arizadan yuk yaratilsinmi? Ariza holati "Yutildi" ga o\'zgaradi.')) return;
              try {
                const r = await convertLeadToShipment(lead.id);
                window.location.href = `/uz/admin/shipments/${r.shipmentId}`;
              } catch (err) {
                alert((err as Error).message);
              }
            }}
            className="rounded p-1 text-slate-300 hover:bg-emerald-50 hover:text-emerald-600"
            title="Yukga aylantirish"
          >
            <PackagePlus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="rounded p-1 text-slate-300 hover:bg-red-50 hover:text-red-500"
            title="O'chirish"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {(lead.transportType || lead.service) && (
        <div className="mt-2 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-700">
          {lead.transportType || lead.service}
        </div>
      )}

      {lead.fromStation && lead.toStation && (
        <div className="mt-1.5 rounded border border-blue-100 bg-blue-50 px-2 py-1 text-[11px] font-semibold text-[#042C53]">
          {lead.fromStation} ➞ {lead.toStation}
        </div>
      )}

      {lead.message && (
        <p className="mt-2 line-clamp-2 text-[11px] text-slate-500">{lead.message}</p>
      )}

      <div className="mt-2 border-t border-slate-100 pt-2">
        <select
          value={lead.assignedToId || ''}
          onChange={(e) =>
            onAssigneeChange(e.target.value ? parseInt(e.target.value) : undefined)
          }
          onClick={(e) => e.stopPropagation()}
          className="w-full rounded border border-slate-200 bg-slate-50 px-1.5 py-1 text-[11px] outline-none focus:border-[#185FA5]"
        >
          <option value="">(Biriktirilmagan)</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name || s.username}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-2 flex items-center justify-between text-[10px]">
        <span className={`flex items-center gap-1 ${slaBreached ? 'font-bold text-red-600' : 'text-slate-400'}`}>
          {slaBreached ? (
            <AlertTriangle className="h-3 w-3" />
          ) : (
            <Clock className="h-3 w-3" />
          )}
          {displayTime}
        </span>
        <span className="text-slate-400">
          {new Date(lead.createdAt).toLocaleDateString('uz-UZ')}
        </span>
      </div>
    </div>
  );
}
