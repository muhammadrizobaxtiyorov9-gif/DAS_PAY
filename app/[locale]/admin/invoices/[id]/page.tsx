import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { formatMoney } from '@/lib/money';
import { ArrowLeft, Printer, FileText } from 'lucide-react';
import { InvoiceActions } from './InvoiceActions';
import { CONTACTS } from '@/lib/contacts';

export const dynamic = 'force-dynamic';

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id: parseInt(id) },
    include: {
      shipment: true,
      client: true,
      contract: true,
      createdBy: { select: { name: true, username: true } },
    },
  });
  if (!invoice) notFound();

  const items: InvoiceItem[] = Array.isArray(invoice.items)
    ? (invoice.items as unknown as InvoiceItem[])
    : [];

  const clientLabel =
    invoice.client?.name || invoice.contract?.companyName || (invoice.clientPhone ? `+${invoice.clientPhone}` : 'Noma\'lum mijoz');
  const hasTelegram = !!invoice.client?.telegramId;
  const balance = invoice.total - invoice.paidAmount;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Toolbar (hidden on print) */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href="/uz/admin/invoices"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" /> Orqaga
        </Link>

        <InvoiceActions
          invoiceId={invoice.id}
          status={invoice.status}
          total={invoice.total}
          paidAmount={invoice.paidAmount}
          hasTelegram={hasTelegram}
        />
      </div>

      {/* Invoice body */}
      <div className="rounded-2xl border border-slate-200 bg-white p-10 shadow-sm print:border-0 print:shadow-none">
        <div className="flex items-start justify-between border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-2 text-[#185FA5]">
              <FileText className="h-6 w-6" />
              <h2 className="text-2xl font-bold">DasPay Logistics</h2>
            </div>
            <p className="mt-2 text-xs text-slate-500">{CONTACTS.address.uz}</p>
            <p className="text-xs text-slate-500">{CONTACTS.phone.display}</p>
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-black text-slate-900">HISOB-FAKTURA</h1>
            <p className="mt-1 font-mono text-sm font-semibold text-[#185FA5]">{invoice.number}</p>
            <span
              className={`mt-2 inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest ${
                invoice.status === 'paid'
                  ? 'bg-emerald-100 text-emerald-700'
                  : invoice.status === 'overdue'
                    ? 'bg-red-100 text-red-700'
                    : invoice.status === 'sent'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-100 text-slate-600'
              }`}
            >
              {invoice.status}
            </span>
          </div>
        </div>

        <div className="grid gap-6 border-b border-slate-200 py-6 md:grid-cols-3 text-sm">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Mijoz</div>
            <div className="mt-1 font-semibold text-slate-800">{clientLabel}</div>
            {invoice.client?.phone && <div className="text-xs text-slate-500">+{invoice.client.phone}</div>}
            {invoice.contract?.companyInn && (
              <div className="text-xs text-slate-500">INN: {invoice.contract.companyInn}</div>
            )}
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Berilgan sana</div>
            <div className="mt-1 font-semibold text-slate-800">
              {invoice.issueDate.toLocaleDateString('uz-UZ', { timeZone: 'Asia/Tashkent' })}
            </div>
            {invoice.shipment && (
              <div className="mt-3">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Yuk</div>
                <div className="mt-1 font-mono text-sm text-slate-700">#{invoice.shipment.trackingCode}</div>
                <div className="text-xs text-slate-500">{invoice.shipment.origin} → {invoice.shipment.destination}</div>
              </div>
            )}
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">To'lov muddati</div>
            <div className="mt-1 font-semibold text-slate-800">
              {invoice.dueDate.toLocaleDateString('uz-UZ', { timeZone: 'Asia/Tashkent' })}
            </div>
            <div className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Valyuta</div>
            <div className="mt-1 font-mono text-sm text-slate-700">{invoice.currency}</div>
          </div>
        </div>

        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-3 py-2 text-left">Xizmat / Tavsif</th>
              <th className="px-3 py-2 text-right w-20">Miqdor</th>
              <th className="px-3 py-2 text-right w-32">Birlik narx</th>
              <th className="px-3 py-2 text-right w-32">Jami</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-slate-400">
                  Bandlar kiritilmagan.
                </td>
              </tr>
            ) : (
              items.map((it, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="px-3 py-3 text-slate-800">{it.description}</td>
                  <td className="px-3 py-3 text-right font-mono text-slate-700">{it.quantity}</td>
                  <td className="px-3 py-3 text-right font-mono text-slate-700">
                    {formatMoney(it.unitPrice, invoice.currency)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono font-semibold text-slate-900">
                    {formatMoney(it.total, invoice.currency)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="mt-6 flex justify-end">
          <div className="w-full max-w-sm space-y-2 text-sm">
            <Row label="Oraliq summa" value={formatMoney(invoice.subtotal, invoice.currency)} />
            {invoice.taxRate > 0 && (
              <Row label={`Soliq (${invoice.taxRate}%)`} value={formatMoney(invoice.tax, invoice.currency)} />
            )}
            <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-lg font-bold text-slate-900">
              <span>JAMI</span>
              <span>{formatMoney(invoice.total, invoice.currency)}</span>
            </div>
            {invoice.paidAmount > 0 && (
              <>
                <Row label="To'langan" value={formatMoney(invoice.paidAmount, invoice.currency)} emphasis="emerald" />
                <Row
                  label="Qarz"
                  value={formatMoney(balance, invoice.currency)}
                  emphasis={balance > 0 ? 'red' : 'emerald'}
                />
              </>
            )}
          </div>
        </div>

        {invoice.notes && (
          <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Izoh</div>
            <p className="mt-1 whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}

        <div className="mt-10 border-t border-slate-200 pt-4 text-[11px] text-slate-400">
          Tayyorlagan: {invoice.createdBy?.name || invoice.createdBy?.username || '—'} · {invoice.createdAt.toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, emphasis }: { label: string; value: string; emphasis?: 'emerald' | 'red' }) {
  const color = emphasis === 'emerald' ? 'text-emerald-700' : emphasis === 'red' ? 'text-red-700' : 'text-slate-700';
  return (
    <div className={`flex items-center justify-between ${color}`}>
      <span className="text-slate-500">{label}</span>
      <span className="font-mono font-semibold">{value}</span>
    </div>
  );
}
