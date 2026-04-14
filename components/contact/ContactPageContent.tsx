'use client';

import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Clock, Send, Instagram, Linkedin } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { ContactForm } from '@/components/forms/ContactForm';
import { useTranslations } from '@/components/providers/LocaleProvider';

const socialLinks = [
  { name: 'Telegram', icon: Send, href: 'https://t.me/daspay' },
  { name: 'Instagram', icon: Instagram, href: 'https://instagram.com/daspay' },
  { name: 'LinkedIn', icon: Linkedin, href: 'https://linkedin.com/company/daspay' },
];

/**
 * Contact page content with form and info
 */
export function ContactPageContent() {
  const t = useTranslations();

  return (
    <>
      <PageHeader
        titleKey="contact.title"
        subtitleKey="contact.subtitle"
      />
      
      <section className="bg-background py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
                <ContactForm />
              </div>
            </motion.div>

            {/* Contact Info */}
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
                        href="tel:+998712000000"
                        className="mt-1 text-muted-foreground hover:text-[#185FA5]"
                      >
                        {t('contact.info.phone')}
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
                        href="mailto:info@daspay.uz"
                        className="mt-1 text-muted-foreground hover:text-[#185FA5]"
                      >
                        {t('contact.info.email')}
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
                      <p className="mt-1 text-muted-foreground">
                        {t('contact.info.address')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#042C53]/10">
                      <Clock className="h-6 w-6 text-[#185FA5]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {t('contact.info.workHours').split(':')[0]}
                      </h3>
                      <p className="mt-1 text-muted-foreground">
                        {t('contact.info.workHours').split(': ')[1]}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Links */}
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
                      className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#042C53] text-white transition-colors hover:bg-[#185FA5]"
                      aria-label={social.name}
                    >
                      <social.icon className="h-5 w-5" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Map placeholder */}
              <div className="overflow-hidden rounded-2xl border bg-muted">
                <div className="aspect-video w-full bg-gradient-to-br from-[#042C53]/10 to-[#185FA5]/10 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="mx-auto h-12 w-12 text-[#185FA5]/50" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Toshkent, Mirzo Ulug&apos;bek tumani
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
