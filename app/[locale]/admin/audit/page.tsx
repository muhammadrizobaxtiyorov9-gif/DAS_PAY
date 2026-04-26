import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { redirect } from 'next/navigation';
import { adminTokenSecret } from '@/lib/secrets';
import {
  ClipboardList,
  Filter,
  User as UserIcon,
  Package,
  FileSignature,
  CheckSquare,
  Newspaper,
  Clock,
  Search,
  Banknote,
} from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const ACTION_META: Record<string, { label: string; color: string; icon: typeof Package }> = {
  CREATE_SHIPMENT: { label: 'Yuk yaratildi', color: 'bg-emerald-100 text-emerald-700', icon: Package },
  UPDATE_SHIPMENT: { label: "Yuk o'zgartirildi", color: 'bg-blue-100 text-blue-700', icon: Package },
  DELETE_SHIPMENT: { label: "Yuk o'chirildi", color: 'bg-red-100 text-red-700', icon: Package },
  ADD_SHIPMENT_EVENT: { label: 'Tracking yangilandi', color: 'bg-indigo-100 text-indigo-700', icon: Package },
  UPDATE_LEAD_STATUS: { label: 'Ariza yangilandi', color: 'bg-blue-100 text-blue-700', icon: UserIcon },
  DELETE_LEAD: { label: "Ariza o'chirildi", color: 'bg-red-100 text-red-700', icon: UserIcon },
  CREATE_CONTRACT: { label: 'Shartnoma tuzildi', color: 'bg-emerald-100 text-emerald-700', icon: FileSignature },
  DELETE_CONTRACT: { label: "Shartnoma o'chirildi", color: 'bg-red-100 text-red-700', icon: FileSignature },
  CREATE_TASK: { label: 'Topshiriq qo\'shildi', color: 'bg-emerald-100 text-emerald-700', icon: CheckSquare },
  UPDATE_TASK: { label: 'Topshiriq yangilandi', color: 'bg-blue-100 text-blue-700', icon: CheckSquare },
  DELETE_TASK: { label: "Topshiriq o'chirildi", color: 'bg-red-100 text-red-700', icon: CheckSquare },
  CREATE_BLOG: { label: 'Maqola yaratildi', color: 'bg-emerald-100 text-emerald-700', icon: Newspaper },
  UPDATE_BLOG: { label: 'Maqola yangilandi', color: 'bg-blue-100 text-blue-700', icon: Newspaper },
  DELETE_BLOG: { label: "Maqola o'chirildi", color: 'bg-red-100 text-red-700', icon: Newspaper },
  CREATE_TARIFF: { label: "Tarif qo'shildi", color: 'bg-emerald-100 text-emerald-700', icon: Banknote },
  UPDATE_TARIFF: { label: 'Tarif yangilandi', color: 'bg-blue-100 text-blue-700', icon: Banknote },
  DELETE_TARIFF: { label: "Tarif o'chirildi", color: 'bg-red-100 text-red-700', icon: Banknote },
  CREATE_INVOICE: { label: 'Hisob-faktura yaratildi', color: 'bg-emerald-100 text-emerald-700', icon: FileSignature },
  UPDATE_INVOICE: { label: 'Hisob-faktura yangilandi', color: 'bg-blue-100 text-blue-700', icon: FileSignature },
  DELETE_INVOICE: { label: "Hisob-faktura o'chirildi", color: 'bg-red-100 text-red-700', icon: FileSignature },
  SEND_INVOICE: { label: 'Hisob-faktura jo\'natildi', color: 'bg-indigo-100 text-indigo-700', icon: FileSignature },
  PAY_INVOICE: { label: "To'lov qabul qilindi", color: 'bg-emerald-100 text-emerald-700', icon: FileSignature },
};

interface PageProps {
  searchParams: Promise<{
    user?: string;
    type?: string;
    q?: string;
    page?: string;
  }>;
}

