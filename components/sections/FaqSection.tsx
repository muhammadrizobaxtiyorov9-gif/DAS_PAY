import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { getTranslator, type Locale, type Messages } from '@/lib/i18n-translator';
import { Reveal } from '@/components/shared/motion-primitives';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildFAQ } from '@/lib/seo/structured-data';

interface FaqSectionProps {
  locale: Locale;
  messages: Messages;
}

export function FaqSection({ messages }: FaqSectionProps) {
  const t = getTranslator(messages);

  const faqItems = Array.from({ length: 8 }, (_, i) => ({
    question: t(`faq.items.${i}.question`),
    answer: t(`faq.items.${i}.answer`),
  })).filter((item) => !item.question.startsWith('faq.items.'));

  return (
    <section className="bg-secondary py-16 lg:py-24">
      {faqItems.length > 0 && <JsonLd data={buildFAQ(faqItems)} />}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
            {t('faq.title')}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            {t('faq.subtitle')}
          </p>
        </Reveal>

        <Reveal delay={0.1} className="mx-auto mt-12 max-w-3xl">
          <Accordion type="single" collapsible className="space-y-4">
            {faqItems.map((item, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="rounded-xl border bg-card px-6 shadow-sm"
              >
                <AccordionTrigger className="text-left text-base font-medium hover:no-underline [&[data-state=open]]:text-[#185FA5]">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}
