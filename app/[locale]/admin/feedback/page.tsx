import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Star, ThumbsUp, ThumbsDown, Meh, MessageCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminFeedbackPage() {
  const feedback = await prisma.feedback.findMany({
    where: { submittedAt: { not: null } },
    orderBy: { submittedAt: 'desc' },
    take: 200,
    include: {
      shipment: {
        select: { trackingCode: true, clientPhone: true, origin: true, destination: true },
      },
    },
  });

  const pendingCount = await prisma.feedback.count({ where: { submittedAt: null } });

  const promoters = feedback.filter((f) => f.score >= 9).length;
  const passives = feedback.filter((f) => f.score >= 7 && f.score <= 8).length;
  const detractors = feedback.filter((f) => f.score <= 6).length;
  const answered = feedback.length;

  const nps = answered > 0 ? Math.round(((promoters - detractors) / answered) * 100) : 0;
  const avgScore = answered > 0 ? feedback.reduce((s, f) => s + f.score, 0) / answered : 0;

  const categoryCounts: Record<string, number> = {};
  feedback.forEach((f) => {
    if (f.category) categoryCounts[f.category] = (categoryCounts[f.category] || 0) + 1;
  });
  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b pb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 text-white shadow">
          <Star className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">NPS va mijoz fikrlari</h1>
          <p className="text-sm text-gray-500">
            {answered} ta javob · {pendingCount} ta kutilmoqda
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          icon={Star}
          label="NPS"
          value={`${nps > 0 ? '+' : ''}${nps}`}
          accent={nps >= 50 ? 'emerald' : nps >= 0 ? 'amber' : 'red'}
          sub={`O'rtacha ball: ${avgScore.toFixed(1)}/10`}
        />
        <StatCard icon={ThumbsUp} label="Promouterlar (9-10)" value={String(promoters)} accent="emerald" sub={percent(promoters, answered)} />
        <StatCard icon={Meh} label="Passivlar (7-8)" value={String(passives)} accent="amber" sub={percent(passives, answered)} />
        <StatCard icon={ThumbsDown} label="Detraktorlar (0-6)" value={String(detractors)} accent="red" sub={percent(detractors, answered)} />
      </div>

      {topCategories.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-sm font-bold text-gray-900">Qayd etilgan kategoriyalar</h2>
          <div className="flex flex-wrap gap-2">
            {topCategories.map(([key, count]) => (
              <span key={key} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {CATEGORY_LABEL[key] || key}: <b>{count}</b>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b bg-slate-50 px-6 py-3 text-sm font-bold text-gray-900">
          So&apos;nggi javoblar
        </div>
        {feedback.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-400">
            Hali hech kim fikr bildirmagan.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {feedback.map((f) => (
              <li key={f.id} className="grid gap-2 px-6 py-4 md:grid-cols-[auto_1fr_auto]">
                <ScoreBadge score={f.score} />
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Link
                      href={`/uz/admin/shipments/${f.shipmentId}`}
                      className="font-mono font-semibold text-[#185FA5] hover:underline"
                    >
                      {f.shipment?.trackingCode || `#${f.shipmentId}`}
                    </Link>
                    {f.shipment && (
                      <span className="text-xs text-slate-500">
                        {f.shipment.origin} → {f.shipment.destination}
                      </span>
                    )}
                    {f.category && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                        {CATEGORY_LABEL[f.category] || f.category}
                      </span>
                    )}
                  </div>
                  {f.comment && (
                    <p className="mt-1.5 flex items-start gap-1 text-sm text-slate-600">
                      <MessageCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                      {f.comment}
                    </p>
                  )}
                </div>
                <div className="text-right text-[11px] text-slate-400">
                  {f.submittedAt?.toLocaleString('uz-UZ')}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

const CATEGORY_LABEL: Record<string, string> = {
  speed: 'Tezlik',
  communication: 'Aloqa',
  price: 'Narx',
  packaging: 'Qadoqlash',
  other: 'Boshqa',
};

function percent(n: number, total: number): string {
  if (total === 0) return '—';
  return `${Math.round((n / total) * 100)}%`;
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  sub,
}: {
  icon: typeof Star;
  label: string;
  value: string;
  accent: 'emerald' | 'amber' | 'red' | 'slate';
  sub?: string;
}) {
  const colors = {
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
    red: 'border-red-200 bg-red-50 text-red-900',
    slate: 'border-slate-200 bg-slate-50 text-slate-800',
  };
  return (
    <div className={`rounded-2xl border p-4 ${colors[accent]}`}>
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider opacity-80">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
      {sub && <div className="mt-0.5 text-[11px] opacity-70">{sub}</div>}
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 9
      ? 'bg-emerald-500 text-white'
      : score >= 7
      ? 'bg-amber-500 text-white'
      : 'bg-red-500 text-white';
  return (
    <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold shadow ${color}`}>
      {score}
    </span>
  );
}
