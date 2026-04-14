'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/components/providers/LocaleProvider';
import { locales, localeNames, type Locale } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface LanguageSwitcherProps {
  isScrolled?: boolean;
}

/**
 * Dropdown menu for switching between languages
 */
export function LanguageSwitcher({ isScrolled = true }: LanguageSwitcherProps) {
  const { locale: currentLocale } = useLocale();
  const pathname = usePathname();

  const getLocalizedPath = (newLocale: Locale) => {
    const segments = pathname.split('/').filter(Boolean);
    if (locales.includes(segments[0] as Locale)) {
      segments[0] = newLocale;
    } else {
      segments.unshift(newLocale);
    }
    return '/' + segments.join('/');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'gap-2',
            isScrolled
              ? 'text-foreground hover:bg-muted'
              : 'text-white hover:bg-white/10'
          )}
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{localeNames[currentLocale]}</span>
          <span className="sm:hidden">{currentLocale.toUpperCase()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {locales.map((locale) => (
          <DropdownMenuItem key={locale} asChild>
            <Link
              href={getLocalizedPath(locale)}
              className={cn(
                'flex w-full cursor-pointer items-center gap-2',
                currentLocale === locale && 'font-medium text-[#185FA5]'
              )}
            >
              <span className="text-base">
                {locale === 'uz' ? '🇺🇿' : locale === 'ru' ? '🇷🇺' : '🇬🇧'}
              </span>
              {localeNames[locale]}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
