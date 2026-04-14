'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocale, useTranslations } from '@/components/providers/LocaleProvider';

/**
 * 404 Not Found page — lokalizatsiya qilingan
 */
export default function NotFound() {
  const { locale } = useLocale();
  const t = useTranslations();
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#042C53]/10">
          <span className="text-4xl font-bold text-[#042C53]">404</span>
        </div>
        <h1 className="mt-6 text-2xl font-bold text-foreground sm:text-3xl">
          {t('notFound.title')}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {t('notFound.description')}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild className="bg-[#042C53] hover:bg-[#185FA5]">
            <Link href={`/${locale}`}>
              <Home className="mr-2 h-4 w-4" />
              {t('notFound.home')}
            </Link>
          </Button>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('notFound.back')}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
