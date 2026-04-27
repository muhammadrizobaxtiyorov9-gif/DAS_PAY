import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { shipmentStatusMeta } from '@/lib/shipment-status';
import { computeEta, type RouteSegment } from '@/lib/map-utils';
import { CONTACTS } from '@/lib/contacts';
import { ArrowRight, MapPin, Calendar, Package } from 'lucide-react';

interface PageProps {
  params: Promise<{ code: string }>;
}

type Locale = 'uz' | 'ru' | 'en';

const COPY: Record<Locale, Record<string, string>> = {
  uz: {
    title: 'Yuk holati',
    subtitle: 'Real vaqtda kuzatish',
    from: "Jo'natuvchi",
    to: 'Qabul qiluvchi',
    weight: 'Vazni',
    updated: 'Yangilangan',
    eta: 'Yetib borishi kutiladi',
    notFound: 'Yuk topilmadi',
    notFoundHint: "Tracking raqam noto'g'ri yoki yuk tizimda yo'q.",
    poweredBy: 'DasPay logistika tomonidan',
    fullDetails: "To'liq tafsilotlar",
    delivered: 'Yetkazildi',
  },
  ru: {
    title: 'Статус груза',
    subtitle: 'Отслеживание в реальном времени',
    from: 'Отправитель',
    to: 'Получатель',
    weight: 'Вес',
    updated: 'Обновлено',
    eta: 'Прибытие ожидается',
    notFound: 'Груз не найден',
    notFoundHint: 'Неверный номер отслеживания или груза нет в системе.',
    poweredBy: 'Работает на DasPay',
    fullDetails: 'Полная информация',
    delivered: 'Доставлено',
  },
  en: {
    title: 'Shipment status',
    subtitle: 'Real-time tracking',
    from: 'Sender',
    to: 'Receiver',
    weight: 'Weight',
    updated: 'Updated',
    eta: 'Expected delivery',
    notFound: 'Shipment not found',
    notFoundHint: 'Invalid tracking number or shipment not in the system.',
    poweredBy: 'Powered by DasPay',
    fullDetails: 'Full details',
    delivered: 'Delivered',
  },
};

async function detectLocale(): Promise<Locale> {
  const accept = (await headers()).get('accept-language') || '';
  const first = accept.split(',')[0]?.split(';')[0]?.split('-')[0]?.toLowerCase();
  if (first === 'ru' || first === 'en') return first;
  return 'uz';
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params;
  const shipment = await prisma.shipment.findUnique({
    where: { trackingCode: code },
    select: { trackingCode: true, origin: true, destination: true, status: true },
  });

  if (!shipment) {
    return {
      title: `Tracking ${code} | DasPay`,
      robots: { index: false, follow: false },
    };
  }

  const statusMeta = shipmentStatusMeta(shipment.status, 'uz');
  const title = `${shipment.trackingCode} — ${statusMeta.labelText}`;
  const desc = `${shipment.origin || '—'} → ${shipment.destination || '—'}`;

  return {
    title: `${title} | DasPay`,
    description: desc,
    openGraph: {
      title,
      description: desc,
      type: 'website',
      url: `${CONTACTS.web.url}/t/${shipment.trackingCode}`,
      images: [{ url: `/t/${shipment.trackingCode}/opengraph-image`, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
    },
    robots: { index: false, follow: false },
  };
}

export default async function PublicTrackingShortPage({ params }: PageProps) {
  const { code } = await params;
  const locale = await detectLocale();
  const t = COPY[locale];

  const shipment = await prisma.shipment.findUnique({
    where: { trackingCode: code },
  });

  if (!shipment) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-10 text-center max-w-md">
          <Package className="h-16 w-16 mx-auto text-slate-300 mb-4" />
          <h1 className="text-2xl font-bold text-slate-900">{t.notFound}</h1>
          <p className="text-slate-500 mt-2">{t.notFoundHint}</p>
          <p className="mt-4 font-mono text-xs text-slate-400">{code}</p>
        </div>
      </main>
    );
  }

  const statusMeta = shipmentStatusMeta(shipment.status, locale);

  const rawSegments = (() => {
    if (typeof shipment.routeSegments === 'string') {
      try { return JSON.parse(shipment.routeSegments); } catch { return []; }
    }
    return Array.isArray(shipment.routeSegments) ? shipment.routeSegments : [];
  })();
  const segments = (rawSegments as unknown[]).map((s) => s as RouteSegment);

  const eta = computeEta(segments, shipment.status, shipment.currentLat, shipment.currentLng);

  const fullDetailsUrl = `/${locale}/tracking/${shipment.trackingCode}`;

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#042C53] via-[#0A3D6E] to-[#185FA5]">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:py-16">
        {/* Brand strip */}
        <div className="text-center mb-6">
          <Link href={`/${locale}`} className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm">
            <Package className="h-4 w-4" />
            <span className="font-bold tracking-tight">DasPay</span>
          </Link>
        </div>

        {/* Status hero card */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-slate-900/30 overflow-hidden">
          <div className="px-6 py-6 sm:px-8 sm:py-8 border-b border-slate-100">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              {t.title}
            </p>
            <p className="mt-1 font-mono text-lg text-slate-900">{shipment.trackingCode}</p>
            <div className="mt-4">
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${statusMeta.pill}`}
              >
                <span className={`h-2 w-2 rounded-full ${statusMeta.dot}`} />
                {statusMeta.labelText}
              </span>
            </div>
          </div>

          {/* Route */}
          <div className="px-6 py-5 sm:px-8 grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-4 items-center border-b border-slate-100">
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{t.from}</p>
              <p className="mt-1 text-base font-semibold text-slate-800">{shipment.origin || '—'}</p>
            </div>
            <ArrowRight className="hidden sm:block h-5 w-5 text-slate-300 mx-auto" />
            <div className="sm:text-right">
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{t.to}</p>
              <p className="mt-1 text-base font-semibold text-slate-800">{shipment.destination || '—'}</p>
            </div>
          </div>

          {/* Meta grid */}
          <div className="px-6 py-5 sm:px-8 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
                <Package className="h-3 w-3" /> {t.weight}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {shipment.weight ? `${shipment.weight} t` : '—'}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
                <Calendar className="h-3 w-3" /> {t.updated}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {shipment.updatedAt.toLocaleDateString(locale === 'en' ? 'en-GB' : 'ru-RU')}
              </p>
            </div>
            {eta?.etaDate && shipment.status !== 'delivered' && (
              <div className="col-span-2">
                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
                  <MapPin className="h-3 w-3" /> {t.eta}
                </p>
                <p className="mt-1 text-sm font-semibold text-emerald-600">
                  {eta.etaDate.toLocaleString(locale === 'en' ? 'en-GB' : 'ru-RU', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
              </div>
            )}
            {shipment.status === 'delivered' && (
              <div className="col-span-2 rounded-xl bg-emerald-50 px-4 py-3 text-center text-emerald-800 font-semibold">
                ✓ {t.delivered}
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="px-6 py-5 sm:px-8 bg-slate-50 border-t border-slate-100">
            <Link
              href={fullDetailsUrl}
              className="block w-full text-center rounded-xl bg-[#185FA5] hover:bg-[#0A3D6E] text-white font-semibold py-3 transition-colors"
            >
              {t.fullDetails} →
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-white/60">{t.poweredBy}</p>
      </div>
    </main>
  );
}
