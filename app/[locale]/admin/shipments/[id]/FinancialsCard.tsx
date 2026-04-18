'use client';

import { useState, useTransition } from 'react';
import { DollarSign, Save, TrendingUp, TrendingDown, Truck, Train, Plane, Ship, Loader2 } from 'lucide-react';
import { updateShipmentFinancials } from '@/app/actions/admin';

const MODE_ICONS = { road: Truck, rail: Train, air: Plane, sea: Ship };
const MODE_LABELS: Record<string, string> = { road: 'Avto', rail: "Temir yo'l", air: 'Havo', sea: 'Dengiz' };

export function FinancialsCard({
  shipmentId,
  initial,
}: {
  shipmentId: number;
  initial: {
    revenue: number;
    cost: number;
    currency: string;
    transportMode: string | null;
    distanceKm: number | null;
    etaAt: string | null;
  };
}) {
  const [revenue, setRevenue] = useState(String(initial.revenue || ''));
  const [cost, setCost] = useState(String(initial.cost || ''));
  const [currency, setCurrency] = useState(initial.currency || 'USD');
  const [mode, setMode] = useState(initial.transportMode || 'road');
  const [saving, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const revNum = parseFloat(revenue) || 0;
  const costNum = parseFloat(cost) || 0;
  const margin = revNum - costNum;
  const marginPct = revNum > 0 ? (margin / revNum) * 100 : 0;
  const positive = margin >= 0;

  async function handleSave() {
    setMessage(null);
    startTransition(async () => {
      const res = await updateShipmentFinancials(shipmentId, {
        revenue: revNum,
        cost: costNum,
        currency,
        transportMode: mode,
      });
      setMessage(res.success ? "Saqlandi" : `Xato: ${res.error}`);
    });
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
          <DollarSign className="h-4 w-4 text-emerald-600" /> Moliyaviy &amp; ETA
        </h2>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
            positive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          Marja: {margin.toFixed(2)} {currency}
          {revNum > 0 && <span className="opacity-70"> ({marginPct.toFixed(0)}%)</span>}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <LabeledInput label="Daromad" value={revenue} onChange={setRevenue} />
        <LabeledInput label="Xarajat" value={cost} onChange={setCost} />
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-600">Valyuta</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-[#185FA5] focus:bg-white focus:outline-none"
          >
            <option value="USD">USD</option>
            <option value="UZS">UZS</option>
            <option value="RUB">RUB</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-600">Transport turi</label>
          <div className="grid grid-cols-4 gap-1 rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            {(['road', 'rail', 'air', 'sea'] as const).map((m) => {
              const Icon = MODE_ICONS[m];
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  title={MODE_LABELS[m]}
                  className={`flex items-center justify-center rounded-md py-1.5 text-xs font-semibold transition-colors ${
                    mode === m ? 'bg-white text-[#185FA5] shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
        {initial.distanceKm && initial.distanceKm > 0 && (
          <span className="rounded bg-slate-100 px-2 py-0.5 font-semibold">
            Marshrut: {initial.distanceKm.toFixed(0)} km
          </span>
        )}
        {initial.etaAt && (
          <span className="rounded bg-blue-50 px-2 py-0.5 font-semibold text-blue-700">
            ETA: {new Date(initial.etaAt).toLocaleString('uz-UZ')}
          </span>
        )}
        <span className="ml-auto flex items-center gap-2">
          {message && <span className={message.startsWith('Xato') ? 'text-red-600' : 'text-emerald-600'}>{message}</span>}
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1 rounded-lg bg-[#185FA5] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#0A3D6E] disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            Saqlash
          </button>
        </span>
      </div>
    </div>
  );
}

function LabeledInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-gray-600">{label}</label>
      <input
        type="number"
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0.00"
        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-[#185FA5] focus:bg-white focus:outline-none"
      />
    </div>
  );
}
