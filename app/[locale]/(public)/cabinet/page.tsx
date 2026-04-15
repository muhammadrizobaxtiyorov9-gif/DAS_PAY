import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { Package, MapPin, Truck, ListChecks, Calendar, Settings } from 'lucide-react';
import Link from 'next/link';
import { jwtVerify } from 'jose';
import { LogoutButton } from './LogoutButton';
import { PasswordForm } from './PasswordForm';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-key-for-daspay-client-2026');

interface CabinetPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function getAuthenticatedClient(searchParams: { [key: string]: string | string[] | undefined }) {
  const tgId = typeof searchParams.tgId === 'string' ? searchParams.tgId : null;
  if (tgId) {
    return await prisma.client.findUnique({
      where: { telegramId: tgId },
      include: { shipments: { orderBy: { updatedAt: 'desc' } } }
    });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get('daspay_client_token')?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const telegramId = payload.sub as string;
    if (!telegramId) return null;
    return await prisma.client.findUnique({
      where: { telegramId },
      include: { shipments: { orderBy: { updatedAt: 'desc' } } }
    });
  } catch {
    return null;
  }
}

export default async function CabinetPage({ params, searchParams }: CabinetPageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const client = await getAuthenticatedClient(sp);

  if (!client) {
    redirect(`/${locale}/login`);
  }

  const myLeads = await prisma.lead.findMany({
    where: { phone: client.phone },
    orderBy: { createdAt: 'desc' },
    include: { assignee: true }
  });

  const hasPassword = !!(client as any).password;

  return (
    <div className="min-h-screen bg-secondary">
      {/* Cabinet Header - pt-24 clears the fixed navbar */}
      <div className="bg-[#042C53] pt-28 pb-20 px-6 md:px-12 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-white/10 flex items-center justify-center text-xl font-bold border border-white/20">
                {client.name ? client.name.charAt(0).toUpperCase() : 'M'}
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Xush kelibsiz, {client.name || 'Hurmatli mijoz'}</h1>
                <p className="text-blue-200 mt-1">
                  <span className="bg-white/20 px-2 py-0.5 rounded text-sm font-mono">{client.phone}</span>
                </p>
              </div>
            </div>
            <LogoutButton locale={locale} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 space-y-8 pb-16">

        {/* Shipments */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Package className="text-[#185FA5]" /> Mening Yuklarim
            </h2>
            <span className="bg-[#185FA5] text-white px-3 py-1 rounded-full text-sm font-bold shadow-sm">
              {client.shipments.length} ta
            </span>
          </div>

          {client.shipments.length === 0 ? (
            <div className="bg-card rounded-2xl border p-12 text-center shadow-sm">
              <Truck className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-lg font-medium">Hozircha faol yuklaringiz yo'q</p>
              <p className="text-sm text-muted-foreground mt-2">Yangi yuk qo'shilganda shu yerda ko'rinadi.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {client.shipments.map(shipment => (
                <Link href={`/${locale}/tracking/${shipment.trackingCode}`} key={shipment.id}>
                  <div className="bg-card rounded-2xl border p-6 shadow-sm hover:shadow-md transition-shadow group cursor-pointer relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform">
                      <Truck className="w-24 h-24" />
                    </div>
                    <div className="flex justify-between items-start mb-4">
                      <span className="font-mono font-bold text-[#185FA5] bg-blue-50 px-2 py-1 rounded">{shipment.trackingCode}</span>
                      <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${
                        shipment.status === 'delivered' ? 'bg-green-100 text-green-700' :
                        shipment.status === 'in_transit' ? 'bg-blue-100 text-[#185FA5]' : 'bg-yellow-100 text-yellow-700'
                      }`}>{shipment.status}</span>
                    </div>
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4 text-gray-400" /> <span className="truncate">{shipment.origin}</span>
                      </div>
                      <div className="border-l-2 border-dashed ml-2 pl-4 py-1 flex items-center gap-2 text-sm font-medium text-foreground">
                        <Truck className="w-4 h-4 text-[#185FA5]" /> <span className="truncate">{shipment.destination}</span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground flex justify-between items-center pt-4 border-t">
                      <span>Oxirgi yangilanish:</span>
                      <span className="font-medium">{shipment.updatedAt.toISOString().slice(0, 10)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Leads */}
        <div className="pt-8 mt-8 border-t">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2 mb-4">
            <ListChecks className="text-[#185FA5]" /> Mening Arizalarim
          </h2>
          {myLeads.length === 0 ? (
            <div className="bg-card rounded-2xl border p-8 text-center shadow-sm">
              <p className="text-muted-foreground">Hozircha arizalar yo'q.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myLeads.map(lead => (
                <div key={lead.id} className="bg-card rounded-xl border p-5 shadow-sm md:flex justify-between items-center">
                  <div className="mb-4 md:mb-0">
                    <p className="font-medium text-lg flex items-center gap-2">
                      {lead.transportType ? (
                        <span className="bg-blue-50 text-[#042C53] text-xs px-2 py-1 rounded font-bold uppercase border">{lead.transportType}</span>
                      ) : null}
                      {lead.service || "Ochiq Ariza"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{lead.message}</p>
                    {lead.fromStation && lead.toStation && (
                      <p className="text-sm font-medium mt-2 bg-gray-50 inline-block px-3 py-1 rounded border">
                        {lead.fromStation} ➞ {lead.toStation}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {lead.createdAt.toISOString().slice(0, 16).replace('T', ' ')}</span>
                      <span className={`font-bold px-2 rounded ${lead.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {lead.status}
                      </span>
                    </div>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-xl border text-sm w-full md:w-64">
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Mas'ul xodim</p>
                    {lead.assignee ? (
                      <div>
                        <p className="font-bold text-[#042C53]">{lead.assignee.name || lead.assignee.username}</p>
                        <p className="text-xs mt-1 text-green-600 font-medium">Siz bilan tez orada bog'lanadi</p>
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">Kutish rejimida...</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="pt-8 mt-8 border-t">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2 mb-4">
            <Settings className="text-[#185FA5]" /> Sozlamalar
          </h2>
          <div className="bg-card rounded-2xl border p-6 shadow-sm max-w-lg">
            <h3 className="font-semibold text-lg mb-1">
              {hasPassword ? "Parolni o'zgartirish" : "Parol o'rnatish"}
            </h3>
            <p className="text-sm text-muted-foreground mb-5">
              {hasPassword 
                ? "Xavfsizlik uchun parolingizni vaqti-vaqti bilan yangilab turing."
                : "Keyingi safar tez kirish uchun parol o'rnating."}
            </p>
            <PasswordForm phone={client.phone} hasPassword={hasPassword} />
          </div>
        </div>

      </div>
    </div>
  );
}