export default async function AuditLogPage({ searchParams }: PageProps) {
  const adminToken = (await cookies()).get('admin_token')?.value;
  if (!adminToken) redirect('/uz/admin-login');
  try {
    await jwtVerify(adminToken, adminTokenSecret());
  } catch {
    redirect('/uz/admin-login');
  }

  const sp = await searchParams;
  const filterUserId = sp.user ? parseInt(sp.user) : undefined;
  const filterType = sp.type || undefined;
  const query = sp.q?.trim() || '';
  const page = Math.max(1, parseInt(sp.page || '1') || 1);
  const pageSize = 50;

  const where: Record<string, unknown> = {};
  if (filterUserId) where.userId = filterUserId;
  if (filterType) where.actionType = filterType;
  if (query) where.description = { contains: query, mode: 'insensitive' };

  const [actions, total, users, typeGroups] = await Promise.all([
    prisma.userAction.findMany({
      where,
      include: { user: { select: { id: true, username: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: pageSize,
      skip: (page - 1) * pageSize,
    }),
    prisma.userAction.count({ where }),
    prisma.user.findMany({ select: { id: true, username: true, name: true }, orderBy: { username: 'asc' } }),
    prisma.userAction.groupBy({
      by: ['actionType'],
      _count: { actionType: true },
      orderBy: { _count: { actionType: 'desc' } },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function buildUrl(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const userParam = overrides.user ?? (filterUserId ? String(filterUserId) : undefined);
    const typeParam = overrides.type ?? filterType;
    const qParam = overrides.q ?? (query || undefined);
    const pageParam = overrides.page ?? String(page);
    if (userParam) params.set('user', userParam);
    if (typeParam) params.set('type', typeParam);
    if (qParam) params.set('q', qParam);
    if (pageParam && pageParam !== '1') params.set('page', pageParam);
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b pb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white shadow">
          <ClipboardList className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
          <p className="text-sm text-gray-500">
            Barcha admin harakatlari · jami <b>{total}</b> ta yozuv
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <form method="get" className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Xodim
            </label>
            <select
              name="user"
              defaultValue={filterUserId || ''}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">Barcha xodimlar</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name || u.username}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Harakat turi
            </label>
            <select
              name="type"
              defaultValue={filterType || ''}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">Barchasi</option>
              {typeGroups.map((g) => (
                <option key={g.actionType} value={g.actionType}>
                  {ACTION_META[g.actionType]?.label || g.actionType} ({g._count.actionType})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Qidiruv
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                name="q"
                defaultValue={query}
                placeholder="Izoh yoki treking kod..."
                className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#185FA5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#042C53]"
            >
              <Filter className="h-4 w-4" /> Filter
            </button>
            {(filterUserId || filterType || query) && (
              <Link
                href="?"
                className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Tozalash
              </Link>
            )}
          </div>
        </form>
      </div>

      {/* Actions list */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {actions.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-500">
            Filtrlarga mos yozuvlar topilmadi.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {actions.map((a) => {
              const meta = ACTION_META[a.actionType] || { label: a.actionType, color: 'bg-slate-100 text-slate-700', icon: ClipboardList };
              const Icon = meta.icon;
              return (
                <li key={a.id} className="flex items-start gap-3 p-4 hover:bg-slate-50/50">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${meta.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.color}`}>
                        {meta.label}
                      </span>
                      <span className="text-sm font-semibold text-slate-800">
                        {a.user?.name || a.user?.username || 'Unknown user'}
                      </span>
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                        +{a.points} KPI
                      </span>
                    </div>
                    {a.description && (
                      <p className="mt-1 text-sm text-slate-600">{a.description}</p>
                    )}
                    <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock className="h-3 w-3" />
                      {a.createdAt.toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
          <span className="text-slate-500">
            Sahifa <b>{page}</b> / {totalPages}
          </span>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <Link
                href={buildUrl({ page: String(page - 1) })}
                className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-50"
              >
                ← Oldingi
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={buildUrl({ page: String(page + 1) })}
                className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-50"
              >
                Keyingi →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
