'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { createInvoice, type InvoiceInput } from '@/app/actions/admin';

interface ShipmentOpt {
  id: number;
  trackingCode: string;
  origin: string;
  destination: string;
  weight: number | null;
  clientPhone: string | null;
}
interface ClientOpt {
  phone: string;
  name: string | null;
}
interface ContractOpt {
  id: number;
  contractNumber: number;
  companyName: string;
}
interface Row {
  description: string;
  quantity: string;
  unitPrice: string;
}

function buildPrefillRows(s: ShipmentOpt | null): Row[] {
  if (!s) return [{ description: '', quantity: '1', unitPrice: '0' }];
  const weight = s.weight ?? 1;
  const price = Math.round(weight * 2.5 * 100) / 100;
  return [
    {
      description: `Yetkazib berish xizmati (${s.origin} → ${s.destination}, ${weight} tonna)`,
      quantity: '1',
      unitPrice: String(price),
    },
  ];
}

export function InvoiceForm({
  shipments,
  clients,
  contracts,
  prefillShipment,
}: {
  shipments: ShipmentOpt[];
  clients: ClientOpt[];
  contracts: ContractOpt[];
  prefillShipment: ShipmentOpt | null;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [shipmentId, setShipmentId] = useState<string>(prefillShipment ? String(prefillShipment.id) : '');
  const [clientPhone, setClientPhone] = useState<string>(prefillShipment?.clientPhone || '');
  const [contractId, setContractId] = useState<string>('');
  const [currency, setCurrency] = useState('USD');
  const [taxRate, setTaxRate] = useState('0');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');
  const [rows, setRows] = useState<Row[]>(buildPrefillRows(prefillShipment));

  const { subtotal, tax, total } = useMemo(() => {
    const st = rows.reduce((s, r) => s + (parseFloat(r.quantity) || 0) * (parseFloat(r.unitPrice) || 0), 0);
    const tr = parseFloat(taxRate) || 0;
    const tx = st * tr / 100;
    return {
      subtotal: Math.round(st * 100) / 100,
      tax: Math.round(tx * 100) / 100,
      total: Math.round((st + tx) * 100) / 100,
    };
  }, [rows, taxRate]);

  function updateRow(i: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function addRow() {
    setRows((prev) => [...prev, { description: '', quantity: '1', unitPrice: '0' }]);
  }
  function removeRow(i: number) {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const items = rows
      .map((r) => ({
        description: r.description.trim(),
        quantity: parseFloat(r.quantity) || 0,
        unitPrice: parseFloat(r.unitPrice) || 0,
        total: Math.round((parseFloat(r.quantity) || 0) * (parseFloat(r.unitPrice) || 0) * 100) / 100,
      }))
      .filter((r) => r.description && r.quantity > 0);

    if (items.length === 0) {
      setError('Kamida bitta band qo\'shing');
      setSubmitting(false);
      return;
    }

    const payload: InvoiceInput = {
      shipmentId: shipmentId ? parseInt(shipmentId) : null,
      clientPhone: clientPhone || null,
      contractId: contractId ? parseInt(contractId) : null,
      dueDate,
      items,
      taxRate: parseFloat(taxRate) || 0,
      currency,
      notes: notes || null,
    };

    const r = await createInvoice(payload);
    if (r.success && r.id) {
      router.push(`/uz/admin/invoices/${r.id}`);
    } else {
      setError(r.error || 'Xatolik');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      <div className="grid gap-5 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Yuk (ixtiyoriy)</label>
          <select
            value={shipmentId}
            onChange={(e) => {
              const val = e.target.value;
              setShipmentId(val);
              if (val) {
                const s = shipments.find((x) => String(x.id) === val);
                if (s) {
                  if (s.clientPhone) setClientPhone(s.clientPhone);
                  setRows(buildPrefillRows(s));
                }
              }
            }}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">— Yuksiz invoys —</option>
            {shipments.map((s) => (
              <option key={s.id} value={s.id}>
                #{s.trackingCode} · {s.origin} → {s.destination}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Mijoz (telefon)</label>
          <select
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">— Mijozsiz —</option>
            {clients.map((c) => (
              <option key={c.phone} value={c.phone}>
                {c.name ? `${c.name} · ` : ''}+{c.phone}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Shartnoma (ixtiyoriy)</label>
          <select
            value={contractId}
            onChange={(e) => setContractId(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">— Shartnomasiz —</option>
            {contracts.map((c) => (
              <option key={c.id} value={c.id}>
                #{c.contractNumber} · {c.companyName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">To'lov muddati</label>
          <input
            type="date"
            required
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Valyuta</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="USD">USD</option>
            <option value="UZS">UZS</option>
            <option value="RUB">RUB</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Soliq stavkasi (%)</label>
          <input
            type="number"
            step="0.01"
            min={0}
            value={taxRate}
            onChange={(e) => setTaxRate(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">Bandlar</h3>
          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Plus className="h-3 w-3" /> Band qo'shish
          </button>
        </div>

        <div className="space-y-2">
          {rows.map((r, i) => {
            const lineTotal = (parseFloat(r.quantity) || 0) * (parseFloat(r.unitPrice) || 0);
            return (
              <div key={i} className="grid grid-cols-12 gap-2 rounded-lg border border-slate-200 bg-white p-2">
                <input
                  className="col-span-6 rounded-md border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                  placeholder="Xizmat tavsifi"
                  value={r.description}
                  onChange={(e) => updateRow(i, { description: e.target.value })}
                />
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  className="col-span-2 rounded-md border border-slate-200 px-2 py-1.5 text-right text-sm font-mono outline-none focus:border-blue-500"
                  placeholder="Miqdor"
                  value={r.quantity}
                  onChange={(e) => updateRow(i, { quantity: e.target.value })}
                />
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  className="col-span-2 rounded-md border border-slate-200 px-2 py-1.5 text-right text-sm font-mono outline-none focus:border-blue-500"
                  placeholder="Birlik narx"
                  value={r.unitPrice}
                  onChange={(e) => updateRow(i, { unitPrice: e.target.value })}
                />
                <div className="col-span-1 flex items-center justify-end px-2 text-sm font-mono font-semibold text-slate-700">
                  {lineTotal.toFixed(2)}
                </div>
                <button
                  type="button"
                  onClick={() => removeRow(i)}
                  className="col-span-1 inline-flex items-center justify-center rounded-md text-red-500 hover:bg-red-50"
                  aria-label="O'chirish"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex justify-end">
          <div className="w-full max-w-xs space-y-1 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Oraliq</span>
              <span className="font-mono font-semibold">{subtotal.toFixed(2)} {currency}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Soliq ({taxRate || 0}%)</span>
              <span className="font-mono font-semibold">{tax.toFixed(2)} {currency}</span>
            </div>
            <div className="flex justify-between border-t border-slate-300 pt-1 text-base font-bold text-slate-900">
              <span>Jami</span>
              <span className="font-mono">{total.toFixed(2)} {currency}</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Izoh</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          placeholder="Maxsus shart, to'lov rekvizitlari, va h.k."
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border px-6 py-2.5 text-gray-700 hover:bg-gray-50"
        >
          Bekor qilish
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-lg bg-[#185FA5] px-6 py-2.5 font-medium text-white hover:bg-[#042C53] disabled:opacity-60"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Invoysni yaratish
        </button>
      </div>
    </form>
  );
}
