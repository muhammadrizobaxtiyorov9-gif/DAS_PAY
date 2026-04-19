import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { Toaster } from 'sonner';
import { buildOrganizationGraph } from '@/lib/seo/structured-data';
import { GoogleAnalytics } from '@/components/seo/GoogleAnalytics';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://das-pay.com'),
  title: {
    default: 'DasPay - Xalqaro Logistika Xizmatlari | International Logistics',
    template: '%s | DasPay',
  },
  description: "O'zbekistondan MDH, Xitoy, Turkiya va Yevropa davlatlariga ishonchli yuk tashish xizmatlari. Reliable freight services from Uzbekistan worldwide.",
  keywords: [
    'logistika',
    'yuk tashish',
    'cargo',
    'freight',
    'Uzbekistan',
    'logistics',
    'international shipping',
    'грузоперевозки',
    'логистика',
  ],
  authors: [{ name: 'DasPay' }],
  creator: 'DasPay',
  publisher: 'DasPay',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'uz_UZ',
    alternateLocale: ['ru_RU', 'en_US'],
    url: 'https://das-pay.com',
    siteName: 'DasPay',
    title: 'DasPay - Xalqaro Logistika Xizmatlari',
    description: "O'zbekistondan dunyo bo'ylab ishonchli yuk tashish xizmatlari",
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'DasPay Logistics',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DasPay - International Logistics',
    description: 'Reliable freight services from Uzbekistan worldwide',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || 'YJ6i5QxvmEIKEikcrocVdLDwaeXvKfPjdfktZ7Qg4aU',
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION || '16f9215a2e6ec42e',
    other: {
      ...(process.env.NEXT_PUBLIC_BING_VERIFICATION
        ? { 'msvalidate.01': process.env.NEXT_PUBLIC_BING_VERIFICATION }
        : {}),
      ...(process.env.NEXT_PUBLIC_FB_DOMAIN_VERIFICATION
        ? { 'facebook-domain-verification': process.env.NEXT_PUBLIC_FB_DOMAIN_VERIFICATION }
        : {}),
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#042C53',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz" data-scroll-behavior="smooth" className={`${inter.variable} bg-background`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(buildOrganizationGraph('uz')),
          }}
        />
      </head>
      <body className="font-sans antialiased">
        {children}
        <Toaster position="top-right" richColors closeButton />
        {process.env.NODE_ENV === 'production' && <Analytics />}
        <GoogleAnalytics />
      </body>
    </html>
  );
}
