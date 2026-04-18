import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { formatMoney } from '@/lib/money';
import { FileSignature, FileText, Send, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { getAuthenticatedClient } from '../lib/clientAuth';

export const dynamic = 'force-dynamic';

const STATUS_META: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  draft: { label: 'Qoralama', color: 'bg-slate-100 text-slate-600', icon: FileText },
  sent: { label: 'Yuborilgan', color: 'bg-blue-100 text-blue-700', icon: Send },
  paid: { label: "To'langan", color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  overdue: { label: 'Muddati o\'tgan', color: 'bg-red-100 text-red-700', icon: AlertCircle },
  cancelled: { label: 'Bekor qilingan', color: 'bg-gray-200 text-gray-600', icon: Clock },
};

export default async function CabinetInvoicesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const client = await getAuthenticatedClient(locale, sp);

  const invoices = await prisma.invoice.findMany({
    where: {
      clientPhone: client.phone,
      status: { not: 'draft' },
    },
    orderBy: { createdAt: 'desc' },
    include: {
      shipment: { select: { trackingCode: true, origin: true, destination: true } },
    },
  });

  const now = new Date();
  const outstanding = invoices
    .filter((i) => i.status === 'sent' || i.status === 'overdue')
    .reduce((s, i) => s + (i.total - i.paidAmount), 0);
  const paidTotal = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b pb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#185FA5] text-white shadow">
          <FileSignature className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mening Invoyslarim</h1>
          <p className="text-sm text-gray-500">Jami <b>{invoices.length}</b> ta hisob-faktura</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">To'lanishi kerak</div>
          <div className="mt-1 text-2xl font-bold text-amber-900">{formatMoney(outstanding, 'USD')}</div>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">To'langan</div>
          <div className="mt-1 text-2xl font-bold text-emerald-900">{formatMoney(paidTotal, 'USD')}</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {invoices.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-500">
            Hozircha sizda invoyslar yo'q.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-6 py-3 font-semibold">Raqam</th>
                  <th className="px-6 py-3 font-semibold">Yuk</th>
                  <th className="px-6 py-3 font-semibold">Muddat</th>
                  <th className="px-6 py-3 text-right font-semibold">Summa</th>
                  <th className="px-6 py-3 text-center font-semibold">Holat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => {
                  const effectiveOverdue =
                    inv.status === 'sent' && inv.dueDate < now && inv.paidAmount < inv.total;
                  const meta =
                    effectiveOverdue ? STATUS_META.overdue : (STATUS_META[inv.status] || STATUS_META.draft);
                  const Icon = meta.icon;
                  const balance = inv.total - inv.paidAmount;
                  return (
                    <tr key={inv.id} className="transition-colors hover:bg-slate-50/60">
                      <td className="px-6 py-3 font-mono font-semibold text-[#185FA5]">
                        <Link href={`/${locale}/cabinet/invoices/${inv.id}`}>{inv.number}</Link>
                      </td>
                      <td className="px-6 py-3 text-xs text-slate-500">
                        {inv.shipment ? (
                          <>
                            <div className="font-mono">#{inv.shipment.trackingCode}</div>
                            <div>{inv.shipment.origin} → {inv.shipment.destination}</div>
                          </>
                        ) : '—'}
                      </td>
                      <td className="px-6 py-3 text-xs text-slate-500">
                        <div className={effectiveOverdue ? 'font-semibold text-red-600' : ''}>
                          {inv.dueDate.toLocaleDateString('uz-UZ')}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-right font-semibold text-slate-800">
                        {formatMoney(inv.total, inv.currency)}
                        {inv.paidAmount > 0 && inv.paidAmount < inv.total && (
                          <div className="text-[11px] font-normal text-red-600">
                            Qoldiq: {formatMoney(balance, inv.currency)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.color}`}>
                          <Icon className="h-3 w-3" />
                          {meta.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
