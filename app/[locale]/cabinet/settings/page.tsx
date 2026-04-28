import { getAuthenticatedClient } from '../lib/clientAuth';
import { PasswordForm } from './PasswordForm';
import { NotificationPrefs } from './NotificationPrefs';
import { ClientProfileForm } from './ClientProfileForm';
import { Settings, ShieldCheck, KeyRound, Bell } from 'lucide-react';

interface CabinetSettingsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CabinetSettingsPage({ params, searchParams }: CabinetSettingsPageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const client = await getAuthenticatedClient(locale, sp);

  const hasPassword = !!(client as any).password;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h2 className="text-2xl font-bold text-[#042C53] flex items-center gap-2">
          <Settings className="text-[#185FA5]" /> Sozlamalar
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Password Settings */}
         <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-[0.03]">
               <KeyRound className="w-48 h-48" />
            </div>
            
            <div className="relative z-10">
               <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-blue-50 text-[#185FA5]">
                     <ShieldCheck className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-xl text-[#042C53]">
                    {hasPassword ? "Xavfsizlik parolini yangilash" : "Xavfsizlik parolini o'rnatish"}
                  </h3>
               </div>
               <p className="text-sm text-gray-500 mb-6 pl-13">
                 {hasPassword 
                   ? "Akkountingiz xavfsizligini ta'minlash uchun parolingizni kimgadir bermang va vaqti-vaqti bilan yangilab turing."
                   : "Keyingi safar tizimga tez va xavfsiz kirish uchun shaxsiy parol o'rnating."}
               </p>
               
               <PasswordForm phone={client.phone} hasPassword={hasPassword} />
            </div>
         </div>

         {/* Notification Preferences */}
         <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm relative overflow-hidden lg:col-span-2">
            <div className="absolute top-0 right-0 p-6 opacity-[0.03]">
               <Bell className="w-48 h-48" />
            </div>
            <div className="relative z-10">
               <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                     <Bell className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-xl text-[#042C53]">Bildirishnomalar</h3>
               </div>
               <p className="text-sm text-gray-500 mb-6">
                  Qaysi hodisalardan xabardor bo'lishni istaysiz? Har bir tur uchun Telegram va email orqali yuboriladi.
               </p>
               <NotificationPrefs
                  initial={{
                     notifyStatusChange: (client as any).notifyStatusChange ?? true,
                     notifyEta: (client as any).notifyEta ?? true,
                     notifyInvoices: (client as any).notifyInvoices ?? true,
                     notifyPromo: (client as any).notifyPromo ?? false,
                     notifyEmail: (client as any).notifyEmail ?? null,
                  }}
                  hasTelegram={!!client.telegramId}
               />
            </div>
         </div>

         {/* Profile Details (Editable) */}
         <ClientProfileForm initialData={{
            name: client.name,
            companyName: (client as any).companyName || '',
            companyInn: (client as any).companyInn || '',
            language: (client as any).language || 'uz',
            phone: client.phone,
            telegramId: client.telegramId,
         }} />
      </div>
    </div>
  );
}
