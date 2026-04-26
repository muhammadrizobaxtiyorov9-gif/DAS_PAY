'use client';

import { useState } from 'react';
import { Building2, Plus, Edit2, Power, Loader2, MapPin, Phone, Users, Truck, Train, Package } from 'lucide-react';
import { toast } from 'sonner';

interface Branch {
  id: number;
  code: string;
  name: string;
  city: string;
  address: string | null;
  phone: string | null;
  managerId: number | null;
  active: boolean;
  createdAt: string;
  counts: { users: number; trucks: number; wagons: number; shipments: number };
}

interface Manager {
  id: number;
  label: string;
}

interface Props {
  initialBranches: Branch[];
  managers: Manager[];
  canManage: boolean;
}

interface FormState {
  code: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  managerId: string;
  active: boolean;
}

const EMPTY: FormState = {
  code: '',
  name: '',
  city: '',
  address: '',
  phone: '',
  managerId: '',
  active: true,
};

export function BranchesClient({ initialBranches, managers, canManage }: Props) {
  const [branches, setBranches] = useState<Branch[]>(initialBranches);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [busy, setBusy] = useState(false);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY);
    setShowModal(true);
  };

  const openEdit = (b: Branch) => {
    setEditingId(b.id);
    setForm({
      code: b.code,
      name: b.name,
      city: b.city,
      address: b.address ?? '',
      phone: b.phone ?? '',
      managerId: b.managerId?.toString() ?? '',
      active: b.active,
    });
    setShowModal(true);
  };

  const reload = async () => {
    const res = await fetch('/api/admin/branches', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      setBranches(data.branches);
    }
  };

  const submit = async () => {
    if (!form.code || !form.name || !form.city) {
      toast.error("Kod, nom va shaharni to'ldiring");
      return;
    }
    setBusy(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        city: form.city.trim(),
        address: form.address.trim() || null,
        phone: form.phone.trim() || null,
        managerId: form.managerId ? Number(form.managerId) : null,
        active: form.active,
      };
      const url = editingId ? `/api/admin/branches/${editingId}` : '/api/admin/branches';
      const method = editingId ? 'PUT' : 'POST';
      // For PUT, code is immutable
      const body = editingId ? { ...payload, code: undefined } : payload;
      const res = await fetch(url, {
        method,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error === 'code_taken' ? 'Bu kod band' : `Xatolik: ${err.error || res.status}`);
        return;
      }
      toast.success(editingId ? 'Yangilandi' : "Filial yaratildi");
      setShowModal(false);
      await reload();
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (b: Branch) => {
    if (!confirm(b.active ? "Filialni o'chirishni tasdiqlang? (faolligi yopiladi)" : "Filialni qayta yoqilsinmi?")) return;
    const res = await fetch(`/api/admin/branches/${b.id}`, {
      method: b.active ? 'DELETE' : 'PUT',
      headers: { 'content-type': 'application/json' },
      body: b.active ? undefined : JSON.stringify({ active: true }),
    });
    if (res.ok) {
      toast.success(b.active ? "O'chirildi" : "Yoqildi");
      await reload();
    } else {
      toast.error("Amalni bajarib bo'lmadi");
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-purple-50 p-2.5 text-purple-600">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Filiallar (Branches)</h1>
            <p className="text-sm text-slate-500">
              Multi-tenant boshqaruvi · {branches.filter((b) => b.active).length} faol filial
            </p>
          </div>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-700"
          >
            <Plus className="h-4 w-4" /> Yangi filial
          </button>
        )}
      </header>

      {!canManage && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          Faqat ko&apos;rish rejimi. Filiallarni boshqarish faqat SUPERADMIN uchun.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {branches.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-400">
            Hozircha filial qo&apos;shilmagan
          </div>
        )}

        {branches.map((b) => (
          <article
            key={b.id}
            className={`relative overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${
              b.active ? 'border-slate-200' : 'border-slate-200 opacity-60'
            }`}
          >
            <header className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-purple-50 px-2 py-0.5 font-mono text-[11px] font-bold uppercase text-purple-700">
                    {b.code}
                  </span>
                  {!b.active && (
                    <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
                      Yopiq
                    </span>
                  )}
                </div>
                <h3 className="mt-1.5 truncate text-base font-bold text-slate-900">{b.name}</h3>
              </div>
              {canManage && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(b)}
                    className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                    title="Tahrirlash"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleActive(b)}
                    className={`rounded-lg p-1.5 transition-colors ${
                      b.active
                        ? 'text-slate-400 hover:bg-red-50 hover:text-red-600'
                        : 'text-emerald-500 hover:bg-emerald-50'
                    }`}
                    title={b.active ? "O'chirish" : 'Yoqish'}
                  >
                    <Power className="h-4 w-4" />
                  </button>
                </div>
              )}
            </header>

            <div className="mt-3 space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                <span className="truncate">
                  {b.city}
                  {b.address ? ` · ${b.address}` : ''}
                </span>
              </div>
              {b.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3 shrink-0 text-slate-400" />
                  <a href={`tel:${b.phone}`} className="truncate hover:text-blue-600">
                    {b.phone}
                  </a>
                </div>
              )}
            </div>

            <dl className="mt-4 grid grid-cols-4 gap-2 border-t border-slate-100 pt-3 text-center">
              <Stat icon={Users} label="Xodim" value={b.counts.users} />
              <Stat icon={Truck} label="Avto" value={b.counts.trucks} />
              <Stat icon={Train} label="Vagon" value={b.counts.wagons} />
              <Stat icon={Package} label="Yuk" value={b.counts.shipments} />
            </dl>
          </article>
        ))}
      </div>

      {showModal && canManage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <header className="border-b border-slate-100 px-5 py-3">
              <h3 className="text-base font-semibold text-slate-900">
                {editingId ? "Filialni tahrirlash" : 'Yangi filial'}
              </h3>
            </header>
            <div className="space-y-3 px-5 py-4">
              <Field label="Kod (TAS, BUX, SAM...)">
                <input
                  type="text"
                  disabled={!!editingId}
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="TAS"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm uppercase outline-none focus:border-purple-400 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </Field>
              <Field label="Filial nomi">
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Toshkent markaziy"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-purple-400"
                />
              </Field>
              <Field label="Shahar">
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="Toshkent"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-purple-400"
                />
              </Field>
              <Field label="Manzil">
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="ko'cha, dom"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-purple-400"
                />
              </Field>
              <Field label="Telefon">
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+998 71 ..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-purple-400"
                />
              </Field>
              <Field label="Filial menejeri">
                <select
                  value={form.managerId}
                  onChange={(e) => setForm({ ...form, managerId: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-purple-400"
                >
                  <option value="">— Tanlanmagan —</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </Field>
              <label className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="rounded text-purple-600"
                />
                <span className="text-sm text-slate-700">Faol</span>
              </label>
            </div>
            <footer className="flex gap-2 border-t border-slate-100 px-5 py-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={busy}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Saqlash
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div>
      <Icon className="mx-auto h-3.5 w-3.5 text-slate-400" />
      <div className="mt-0.5 text-sm font-bold text-slate-900">{value}</div>
      <div className="text-[9px] uppercase tracking-wider text-slate-400">{label}</div>
    </div>
  );
}
