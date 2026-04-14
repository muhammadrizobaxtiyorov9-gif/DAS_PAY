import type { Metadata } from 'next';
import { ContractPageContent } from '@/components/contract/ContractPageContent';

interface ContractPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ContractPageProps): Promise<Metadata> {
  const { locale } = await params;

  const titles: Record<string, string> = {
    uz: 'Shartnoma tuzish',
    ru: 'Заключить договор',
    en: 'Sign a Contract',
  };

  const descriptions: Record<string, string> = {
    uz: "DasPay bilan rasmiy shartnoma tuzing. Onlayn ariza to'ldiring va darhol Word hujjatini yuklab oling.",
    ru: 'Оформите официальный договор с DasPay онлайн. Заполните форму и скачайте готовый документ Word.',
    en: 'Sign an official contract with DasPay online. Fill out the form and download the ready Word document.',
  };

  return {
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
  };
}

/**
 * Contract signing page — online form to generate a DasPay service agreement
 */
export default function ContractPage() {
  return <ContractPageContent />;
}
