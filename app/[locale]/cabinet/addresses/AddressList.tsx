'use client';

import { useState } from 'react';
import { Plus, Star, Pencil, Trash2, Phone, MapPin } from 'lucide-react';
import { createAddress, updateAddress, deleteAddress, setDefaultAddress } from '@/app/actions/addresses';

interface Address {
  id: number;
  role: string;
  label: string | null;
  fullName: string;
  phone: string;
  country: string;
  city: string | null;
  address: string | null;
  notes: string | null;
  isDefault: boolean;
}

interface AddressListProps {
  role: 'sender' | 'receiver';
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: Address[];
}

export function AddressList({ role, title, icon: Icon, items }: AddressListProps) {
  const [editing, setEditing] = useState<Address | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-[#185FA5]" />
          <h2 className="font-bold text-slate-800">{title}</h2>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
            {items.length}
          </span>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-1 rounded-lg bg-[#185FA5] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0A3D6E]"
        >
          <Plus className="h-3.5 w-3.5" /> Qo'shish
        </button>
      </div>

      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center text-sm text-slate-500">
            Hali hech narsa saqlanmagan.
          </p>
        ) : (
          items.map((a) => <AddressCard key={a.id} item={a} onEdit={() => setEditing(a)} />)
        )}
      </div>

      {(creating || editing) && (
        <AddressModal
          role={role}
          item={editing}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
        />
      )}
    </div>
  );
}

function AddressCard({ item, onEdit }: { item: Address; onEdit: () => void }) {
  const [pending, setPending] = useState(false);

  const handleDelete = async () => {
    if (!confirm("O'chirishni tasdiqlaysizmi?")) return;
    setPending(true);
    try {
      await deleteAddress(item.id);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setPending(false);
    }
  };

  const handleDefault = async () => {
    setPending(true);
    try {
      await setDefaultAddress(item.id);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className={`rounded-xl border p-3 transition-colors ${item.isDefault ? 'border-amber-300 bg-amber-50/50' : 'border-slate-200 bg-slate-50/50'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {item.label && (
              <span className="rounded bg-[#185FA5]/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#185FA5]">
                {item.label}
              </span>
            )}
            {item.isDefault && (
              <span className="inline-flex items-center gap-0.5 rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                <Star className="h-2.5 w-2.5" /> Asosiy
              </span>
            )}
          </div>
          <div className="mt-1 font-semibold text-slate-800">{item.fullName}</div>
          <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
            <Phone className="h-3 w-3" /> +{item.phone}
          </div>
          <div className="mt-0.5 flex items-start gap-1 text-xs text-slate-500">
            <MapPin className="mt-0.5 h-3 w-3 flex-shrink-0" />
            <span>
              {item.country}
              {item.city && ` · ${item.city}`}
              {item.address && `, ${item.address}`}
            </span>
          </div>
          {item.notes && (
            <div className="mt-1 text-[11px] italic text-slate-400">{item.notes}</div>
          )}
        </div>
        <div className="flex flex-col gap-1">
          {!item.isDefault && (
            <button
              onClick={handleDefault}
              disabled={pending}
              title="Asosiy qilish"
              className="rounded p-1 text-slate-400 hover:bg-amber-100 hover:text-amber-600 disabled:opacity-50"
            >
              <Star className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onEdit}
            disabled={pending}
            title="Tahrirlash"
            className="rounded p-1 text-slate-400 hover:bg-blue-100 hover:text-blue-600 disabled:opacity-50"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={handleDelete}
            disabled={pending}
            title="O'chirish"
            className="rounded p-1 text-slate-400 hover:bg-red-100 hover:text-red-600 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function AddressModal({
  role,
  item,
  onClose,
}: {
  role: 'sender' | 'receiver';
  item: Address | null;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    label: item?.label || '',
    fullName: item?.fullName || '',
    phone: item?.phone || '',
    country: item?.country || '',
    city: item?.city || '',
    address: item?.address || '',
    notes: item?.notes || '',
    isDefault: item?.isDefault || false,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        role,
        label: form.label || undefined,
        fullName: form.fullName,
        phone: form.phone,
        country: form.country,
        city: form.city || undefined,
        address: form.address || undefined,
        notes: form.notes || undefined,
        isDefault: form.isDefault,
      };
      if (item) await updateAddress(item.id, payload);
      else await createAddress(payload);
      onClose();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
      >
        <h3 className="mb-4 text-lg font-bold text-slate-800">
          {item ? 'Manzilni tahrirlash' : 'Yangi manzil'}
          <span className="ml-2 text-xs font-normal text-slate-500">
            ({role === 'sender' ? "Jo'natuvchi" : 'Qabul qiluvchi'})
          </span>
        </h3>
        <div className="grid gap-3">
          <Field label="Yorliq (masalan: Uy, Ofis)">
            <input
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#185FA5] focus:outline-none"
              placeholder="Uy"
            />
          </Field>
          <Field label="To'liq ism *">
            <input
              required
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#185FA5] focus:outline-none"
            />
          </Field>
          <Field label="Telefon * (998...)">
            <input
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#185FA5] focus:outline-none"
              placeholder="998901234567"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Davlat *">
              <input
                required
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#185FA5] focus:outline-none"
                placeholder="Uzbekistan"
              />
            </Field>
            <Field label="Shahar">
              <input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#185FA5] focus:outline-none"
                placeholder="Tashkent"
              />
            </Field>
          </div>
          <Field label="Manzil (ko'cha, uy)">
            <input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#185FA5] focus:outline-none"
            />
          </Field>
          <Field label="Qo'shimcha izoh">
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#185FA5] focus:outline-none"
            />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300"
            />
            <span className="text-slate-700">Asosiy sifatida belgilash</span>
          </label>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[#185FA5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0A3D6E] disabled:opacity-50"
          >
            {saving ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </label>
      {children}
    </div>
  );
}
