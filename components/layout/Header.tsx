'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { AnimatePresence } from 'framer-motion';
import { Menu } from 'lucide-react';
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
] as const;

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { locale } = useLocale();
  const t = useTranslations();

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setIsScrolled(window.scrollY > 10);
        ticking = false;
      });
    };

    setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isMobileMenuOpen]);

  const closeMobile = useCallback(() => setIsMobileMenuOpen(false), []);
  const openMobile = useCallback(() => setIsMobileMenuOpen(true), []);

  const localizedNav = useMemo(
    () => navItems.map((item) => ({ ...item, fullHref: `/${locale}${item.href}` })),
    [locale]
  );

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          isScrolled ? 'bg-background/95 shadow-md backdrop-blur-md' : 'bg-transparent'
        )}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between lg:h-20">
            <Link href={`/${locale}`} prefetch className="flex items-center">
              <div className="relative h-16 w-48 sm:h-20 sm:w-56 flex items-center justify-start -ml-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={isScrolled ? '/logo_blue.svg' : '/logo_white.svg'}
                  alt={t('common.brand')}
                  className=" max-w-full object-contain"
                  style={{ height: '130%' }}
                />
              </div>
            </Link>

            <nav className="hidden items-center gap-1 lg:flex">
              {localizedNav.map((item) => (
                <Link
                  key={item.key}
                  href={item.fullHref}
                  prefetch
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
                <Link href={`/${locale}/contact`} prefetch>
                  {t('common.requestQuote')}
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className={cn(
                  'hidden md:inline-flex border-2',
                  isScrolled
                    ? 'border-[#042C53] bg-transparent text-[#042C53] hover:bg-blue-50'
                    : 'border-white bg-[#042C53] text-white hover:bg-white/10'
                )}
              >
                <Link href={`/${locale}/login`} prefetch>
                  Kabinetga kirish
                </Link>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'lg:hidden',
                  isScrolled
                    ? 'text-foreground hover:bg-muted'
                    : 'text-white hover:bg-white/10'
                )}
                onClick={openMobile}
              >
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isMobileMenuOpen && <MobileNav onClose={closeMobile} />}
      </AnimatePresence>
    </>
  );
}
