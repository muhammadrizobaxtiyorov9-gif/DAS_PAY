'use client';

import { motion } from 'framer-motion';
import { Shield, FileText } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { useTranslations } from '@/components/providers/LocaleProvider';

interface LegalPageContentProps {
  type: 'privacy' | 'terms';
}

/**
 * Shared component for Privacy Policy and Terms of Service pages
 */
function LegalPageContent({ type }: LegalPageContentProps) {
  const t = useTranslations();
  const Icon = type === 'privacy' ? Shield : FileText;

  // Get sections array from translations
  const sections = Array.from({ length: 5 }, (_, i) => ({
    title: t(`${type}.sections.${i}.title`),
    content: t(`${type}.sections.${i}.content`),
  }));

  return (
    <>
      <PageHeader
        titleKey={`${type}.title`}
        subtitleKey={`${type}.subtitle`}
      />

      <section className="bg-background py-16 lg:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Last Updated */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 flex items-center gap-2 text-sm text-muted-foreground"
          >
            <Icon className="h-4 w-4" />
            {t(`${type}.lastUpdated`)}
          </motion.div>

          {/* Sections */}
          <div className="space-y-8">
            {sections.map((section, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="rounded-xl border bg-card p-6 shadow-sm sm:p-8"
              >
                <h2 className="text-xl font-semibold text-foreground">
                  {section.title}
                </h2>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  {section.content}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export function PrivacyPageContent() {
  return <LegalPageContent type="privacy" />;
}

export function TermsPageContent() {
  return <LegalPageContent type="terms" />;
}
