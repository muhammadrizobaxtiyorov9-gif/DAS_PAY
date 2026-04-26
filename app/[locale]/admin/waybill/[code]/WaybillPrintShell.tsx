'use client';

import { Printer } from 'lucide-react';

interface Props {
  shipment: {
    id: number;
    trackingCode: string;
    senderName: string;
    receiverName: string;
    origin: string;
    destination: string;
    weight: number | null;
    description: string | null;
    revenue: number;
    currency: string;
    createdAt: string;
    cargoType: string | null;
    transportMode: string | null;
  };
  client: { name: string | null; phone: string } | null;
  truck: { plateNumber: string; model: string } | null;
  wagonNumbers: string[];
  invoiceNumber: string | null;
  qr: string;
  trackingUrl: string;
  receiveUrl?: string;
}

export function WaybillPrintShell({
  shipment,
  client,
  truck,
  wagonNumbers,
  invoiceNumber,
  qr,
  trackingUrl,
  receiveUrl,
}: Props) {
  const date = new Date(shipment.createdAt);
  const dateStr = date.toLocaleDateString('uz-UZ');

  return (
    <div className="bg-slate-100 min-h-screen py-8 print:bg-white print:py-0">
      <div className="mx-auto max-w-4xl space-y-4 px-4 print:max-w-none print:px-0">
        <div className="flex items-center justify-between print:hidden">
          <h1 className="text-xl font-bold text-slate-800">CMR / Waybill — {shipment.trackingCode}</h1>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-blue-700"
          >
            <Printer className="h-4 w-4" /> Chop etish / PDF saqlash
          </button>
        </div>

        <article className="bg-white p-10 shadow-xl print:shadow-none">
          <header className="flex items-start justify-between border-b-4 border-blue-700 pb-4">
            <div>
              <p className="text-3xl font-black tracking-tight text-blue-900">DasPay</p>
              <p className="text-xs uppercase tracking-widest text-slate-500">
                International Logistics
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">CMR / Waybill</p>
              <p className="font-mono text-lg font-bold text-blue-900">{shipment.trackingCode}</p>
              <p className="text-xs text-slate-500">{dateStr}</p>
            </div>
          </header>

          <section className="mt-6 grid grid-cols-2 gap-6">
            <Block title="Yuboruvchi (Sender)">
              <p className="font-semibold text-slate-800">{shipment.senderName}</p>
              <p className="text-sm text-slate-600">{shipment.origin}</p>
            </Block>
            <Block title="Qabul qiluvchi (Receiver)">
              <p className="font-semibold text-slate-800">{shipment.receiverName}</p>
              <p className="text-sm text-slate-600">{shipment.destination}</p>
              {client?.phone && <p className="text-xs text-slate-500">Tel: {client.phone}</p>}
            </Block>
          </section>

          <section className="mt-6 grid grid-cols-3 gap-4">
            <Field label="Vazn" value={shipment.weight ? `${shipment.weight} kg` : '—'} />
            <Field label="Yuk turi" value={shipment.cargoType ?? '—'} />
            <Field label="Transport" value={shipment.transportMode ?? '—'} />
            <Field label="Mashina" value={truck ? `${truck.plateNumber} (${truck.model})` : '—'} />
            <Field label="Vagonlar" value={wagonNumbers.length ? wagonNumbers.join(', ') : '—'} />
            <Field label="Hisob-faktura" value={invoiceNumber ?? '—'} />
          </section>

          <section className="mt-6">
            <Block title="Yuk tavsifi">
              <p className="text-sm text-slate-700">{shipment.description || '—'}</p>
            </Block>
          </section>

          <section className="mt-6 grid grid-cols-3 items-center gap-4 rounded-lg bg-slate-50 p-4">
            <div className="col-span-2">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">QR-kod orqali yuk qabulini tasdiqlash</p>
              <p className="mt-1 text-xs text-slate-600">
                Mijoz telefoni kamerasi orqali QR-ni skanerlab "Yukni qabul qildim" tugmasini bosadi.
              </p>
              {receiveUrl && (
                <p className="mt-1 break-all text-[10px] text-slate-400">{receiveUrl}</p>
              )}
              <div className="mt-3 grid grid-cols-2 gap-4">
                <SignBox label="Yuboruvchi imzosi" />
                <SignBox label="Qabul qiluvchi imzosi" />
              </div>
            </div>
            <div className="flex items-center justify-end">
              <img src={qr} alt="QR" className="h-32 w-32" />
            </div>
          </section>

          <footer className="mt-8 border-t pt-4 text-center text-[10px] uppercase tracking-widest text-slate-400">
            DasPay © · daspay.com · Track: {trackingUrl}
          </footer>
        </article>
      </div>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[10px] uppercase tracking-wider text-slate-500">{title}</p>
      <div className="rounded-md border border-slate-200 bg-slate-50/50 p-3">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}

function SignBox({ label }: { label: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      <div className="mt-1 h-12 rounded border border-dashed border-slate-300" />
    </div>
  );
}
