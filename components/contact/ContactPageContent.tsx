'use client';

import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Clock, Send, Instagram, Linkedin } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { ContactForm } from '@/components/forms/ContactForm';
import { useLocale, useTranslations } from '@/components/providers/LocaleProvider';
import { CONTACTS, getAddress, getWorkHours, type LocaleKey } from '@/lib/contacts';
import { OfficeMap } from './OfficeMap';

const socialLinks = [
  { name: 'Telegram', icon: Send, href: CONTACTS.social.telegram, accent: 'hover:bg-[#229ED9]' },
  { name: 'Instagram', icon: Instagram, href: CONTACTS.social.instagram, accent: 'hover:bg-gradient-to-br hover:from-[#f58529] hover:via-[#dd2a7b] hover:to-[#515bd4]' },
  { name: 'LinkedIn', icon: Linkedin, href: CONTACTS.social.linkedin, accent: 'hover:bg-[#0A66C2]' },
];

export function ContactPageContent() {
  const t = useTranslations();
  const { locale } = useLocale();
  const address = getAddress(locale as LocaleKey);
  const workHours = getWorkHours(locale as LocaleKey);

  return (
    <>
      <PageHeader titleKey="contact.title" subtitleKey="contact.subtitle" />

      <section className="bg-background py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
                <ContactForm />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col gap-8"
            >
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {t('contact.info.title')}
                </h2>
                <div className="mt-6 space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#042C53]/10">
                      <Phone className="h-6 w-6 text-[#185FA5]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {t('common.phone')}
                      </h3>
                      <a
                        href={`tel:${CONTACTS.phone.tel}`}
                        className="mt-1 block text-muted-foreground hover:text-[#185FA5]"
                      >
                        {CONTACTS.phone.display}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#042C53]/10">
                      <Mail className="h-6 w-6 text-[#185FA5]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {t('common.email')}
                      </h3>
                      <a
                        href={`mailto:${CONTACTS.email.mailto}`}
                        className="mt-1 block text-muted-foreground hover:text-[#185FA5]"
                      >
                        {CONTACTS.email.display}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#042C53]/10">
                      <MapPin className="h-6 w-6 text-[#185FA5]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {t('common.address')}
                      </h3>
                      <p className="mt-1 text-muted-foreground">{address}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#042C53]/10">
                      <Clock className="h-6 w-6 text-[#185FA5]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {t('contact.info.workHours').split(':')[0] || 'Ish vaqti'}
                      </h3>
                      <p className="mt-1 text-muted-foreground">{workHours}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-foreground">
                  {t('footer.followUs')}
                </h3>
                <div className="mt-4 flex gap-3">
                  {socialLinks.map((social) => (
                    <a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex h-12 w-12 items-center justify-center rounded-lg bg-[#042C53] text-white transition-all hover:scale-105 ${social.accent}`}
                      aria-label={social.name}
                    >
                      <social.icon className="h-5 w-5" />
                    </a>
                  ))}
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl border shadow-lg" style={{ height: 360 }}>
                <OfficeMap
                  lat={CONTACTS.coords.lat}
                  lng={CONTACTS.coords.lng}
                  address={address}
                  label={t('common.brand')}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
