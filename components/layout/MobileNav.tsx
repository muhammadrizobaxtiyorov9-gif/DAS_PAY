'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { X, Truck, Phone, Mail, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocale, useTranslations } from '@/components/providers/LocaleProvider';
import { locales, localeNames, type Locale } from '@/lib/i18n';

const navItems = [
  { key: 'home', href: '' },
  { key: 'services', href: '/services' },
  { key: 'tracking', href: '/tracking' },
  { key: 'calculator', href: '/calculator' },
  { key: 'about', href: '/about' },
  { key: 'blog', href: '/blog' },
  { key: 'contract', href: '/contract' },
  { key: 'contact', href: '/contact' },
];

interface MobileNavProps {
  onClose: () => void;
}

/**
 * Full-screen mobile navigation menu
 */
export function MobileNav({ onClose }: MobileNavProps) {
  const { locale } = useLocale();
  const t = useTranslations();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-[#042C53] lg:hidden"
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4">
          <Link href={`/${locale}`} className="flex items-center" onClick={onClose}>
            <div className="relative h-16 w-48 flex items-center justify-start">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo_white.svg"
                alt={t('common.brand')}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
            <span className="sr-only">Close menu</span>
          </Button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-4 py-8">
          <ul className="space-y-2">
            {navItems.map((item, index) => (
              <motion.li
                key={item.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  href={`/${locale}${item.href}`}
                  onClick={onClose}
                  className="block rounded-lg px-4 py-3 text-lg font-medium text-white transition-colors hover:bg-white/10"
                >
                  {t(`nav.${item.key}`)}
                </Link>
              </motion.li>
            ))}
          </ul>

          {/* Cabinet Button */}
          <div className="mt-6 px-4">
            <Link
              href={`/${locale}/login`}
              onClick={onClose}
              className="flex items-center justify-center gap-2 w-full bg-white text-[#042C53] font-bold py-3 rounded-lg text-lg hover:bg-gray-100 transition-colors"
            >
              Kabinetga kirish
            </Link>
          </div>

          {/* Language Switcher */}
          <div className="mt-8 border-t border-white/10 pt-8">
            <p className="mb-4 px-4 text-sm text-white/60">
              {locale === 'uz' ? 'Tilni tanlang' : locale === 'ru' ? 'Выберите язык' : 'Select language'}
            </p>
            <div className="flex gap-2 px-4">
              {locales.map((loc) => (
                <Link
                  key={loc}
                  href={`/${loc}`}
                  onClick={onClose}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    locale === loc
                      ? 'bg-white text-[#042C53]'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {localeNames[loc]}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* Contact Info */}
        <div className="border-t border-white/10 px-4 py-6">
          <div className="space-y-3 text-sm text-white/80">
            <a href="tel:+998712000000" className="flex items-center gap-3 hover:text-white">
              <Phone className="h-4 w-4" />
              +998 71 200 00 00
            </a>
            <a href="mailto:info@das-pay.com" className="flex items-center gap-3 hover:text-white">
              <Mail className="h-4 w-4" />
              info@das-pay.com
            </a>
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 mt-0.5" />
              <span>Toshkent, Buyuk Ipak Yo&apos;li ko&apos;chasi, 15</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
