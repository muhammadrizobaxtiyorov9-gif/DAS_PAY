'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { requestShipment } from '@/app/actions/client-shipments';
import { Send, BookUser } from 'lucide-react';

interface SavedAddress {
  id: number;
  label: string | null;
  fullName: string;
  phone: string;
  country: string;
  city: string | null;
  address: string | null;
  isDefault: boolean;
}

interface ShipmentRequestFormProps {
  locale: string;
  senderAddresses: SavedAddress[];
  receiverAddresses: SavedAddress[];
}

function addressLine(a: SavedAddress) {
  return [a.country, a.city, a.address].filter(Boolean).join(', ');
}

export function ShipmentRequestForm({ locale, senderAddresses, receiverAddresses }: ShipmentRequestFormProps) {
  const router = useRouter();

  const defaultSender = senderAddresses.find((a) => a.isDefault) || senderAddresses[0];
  const defaultReceiver = receiverAddresses.find((a) => a.isDefault) || receiverAddresses[0];

  const [form, setForm] = useState({
    senderName: defaultSender?.fullName || '',
    senderPhone: defaultSender?.phone || '',
    origin: defaultSender ? addressLine(defaultSender) : '',
    receiverName: defaultReceiver?.fullName || '',
    receiverPhone: defaultReceiver?.phone || '',
    destination: defaultReceiver ? addressLine(defaultReceiver) : '',
    weight: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applySender = (id: number) => {
    const a = senderAddresses.find((x) => x.id === id);
    if (!a) return;
    setForm((f) => ({
      ...f,
      senderName: a.fullName,
      senderPhone: a.phone,
      origin: addressLine(a),
    }));
  };

  const applyReceiver = (id: number) => {
    const a = receiverAddresses.find((x) => x.id === id);
    if (!a) return;
    setForm((f) => ({
      ...f,
      receiverName: a.fullName,
      receiverPhone: a.phone,
      destination: addressLine(a),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const weight = form.weight ? parseFloat(form.weight) : undefined;
      const result = await requestShipment({
        senderName: form.senderName,
        senderPhone: form.senderPhone || undefined,
        receiverName: form.receiverName,
        receiverPhone: form.receiverPhone || undefined,
        origin: form.origin,
        destination: form.destination,
        weight: weight && !isNaN(weight) ? weight : undefined,
        description: form.description || undefined,
      });
      router.push(`/${locale}/cabinet/shipments/${result.id}`);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">Jo'natuvchi</h3>
          {senderAddresses.length > 0 && (
            <select
              onChange={(e) => e.target.value && applySender(parseInt(e.target.value))}
              className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600"
              defaultValue=""
            >
              <option value="">📖 Manzillar kitobidan...</option>
              {senderAddresses.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label ? `${a.label} — ` : ''}{a.fullName} (+{a.phone})
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="To'liq ism *">
            <input
              required
              value={form.senderName}
              onChange={(e) => setForm({ ...form, senderName: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#185FA5] focus:outline-none"
            />
          </Field>
          <Field label="Telefon (998...)">
            <input
              value={form.senderPhone}
              onChange={(e) => setForm({ ...form, senderPhone: e.target.value.replace(/\D/g, '') })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#185FA5] focus:outline-none"
              placeholder="998901234567"
            />
          </Field>
        </div>
        <div className="mt-3">
          <Field label="Jo'natish manzili *">
            <input
              required
              value={form.origin}
              onChange={(e) => setForm({ ...form, origin: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#185FA5] focus:outline-none"
              placeholder="Uzbekistan, Tashkent, Amir Temur 5"
            />
          </Field>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">Qabul qiluvchi</h3>
          {receiverAddresses.length > 0 && (
            <select
              onChange={(e) => e.target.value && applyReceiver(parseInt(e.target.value))}
              className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600"
              defaultValue=""
            >
              <option value="">📖 Manzillar kitobidan...</option>
              {receiverAddresses.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label ? `${a.label} — ` : ''}{a.fullName} (+{a.phone})
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="To'liq ism *">
            <input
              required
              value={form.receiverName}
              onChange={(e) => setForm({ ...form, receiverName: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#185FA5] focus:outline-none"
            />
          </Field>
          <Field label="Telefon">
            <input
              value={form.receiverPhone}
              onChange={(e) => setForm({ ...form, receiverPhone: e.target.value.replace(/\D/g, '') })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#185FA5] focus:outline-none"
            />
          </Field>
        </div>
        <div className="mt-3">
          <Field label="Yetkazish manzili *">
            <input
              required
              value={form.destination}
              onChange={(e) => setForm({ ...form, destination: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#185FA5] focus:outline-none"
              placeholder="Russia, Moscow, Lenina 12"
            />
          </Field>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-600">Yuk haqida</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Vazn (tonna)">
            <input
              type="number"
              step="0.1"
              min="0"
              value={form.weight}
              onChange={(e) => setForm({ ...form, weight: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#185FA5] focus:outline-none"
              placeholder="10"
            />
          </Field>
        </div>
        <div className="mt-3">
          <Field label="Tavsif / Qo'shimcha izoh">
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#185FA5] focus:outline-none"
              placeholder="Nima jo'natmoqchisiz? Maxsus talab bormi?"
            />
          </Field>
        </div>
      </section>

      {senderAddresses.length + receiverAddresses.length === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
          <BookUser className="mr-1 inline h-4 w-4" />
          Maslahat: keyingi safar tezroq to'ldirish uchun manzillar kitobiga qo'shing.
        </div>
      )}

      <div className="flex items-center justify-end gap-2 border-t pt-4">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-lg bg-[#185FA5] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#0A3D6E] disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          {submitting ? 'Yuborilmoqda...' : "So'rov yuborish"}
        </button>
      </div>
    </form>
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
