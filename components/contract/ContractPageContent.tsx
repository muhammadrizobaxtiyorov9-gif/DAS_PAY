'use client';

import { motion } from 'framer-motion';
import { FileText, Shield, Clock, CheckCircle } from 'lucide-react';
import { ContractForm } from './ContractForm';
import { useTranslations } from '@/components/providers/LocaleProvider';

export function ContractPageContent() {
  const t = useTranslations();

  const features = [
    { icon: FileText, title: t('contractPage.features.document.title'), desc: t('contractPage.features.document.desc') },
    { icon: Shield, title: t('contractPage.features.legal.title'), desc: t('contractPage.features.legal.desc') },
    { icon: Clock, title: t('contractPage.features.instant.title'), desc: t('contractPage.features.instant.desc') },
    { icon: CheckCircle, title: t('contractPage.features.unique.title'), desc: t('contractPage.features.unique.desc') },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#042C53] via-[#0d3d6e] to-[#185FA5] pt-28 pb-16">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-white/5 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-[#185FA5]/30 blur-3xl"
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-xl">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              {t('contractPage.title')}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-white/70 sm:text-lg">
              {t('contractPage.description')}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4"
          >
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="flex flex-col items-center gap-2 rounded-2xl bg-white/8 backdrop-blur-sm border border-white/10 px-4 py-5 text-center"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-xs font-semibold text-white">{f.title}</p>
                  <p className="text-xs text-white/60 leading-tight">{f.desc}</p>
                </div>
              );
            })}
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <ContractForm />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center text-xs text-slate-400 leading-relaxed"
        >
          {t('contractPage.legalNotice')}
        </motion.p>
      </section>
    </main>
  );
}
