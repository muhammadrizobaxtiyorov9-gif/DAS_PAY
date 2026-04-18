import { Star, Quote } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getTranslator, type Locale, type Messages } from '@/lib/i18n-translator';
import { Reveal } from '@/components/shared/motion-primitives';

const testimonials = [
  {
    name: 'Aziz Karimov',
    company: 'Karimov Trading LLC',
    rating: 5,
    quote: {
      uz: "DasPay bilan 3 yildan beri ishlaymiz. Har doim o'z vaqtida yetkazib berishadi va narxlari ham juda qulay.",
      ru: 'Работаем с DasPay уже 3 года. Всегда доставляют вовремя и цены очень приемлемые.',
      en: "We've been working with DasPay for 3 years. They always deliver on time and prices are very reasonable.",
    },
  },
  {
    name: 'Olga Petrova',
    company: 'GlobalTex',
    rating: 5,
    quote: {
      uz: 'Xitoydan tekstil mahsulotlarini olib kelishda DasPay bizning asosiy hamkorimiz. Professional xizmat!',
      ru: 'DasPay - наш основной партнер по доставке текстиля из Китая. Профессиональный сервис!',
      en: 'DasPay is our main partner for textile delivery from China. Professional service!',
    },
  },
  {
    name: 'Rustam Aliyev',
    company: 'Aliyev Electronics',
    rating: 5,
    quote: {
      uz: "Bojxona rasmiylashtiruvida juda ko'p yordam berishdi. Hujjatlar bilan muammo bo'lmadi.",
      ru: 'Очень помогли с таможенным оформлением. Никаких проблем с документами.',
      en: 'They helped a lot with customs clearance. No problems with documents.',
    },
  },
] as const;

interface TestimonialsSectionProps {
  locale: Locale;
  messages: Messages;
}

export function TestimonialsSection({ locale, messages }: TestimonialsSectionProps) {
  const t = getTranslator(messages);

  return (
    <section className="bg-background py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
            {t('testimonials.title')}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            {t('testimonials.subtitle')}
          </p>
        </Reveal>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <Reveal
              key={testimonial.name}
              delay={index * 0.1}
              className="relative rounded-2xl border bg-card p-6 shadow-sm"
            >
              <div className="absolute -top-3 right-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#042C53]">
                  <Quote className="h-5 w-5 text-white" />
                </div>
              </div>

              <div className="flex gap-1">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              <p className="mt-4 text-muted-foreground leading-relaxed">
                &quot;{testimonial.quote[locale] || testimonial.quote.en}&quot;
              </p>

              <div className="mt-6 flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-[#042C53] text-white">
                    {testimonial.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.company}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
