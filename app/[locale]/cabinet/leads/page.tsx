import { getAuthenticatedClient } from '../lib/clientAuth';
import { prisma } from '@/lib/prisma';
import { ListChecks, Calendar, ExternalLink } from 'lucide-react';
import { CabinetLeadForm } from './CabinetLeadForm';

interface CabinetLeadsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CabinetLeadsPage({ params, searchParams }: CabinetLeadsPageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const client = await getAuthenticatedClient(locale, sp);

  const leads = await prisma.lead.findMany({
    where: { phone: client.phone },
    orderBy: { createdAt: 'desc' },
    include: { assignee: true }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h2 className="text-2xl font-bold text-[#042C53] flex items-center gap-2">
          <ListChecks className="text-[#185FA5]" /> Mening Arizalarim
        </h2>
        <span className="bg-[#185FA5] text-white px-3 py-1 rounded-full text-sm font-bold shadow-sm">
          {leads.length} ta ariza
        </span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Side: New Lead Form */}
        <div className="xl:col-span-1">
           <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm sticky top-6">
              <h3 className="font-bold text-lg text-[#042C53] mb-4">Yangi ariza qoldirish</h3>
              <p className="text-sm text-gray-500 mb-6">Yangi yuk, konsolidatsiya yoki boshqa xizmatlar uchun ariza yuboring. Kiritgan raqamingiz avtomatik saqlangan.</p>
              <CabinetLeadForm defaultName={client.name || ''} defaultPhone={client.phone} />
           </div>
        </div>

        {/* Right Side: Leads List */}
        <div className="xl:col-span-2 space-y-4">
          {leads.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center shadow-sm">
              <ListChecks className="h-16 w-16 text-gray-200 mx-auto mb-4" />
              <p className="text-xl font-medium text-gray-600">Hozircha arizalar yo'q</p>
              <p className="text-sm text-gray-400 mt-2">Yangi ariza yaratish uchun chap tomondagi formadan foydalaning.</p>
            </div>
          ) : (
            leads.map(lead => (
              <div key={lead.id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow">
                 <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                       <p className="font-bold text-lg text-[#042C53] flex items-center gap-2">
                         {lead.transportType ? (
                            <span className="bg-blue-50 text-[#185FA5] text-[10px] px-2 py-1 rounded uppercase tracking-wider">
                              {lead.transportType}
                            </span>
                         ) : null}
                         {lead.service || "Umumiy Ariza"}
                       </p>
                       <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full whitespace-nowrap ${
                         lead.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                       }`}>
                         {lead.status}
                       </span>
                    </div>

                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                      {lead.message}
                    </p>

                    {lead.fromStation && lead.toStation && (
                       <div className="mt-4 flex items-center gap-2 text-sm font-medium bg-[#185FA5]/5 inline-flex px-3 py-1.5 rounded-lg border border-[#185FA5]/10 text-[#042C53]">
                          {lead.fromStation} <ExternalLink className="w-4 h-4 text-[#185FA5]" /> {lead.toStation}
                       </div>
                    )}
                 </div>

                 <div className="md:w-64 bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col justify-center text-center">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-2">Mas'ul Xodim</p>
                    {lead.assignee ? (
                       <div>
                          <div className="h-10 w-10 bg-white border rounded-full mx-auto mb-2 flex items-center justify-center font-bold text-[#185FA5]">
                             {lead.assignee.name?.[0] || lead.assignee.username?.[0] || 'A'}
                          </div>
                          <p className="font-bold text-sm text-[#042C53]">{lead.assignee.name || lead.assignee.username}</p>
                          <p className="text-xs text-green-600 font-medium mt-1">Biriktirilgan</p>
                       </div>
                    ) : (
                       <div className="py-4">
                         <p className="text-sm font-medium text-gray-500">Menejer kutilmoqda</p>
                         <p className="text-[10px] text-gray-400 mt-1">Tez orada mas'ul xodim ulanadi</p>
                       </div>
                    )}
                 </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
