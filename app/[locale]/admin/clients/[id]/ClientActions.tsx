'use client';

import { useState } from 'react';
import { Pencil, Trash2, Save, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface ClientActionsProps {
  clientId: number;
  clientName: string | null;
  clientPhone: string;
  notifyEmail: string | null;
  isSuperAdmin: boolean;
}

export function ClientActions({ clientId, clientName, clientPhone, notifyEmail, isSuperAdmin }: ClientActionsProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: clientName || '',
    phone: clientPhone,
    notifyEmail: notifyEmail || '',
  });

  if (!isSuperAdmin) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success('Mijoz ma\'lumotlari yangilandi!');
        setEditing(false);
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Xatolik yuz berdi');
      }
    } catch {
      toast.error('Xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/admin/clients/${clientId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Mijoz o\'chirildi!');
        router.push('/uz/admin/clients');
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Xatolik yuz berdi');
      }
    } catch {
      toast.error('Xatolik yuz berdi');
    }
  };

  return (
    <div className="space-y-4">
      {/* Action buttons */}
      <div className="flex items-center gap-2">
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#185FA5] px-3 py-2 text-xs font-semibold text-white hover:bg-[#0A3D6E] transition"
          >
            <Pencil className="h-3.5 w-3.5" /> Tahrirlash
          </button>
        ) : (
          <>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Saqlash
            </button>
            <button
              onClick={() => setEditing(false)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200 transition"
            >
              <X className="h-3.5 w-3.5" /> Bekor
            </button>
          </>
        )}

        {!deleting ? (
          <button
            onClick={() => setDeleting(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 transition"
          >
            <Trash2 className="h-3.5 w-3.5" /> O&apos;chirish
          </button>
        ) : (
          <div className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
            <span className="text-xs font-medium text-red-600">Ishonchingiz komilmi?</span>
            <button
              onClick={handleDelete}
              className="rounded bg-red-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-red-700 transition"
            >
              Ha
            </button>
            <button
              onClick={() => setDeleting(false)}
              className="rounded bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-700 hover:bg-gray-200 transition"
            >
              Yo&apos;q
            </button>
          </div>
        )}
      </div>

      {/* Edit form */}
      {editing && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Ism</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#185FA5] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Telefon</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#185FA5] focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Email (bildirishnomalar uchun)</label>
            <input
              value={form.notifyEmail}
              onChange={(e) => setForm({ ...form, notifyEmail: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#185FA5] focus:outline-none"
              placeholder="email@example.com"
            />
          </div>
        </div>
      )}
    </div>
  );
}
