'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowLeft, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { useLocale, useTranslations } from '@/components/providers/LocaleProvider';

// Sample blog data
const blogData: Record<string, {
  title: Record<string, string>;
  content: Record<string, string>;
  date: string;
  readTime: number;
}> = {
  'shipping-from-china-to-uzbekistan': {
    title: {
      uz: "Xitoydan O'zbekistonga yuk tashish: to'liq qo'llanma",
      ru: 'Перевозка грузов из Китая в Узбекистан: полное руководство',
      en: 'Shipping from China to Uzbekistan: Complete Guide',
    },
    content: {
      uz: `
        <p>Xitoy dunyo bo'ylab eksport qiluvchi eng yirik mamlakatlardan biri hisoblanadi. O'zbekiston tadbirkorlari ham Xitoydan turli tovarlarni import qilishda faol ishtirok etmoqda.</p>
        
        <h2>Transport turlari</h2>
        <p>Xitoydan O'zbekistonga yuk tashishning bir necha usullari mavjud:</p>
        <ul>
          <li><strong>Temir yo'l transporti</strong> - eng mashhur va tejamkor variant</li>
          <li><strong>Avtotransport</strong> - kichik hajmdagi yuklar uchun qulay</li>
          <li><strong>Aviatransport</strong> - tezkor yetkazib berish uchun</li>
        </ul>
        
        <h2>Bojxona rasmiylashtirish</h2>
        <p>Har qanday import operatsiyasi bojxona nazoratidan o'tadi. Kerakli hujjatlar:</p>
        <ul>
          <li>Shartnoma</li>
          <li>Invoice</li>
          <li>Packing list</li>
          <li>Sertifikatlar</li>
        </ul>
      `,
      ru: `
        <p>Китай является одним из крупнейших экспортеров в мире. Узбекские предприниматели активно участвуют в импорте различных товаров из Китая.</p>
        
        <h2>Виды транспорта</h2>
        <p>Существует несколько способов доставки грузов из Китая в Узбекистан:</p>
        <ul>
          <li><strong>Железнодорожный транспорт</strong> - самый популярный и экономичный вариант</li>
          <li><strong>Автотранспорт</strong> - удобен для небольших объемов</li>
          <li><strong>Авиатранспорт</strong> - для срочной доставки</li>
        </ul>
        
        <h2>Таможенное оформление</h2>
        <p>Любая импортная операция проходит таможенный контроль. Необходимые документы:</p>
        <ul>
          <li>Контракт</li>
          <li>Инвойс</li>
          <li>Упаковочный лист</li>
          <li>Сертификаты</li>
        </ul>
      `,
      en: `
        <p>China is one of the largest exporters in the world. Uzbek entrepreneurs are actively importing various goods from China.</p>
        
        <h2>Transport Types</h2>
        <p>There are several ways to ship cargo from China to Uzbekistan:</p>
        <ul>
          <li><strong>Railway transport</strong> - the most popular and cost-effective option</li>
          <li><strong>Road transport</strong> - suitable for small volumes</li>
          <li><strong>Air transport</strong> - for urgent delivery</li>
        </ul>
        
        <h2>Customs Clearance</h2>
        <p>Any import operation goes through customs control. Required documents:</p>
        <ul>
          <li>Contract</li>
          <li>Invoice</li>
          <li>Packing list</li>
          <li>Certificates</li>
        </ul>
      `,
    },
    date: '2024-01-15',
    readTime: 8,
  },
  'new-customs-regulations-2024': {
    title: {
      uz: '2024-yil uchun yangi bojxona qoidalari',
      ru: 'Новые таможенные правила на 2024 год',
      en: 'New Customs Regulations for 2024',
    },
    content: {
      uz: '<p>2024-yilda bojxona qoidalarida bir qator muhim o\'zgarishlar kuchga kirdi...</p>',
      ru: '<p>В 2024 году вступили в силу ряд важных изменений в таможенных правилах...</p>',
      en: '<p>In 2024, a number of important changes in customs regulations came into force...</p>',
    },
    date: '2024-01-10',
    readTime: 5,
  },
  'multimodal-transport-guide': {
    title: {
      uz: "Multimodal tashish: qachon va nima uchun kerak?",
      ru: 'Мультимодальные перевозки: когда и зачем?',
      en: 'Multimodal Transport: When and Why?',
    },
    content: {
      uz: '<p>Multimodal tashish - bu bir necha transport turlarini birlashtirgan yuk tashish usuli...</p>',
      ru: '<p>Мультимодальная перевозка - это способ доставки грузов, объединяющий несколько видов транспорта...</p>',
      en: '<p>Multimodal transport is a cargo delivery method that combines several types of transport...</p>',
    },
    date: '2024-01-05',
    readTime: 6,
  },
};

interface BlogDetailContentProps {
  slug: string;
}

/**
 * Blog detail content component
 */
export function BlogDetailContent({ slug }: BlogDetailContentProps) {
  const { locale } = useLocale();
  const t = useTranslations();
  const post = blogData[slug];

  if (!post) return null;

  return (
    <>
      <PageHeader
        titleKey="nav.blog"
      />
      
      <article className="bg-background py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Back link */}
            <Link
              href={`/${locale}/blog`}
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('nav.blog')}
            </Link>

            {/* Title */}
            <h1 className="mt-6 text-balance text-3xl font-bold text-foreground sm:text-4xl">
              {post.title[locale as keyof typeof post.title] || post.title.en}
            </h1>

            {/* Meta */}
            <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
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

            {/* Featured image placeholder */}
            <div className="mt-8 aspect-video overflow-hidden rounded-2xl bg-gradient-to-br from-[#042C53] to-[#185FA5]" />

            {/* Content */}
            <div 
              className="prose prose-lg mt-8 max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-li:text-muted-foreground"
              dangerouslySetInnerHTML={{ 
                __html: post.content[locale as keyof typeof post.content] || post.content.en 
              }}
            />

            {/* Share */}
            <div className="mt-12 flex items-center justify-between border-t pt-8">
              <Button asChild variant="outline">
                <Link href={`/${locale}/blog`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t('nav.blog')}
                </Link>
              </Button>
              <Button variant="outline" size="icon">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </div>
      </article>
    </>
  );
}
