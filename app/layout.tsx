import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({ 
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://daspay.uz'),
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
    url: 'https://daspay.uz',
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
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'DasPay',
              url: 'https://daspay.uz',
              logo: 'https://daspay.uz/logo.png',
              description: "O'zbekistondan dunyo bo'ylab ishonchli yuk tashish xizmatlari",
              address: {
                '@type': 'PostalAddress',
                streetAddress: "Buyuk Ipak Yo'li ko'chasi, 15",
                addressLocality: 'Tashkent',
                addressCountry: 'UZ',
              },
              contactPoint: {
                '@type': 'ContactPoint',
                telephone: '+998-71-200-00-00',
                contactType: 'customer service',
                availableLanguage: ['Uzbek', 'Russian', 'English'],
              },
              sameAs: [
                'https://t.me/daspay',
                'https://instagram.com/daspay',
                'https://linkedin.com/company/daspay',
              ],
            }),
          }}
        />
      </head>
      <body className="font-sans antialiased">
        {children}
        <Toaster position="top-right" richColors closeButton />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  );
}
