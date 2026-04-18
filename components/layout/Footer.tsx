'use client';

import Link from 'next/link';
import { Phone, Mail, MapPin, Send, Instagram, Linkedin } from 'lucide-react';
import { useLocale, useTranslations } from '@/components/providers/LocaleProvider';
import { CONTACTS, getAddress, type LocaleKey } from '@/lib/contacts';

const services = [
  { key: 'road', href: '/services/road' },
  { key: 'warehouse', href: '/services/warehouse' },
  { key: 'international', href: '/services/international' },
  { key: 'air', href: '/services/air' },
  { key: 'rail', href: '/services/rail' },
  { key: 'customs', href: '/services/customs' },
] as const;

const quickLinks = [
  { key: 'home', href: '' },
  { key: 'about', href: '/about' },
  { key: 'tracking', href: '/tracking' },
  { key: 'blog', href: '/blog' },
  { key: 'contract', href: '/contract' },
  { key: 'contact', href: '/contact' },
] as const;

const socialLinks = [
  { name: 'Telegram', icon: Send, href: CONTACTS.social.telegram },
  { name: 'Instagram', icon: Instagram, href: CONTACTS.social.instagram },
  { name: 'LinkedIn', icon: Linkedin, href: CONTACTS.social.linkedin },
];

export function Footer() {
  const { locale } = useLocale();
  const t = useTranslations();
  const currentYear = new Date().getFullYear();
  const address = getAddress(locale as LocaleKey);

  return (
    <footer className="bg-[#042C53] text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Link href={`/${locale}`} prefetch className="flex items-center">
              <div className="relative h-16 w-48 flex items-center justify-start -ml-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo_white.svg"
                  alt={t('common.brand')}
                  className="max-w-full object-contain"
                  style={{ height: '200%' }}
                />
              </div>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-white/70">
              {t('footer.description')}
            </p>
            <div className="mt-6 flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 transition-colors hover:bg-white/20"
                  aria-label={social.name}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">
              {t('footer.quickLinks')}
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.key}>
                  <Link
                    href={`/${locale}${link.href}`}
                    prefetch
                    className="text-sm text-white/70 transition-colors hover:text-white"
                  >
                    {t(`nav.${link.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">
              {t('footer.services')}
            </h3>
            <ul className="space-y-3">
              {services.map((service) => (
                <li key={service.key}>
                  <Link
                    href={`/${locale}${service.href}`}
                    prefetch
                    className="text-sm text-white/70 transition-colors hover:text-white"
                  >
                    {t(`services.items.${service.key}.title`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">
              {t('footer.contact')}
            </h3>
            <ul className="space-y-4">
              <li>
                <a
                  href={`tel:${CONTACTS.phone.tel}`}
                  className="flex items-center gap-3 text-sm text-white/70 transition-colors hover:text-white"
                >
                  <Phone className="h-4 w-4 shrink-0" />
                  {CONTACTS.phone.display}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${CONTACTS.email.mailto}`}
                  className="flex items-center gap-3 text-sm text-white/70 transition-colors hover:text-white"
                >
                  <Mail className="h-4 w-4 shrink-0" />
                  {CONTACTS.email.display}
                </a>
              </li>
              <li>
                <div className="flex items-start gap-3 text-sm text-white/70">
                  <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{address}</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-white/60">
              © {currentYear} DasPay. {t('footer.copyright')}
            </p>
            <div className="flex gap-6">
              <Link
                href={`/${locale}/privacy`}
                prefetch
                className="text-sm text-white/60 transition-colors hover:text-white"
              >
                {t('footer.privacy')}
              </Link>
              <Link
                href={`/${locale}/terms`}
                prefetch
                className="text-sm text-white/60 transition-colors hover:text-white"
              >
                {t('footer.terms')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
