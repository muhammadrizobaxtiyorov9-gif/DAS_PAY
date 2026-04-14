'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, ArrowRight, Clock } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { useLocale, useTranslations } from '@/components/providers/LocaleProvider';

// Sample blog posts - in production, fetch from database
const blogPosts = [
  {
    slug: 'shipping-from-china-to-uzbekistan',
    title: {
      uz: "Xitoydan O'zbekistonga yuk tashish: to'liq qo'llanma",
      ru: 'Перевозка грузов из Китая в Узбекистан: полное руководство',
      en: 'Shipping from China to Uzbekistan: Complete Guide',
    },
    excerpt: {
      uz: "Xitoydan O'zbekistonga yuk olib kelishning eng samarali usullari haqida batafsil ma'lumot.",
      ru: 'Подробная информация о наиболее эффективных способах доставки грузов из Китая в Узбекистан.',
      en: 'Detailed information about the most effective ways to ship cargo from China to Uzbekistan.',
    },
    date: '2024-01-15',
    readTime: 8,
  },
  {
    slug: 'new-customs-regulations-2024',
    title: {
      uz: '2024-yil uchun yangi bojxona qoidalari',
      ru: 'Новые таможенные правила на 2024 год',
      en: 'New Customs Regulations for 2024',
    },
    excerpt: {
      uz: "O'zbekiston bojxona qoidalaridagi o'zgarishlar va ularning biznesingizga ta'siri.",
      ru: 'Изменения в таможенных правилах Узбекистана и их влияние на ваш бизнес.',
      en: 'Changes in Uzbekistan customs regulations and their impact on your business.',
    },
    date: '2024-01-10',
    readTime: 5,
  },
  {
    slug: 'multimodal-transport-guide',
    title: {
      uz: "Multimodal tashish: qachon va nima uchun kerak?",
      ru: 'Мультимодальные перевозки: когда и зачем?',
      en: 'Multimodal Transport: When and Why?',
    },
    excerpt: {
      uz: "Turli transport turlarini birlashtirish orqali xarajatlarni kamaytirish va samaradorlikni oshirish.",
      ru: 'Снижение затрат и повышение эффективности за счет комбинирования различных видов транспорта.',
      en: 'Reducing costs and increasing efficiency by combining different transport modes.',
    },
    date: '2024-01-05',
    readTime: 6,
  },
];

/**
 * Blog listing page content
 */
export function BlogPageContent() {
  const { locale } = useLocale();
  const t = useTranslations();

  return (
    <>
      <PageHeader
        titleKey="nav.blog"
      />
      
      <section className="bg-background py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {blogPosts.map((post, index) => (
              <motion.article
                key={post.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-lg"
              >
                {/* Image placeholder */}
                <div className="aspect-video bg-gradient-to-br from-[#042C53] to-[#185FA5]" />
                
                <div className="p-6">
                  {/* Meta */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(post.date).toLocaleDateString(
                        locale === 'uz' ? 'uz-UZ' : locale === 'ru' ? 'ru-RU' : 'en-US',
                        { year: 'numeric', month: 'long', day: 'numeric' }
                      )}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {post.readTime} min
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="mt-3 text-xl font-semibold text-foreground group-hover:text-[#185FA5]">
                    <Link href={`/${locale}/blog/${post.slug}`}>
                      {post.title[locale as keyof typeof post.title] || post.title.en}
                    </Link>
                  </h2>

                  {/* Excerpt */}
                  <p className="mt-2 text-muted-foreground line-clamp-3">
                    {post.excerpt[locale as keyof typeof post.excerpt] || post.excerpt.en}
                  </p>

                  {/* Read more link */}
                  <Link
                    href={`/${locale}/blog/${post.slug}`}
                    className="mt-4 inline-flex items-center text-sm font-medium text-[#185FA5] hover:text-[#378ADD]"
                  >
                    {t('common.learnMore')}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
