import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  UserCircle,
  Phone,
  Mail,
  Calendar,
  Package,
  FileSignature,
  MapPin,
  BookUser,
  TrendingUp,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Bell,
} from 'lucide-react';
import { formatMoney } from '@/lib/money';

export const dynamic = 'force-dynamic';

export default async function ClientProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const clientId = Number(id);
  if (!Number.isFinite(clientId)) notFound();

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      shipments: {
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
      invoices: {
        orderBy: { createdAt: 'desc' },
        include: { shipment: { select: { trackingCode: true } } },
      },
      addresses: { orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }] },
    },
  });

  if (!client) notFound();

  const totalBilled = client.invoices.reduce((s, i) => s + i.total, 0);
  const totalPaid = client.invoices.reduce((s, i) => s + i.paidAmount, 0);
  const outstanding = client.invoices
    .filter((i) => i.status === 'sent' || i.status === 'overdue')
    .reduce((s, i) => s + (i.total - i.paidAmount), 0);
  const deliveredCount = client.shipments.filter((s) => s.status === 'delivered').length;
  const inTransitCount = client.shipments.filter((s) =>
    ['in_transit', 'processing', 'pending'].includes(s.status),
  ).length;

  const now = new Date();

  const prefs = client as unknown as {
    notifyStatusChange?: boolean;
    notifyEta?: boolean;
    notifyInvoices?: boolean;
    notifyPromo?: boolean;
    notifyEmail?: string | null;
  };

  return (
    <div className="space-y-6">
      <Link href="/uz/admin/clients" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-[#185FA5]">
        ← Mijozlar ro&apos;yxati
      </Link>

      {/* Header card */}
      <div className="flex flex-wrap items-center gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#042C53] to-[#185FA5] text-3xl font-bold text-white shadow-md">
          {(client.name || client.phone || '?').slice(0, 1).toUpperCase()}
        </div>
        <div className="flex-1">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <UserCircle className="h-6 w-6 text-slate-400" />
            {client.name || "Ism ko'rsatilmagan"}
          </h1>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-600">
            <span className="inline-flex items-center gap-1.5 font-mono">
              <Phone className="h-4 w-4 text-slate-400" /> +{client.phone}
            </span>
            {prefs.notifyEmail && (
              <span className="inline-flex items-center gap-1.5">
                <Mail className="h-4 w-4 text-slate-400" /> {prefs.notifyEmail}
              </span>
            )}
            {client.telegramId && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700">
                Telegram: {client.telegramId}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-slate-400" />
              Mijoz: {client.createdAt.toLocaleDateString('uz-UZ')}
            </span>
          </div>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid gap-3 md:grid-cols-4">
        <Kpi
          icon={Wallet}
          label="LTV (jami billing)"
          value={formatMoney(totalBilled, 'USD')}
          accent="indigo"
        />
        <Kpi
          icon={CheckCircle2}
          label="To'langan"
          value={formatMoney(totalPaid, 'USD')}
          accent="emerald"
        />
        <Kpi
          icon={AlertCircle}
          label="Qarz"
          value={formatMoney(outstanding, 'USD')}
          accent={outstanding > 0 ? 'red' : 'slate'}
        />
        <Kpi
          icon={TrendingUp}
          label="Yetkazildi / Yo'lda"
          value={`${deliveredCount} / ${inTransitCount}`}
          accent="blue"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Shipments */}
        <section className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
              <Package className="h-4 w-4 text-[#185FA5]" /> Yuklar
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                {client.shipments.length}
              </span>
            </h2>
          </div>
          {client.shipments.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">Yuklar yo&apos;q.</p>
          ) : (
            <div className="space-y-2">
              {client.shipments.slice(0, 10).map((s) => (
                <Link
                  key={s.id}
                  href={`/uz/admin/shipments/${s.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 transition-colors hover:bg-slate-50 hover:border-slate-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="font-mono text-sm font-semibold text-[#185FA5]">
                      {s.trackingCode}
                    </div>
                    <StatusBadge status={s.status} />
                  </div>
                  <div className="text-xs text-slate-500">
                    {s.origin} → {s.destination}
                  </div>
                  <div className="text-xs text-slate-400">
                    {s.createdAt.toLocaleDateString('uz-UZ')}
                  </div>
                </Link>
              ))}
              {client.shipments.length > 10 && (
                <p className="pt-2 text-center text-xs text-slate-400">
                  Va yana {client.shipments.length - 10} ta...
                </p>
              )}
            </div>
          )}
        </section>

        {/* Notification prefs */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-gray-900">
            <Bell className="h-4 w-4 text-amber-500" /> Bildirishnomalar
          </h2>
          <ul className="space-y-2 text-sm">
            <PrefRow label="Holat o'zgarishi" on={prefs.notifyStatusChange !== false} />
            <PrefRow label="ETA yangilanishi" on={prefs.notifyEta !== false} />
            <PrefRow label="Invoyslar" on={prefs.notifyInvoices !== false} />
            <PrefRow label="Aksiya / marketing" on={!!prefs.notifyPromo} />
          </ul>
        </section>
      </div>

      {/* Invoices */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-gray-900">
          <FileSignature className="h-4 w-4 text-indigo-600" /> Invoyslar
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
            {client.invoices.length}
          </span>
        </h2>
        {client.invoices.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">Invoyslar yo&apos;q.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-2 pr-4 font-semibold">Raqam</th>
                  <th className="py-2 pr-4 font-semibold">Yuk</th>
                  <th className="py-2 pr-4 font-semibold">Muddat</th>
                  <th className="py-2 pr-4 font-semibold text-right">Summa</th>
                  <th className="py-2 pr-4 font-semibold text-center">Holat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {client.invoices.map((inv) => {
                  const overdue =
                    inv.status === 'sent' && inv.dueDate < now && inv.paidAmount < inv.total;
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/50">
                      <td className="py-2 pr-4 font-mono font-semibold">
                        <Link href={`/uz/admin/invoices/${inv.id}`} className="text-[#185FA5] hover:underline">
                          {inv.number}
                        </Link>
                      </td>
                      <td className="py-2 pr-4 font-mono text-xs text-slate-500">
                        {inv.shipment?.trackingCode || '—'}
                      </td>
                      <td className={`py-2 pr-4 text-xs ${overdue ? 'font-semibold text-red-600' : 'text-slate-500'}`}>
                        {inv.dueDate.toLocaleDateString('uz-UZ')}
                      </td>
                      <td className="py-2 pr-4 text-right font-semibold">
                        {formatMoney(inv.total, inv.currency)}
                      </td>
                      <td className="py-2 pr-4 text-center">
                        <InvoiceStatusBadge status={overdue ? 'overdue' : inv.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Address book */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-gray-900">
          <BookUser className="h-4 w-4 text-purple-600" /> Manzillar kitobi
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
            {client.addresses.length}
          </span>
        </h2>
        {client.addresses.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">
            Hali manzillar saqlanmagan.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {client.addresses.map((a) => (
              <div
                key={a.id}
                className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-sm"
              >
                <div className="mb-1 flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      a.role === 'sender' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {a.role === 'sender' ? "Jo'natuvchi" : 'Qabul qiluvchi'}
                  </span>
                  {a.isDefault && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                      Asosiy
                    </span>
                  )}
                  {a.label && <span className="text-xs text-slate-500">· {a.label}</span>}
                </div>
                <div className="font-semibold text-gray-800">{a.fullName}</div>
                <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                  <Phone className="h-3 w-3" /> {a.phone}
                </div>
                <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                  <MapPin className="h-3 w-3" /> {a.country}
                  {a.city ? `, ${a.city}` : ''}
                </div>
                {a.address && <div className="mt-1 text-xs text-slate-400">{a.address}</div>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Package;
  label: string;
  value: string;
  accent: 'indigo' | 'emerald' | 'red' | 'slate' | 'blue';
}) {
  const colors = {
    indigo: 'from-indigo-50 to-white text-indigo-900 border-indigo-200',
    emerald: 'from-emerald-50 to-white text-emerald-900 border-emerald-200',
    red: 'from-red-50 to-white text-red-900 border-red-200',
    slate: 'from-slate-50 to-white text-slate-800 border-slate-200',
    blue: 'from-blue-50 to-white text-blue-900 border-blue-200',
  };
  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-4 ${colors[accent]}`}>
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider opacity-80">
        <Icon className="h-3.5 w-3.5" /> <span>{label}</span>
      </div>
      <div className="mt-1 text-xl font-bold">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'bg-slate-100 text-slate-600',
    processing: 'bg-blue-100 text-blue-700',
    in_transit: 'bg-indigo-100 text-indigo-700',
    delivered: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${map[status] || 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
}

function InvoiceStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    draft: { label: 'Qoralama', color: 'bg-slate-100 text-slate-600' },
    sent: { label: 'Yuborilgan', color: 'bg-blue-100 text-blue-700' },
    paid: { label: "To'langan", color: 'bg-emerald-100 text-emerald-700' },
    overdue: { label: "Muddati o'tgan", color: 'bg-red-100 text-red-700' },
    cancelled: { label: 'Bekor', color: 'bg-gray-200 text-gray-600' },
  };
  const meta = map[status] || map.draft;
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.color}`}>
      {meta.label}
    </span>
  );
}

function PrefRow({ label, on }: { label: string; on: boolean }) {
  return (
    <li className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
      <span className="text-slate-600">{label}</span>
      <span
        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
          on ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
        }`}
      >
        {on ? 'Yoqilgan' : "O'chiq"}
      </span>
    </li>
  );
}
