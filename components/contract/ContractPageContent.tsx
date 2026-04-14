'use client';

import { motion } from 'framer-motion';
import { FileText, Shield, Clock, CheckCircle } from 'lucide-react';
import { ContractForm } from './ContractForm';

const FEATURES = [
  {
    icon: FileText,
    title: 'Готовый документ',
    desc: 'Автоматически формируется Word-документ договора',
  },
  {
    icon: Shield,
    title: 'Юридическая сила',
    desc: 'Соответствует законодательству Республики Узбекистан',
  },
  {
    icon: Clock,
    title: 'Мгновенно',
    desc: 'Договор готов в течение нескольких секунд',
  },
  {
    icon: CheckCircle,
    title: 'Уникальный номер',
    desc: 'Каждому договору присваивается автоматический номер',
  },
] as const;

/**
 * Contract page content with hero section and multi-step form
 */
export function ContractPageContent() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#042C53] via-[#0d3d6e] to-[#185FA5] pt-28 pb-16">
        {/* Decorative blobs */}
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
              Заключить договор
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-white/70 sm:text-lg">
              Заполните форму — и получите готовый договор с DasPay на оказание
              платёжных услуг. Документ генерируется автоматически с
              уникальным номером.
            </p>
          </motion.div>

          {/* ── Feature cards ── */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4"
          >
            {FEATURES.map((f) => {
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

      {/* ── Form section ── */}
      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <ContractForm />
        </motion.div>

        {/* ── Legal notice ── */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center text-xs text-slate-400 leading-relaxed"
        >
          Заполняя форму, вы подтверждаете правомочность предоставляемых данных.
          Договор приобретает юридическую силу после подписания обеими Сторонами.
          Все данные защищены и не передаются третьим лицам.
        </motion.p>
      </section>
    </main>
  );
}
