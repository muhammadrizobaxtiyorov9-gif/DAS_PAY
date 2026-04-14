'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from './LanguageSwitcher';
import { MobileNav } from './MobileNav';
import { useLocale, useTranslations } from '@/components/providers/LocaleProvider';
import { cn } from '@/lib/utils';

const navItems = [
  { key: 'services', href: '/services' },
  { key: 'tracking', href: '/tracking' },
  { key: 'about', href: '/about' },
  { key: 'blog', href: '/blog' },
  { key: 'contract', href: '/contract' },
  { key: 'contact', href: '/contact' },
];

/**
 * Main site header with navigation, language switcher, and mobile menu
 */
export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { locale } = useLocale();
  const t = useTranslations();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          isScrolled
            ? 'bg-background/95 shadow-md backdrop-blur-md'
            : 'bg-transparent'
        )}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between lg:h-20">
            {/* Logo */}
            <Link
              href={`/${locale}`}
              className="flex items-center"
            >
              <div className="relative h-16 w-48 sm:h-20 sm:w-56 flex items-center justify-start -ml-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={isScrolled ? "/logo_blue.svg" : "/logo_white.svg"}
                  alt={t('common.brand')}
                  className=" max-w-full object-contain"
                  style={{ height: '130%' }}
                />
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden items-center gap-1 lg:flex">
              {navItems.map((item) => (
                <Link
                  key={item.key}
                  href={`/${locale}${item.href}`}
                  className={cn(
                    'rounded-md px-4 py-2 text-sm font-medium transition-colors',
                    isScrolled
                      ? 'text-foreground hover:bg-muted hover:text-[#185FA5]'
                      : 'text-white/90 hover:bg-white/10 hover:text-white'
                  )}
                >
                  {t(`nav.${item.key}`)}
                </Link>
              ))}
            </nav>

            {/* Right side actions */}
            <div className="flex items-center gap-3">
              <LanguageSwitcher isScrolled={isScrolled} />

              <Button
                asChild
                className={cn(
                  'hidden sm:inline-flex',
                  isScrolled
                    ? 'bg-[#042C53] text-white hover:bg-[#185FA5]'
                    : 'bg-white text-[#042C53] hover:bg-white/90'
                )}
              >
                <Link href={`/${locale}/contact`}>
                  {t('common.requestQuote')}
                </Link>
              </Button>

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'lg:hidden',
                  isScrolled
                    ? 'text-foreground hover:bg-muted'
                    : 'text-white hover:bg-white/10'
                )}
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <MobileNav onClose={() => setIsMobileMenuOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
