/**
 * Schema.org JSON-LD builders for DasPay.
 *
 * Usage:
 *   <script
 *     type="application/ld+json"
 *     dangerouslySetInnerHTML={{ __html: JSON.stringify(buildOrganizationGraph()) }}
 *   />
 *
 * Cross-reference @id's instead of embedding nested objects so Google can
 * connect entities across pages (Organization ↔ WebSite ↔ Article).
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://das-pay.com';

export const SCHEMA_IDS = {
  business: `${SITE_URL}/#business`,
  website: `${SITE_URL}/#website`,
  logo: `${SITE_URL}/#logo`,
} as const;

const BRAND = {
  name: 'DasPay',
  alternateName: ['Das Pay', 'DASPAY', 'Дас Пей'],
  legalName: 'DasPay LLC',
  foundingDate: '2024',
  logo: {
    url: `${SITE_URL}/logo.png`,
    width: 512,
    height: 512,
  },
  ogImage: `${SITE_URL}/og-image.jpg`,
  description: {
    uz: "O'zbekistondan xalqaro yuk tashish va logistika xizmatlari",
    ru: 'Международная логистика и грузоперевозки из Узбекистана',
    en: 'International freight forwarding from Uzbekistan',
  },
  address: {
    streetAddress: "Buyuk Ipak Yo'li ko'chasi, 15",
    addressLocality: 'Tashkent',
    addressRegion: 'Tashkent',
    postalCode: '100000',
    addressCountry: 'UZ',
  },
  geo: {
    // Approximate — update with exact office coordinates from Google Maps.
    latitude: 41.3111,
    longitude: 69.2797,
  },
  openingHours: {
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    opens: '09:00',
    closes: '18:00',
  },
  contactPoints: [
    {
      telephone: '+998-95-558-00-07',
      contactType: 'customer service',
      availableLanguage: ['Uzbek', 'Russian', 'English'],
      areaServed: ['UZ', 'RU', 'KZ', 'CN', 'TR'],
    },
    {
      telephone: '+998-95-558-00-07',
      contactType: 'sales',
      availableLanguage: ['Uzbek', 'Russian', 'English'],
      areaServed: ['UZ', 'RU', 'KZ', 'CN', 'TR', 'EU'],
    },
  ],
  sameAs: [
    'https://t.me/daspay',
    'https://instagram.com/daspay',
    'https://linkedin.com/company/daspay',
    'https://facebook.com/daspay',
  ],
  areaServed: [
    { name: 'Uzbekistan', code: 'UZ' },
    { name: 'Russia', code: 'RU' },
    { name: 'Kazakhstan', code: 'KZ' },
    { name: 'Kyrgyzstan', code: 'KG' },
    { name: 'Tajikistan', code: 'TJ' },
    { name: 'China', code: 'CN' },
    { name: 'Turkey', code: 'TR' },
    { name: 'Germany', code: 'DE' },
    { name: 'Poland', code: 'PL' },
  ],
  priceRange: '$$',
};

type Locale = 'uz' | 'ru' | 'en';

function organization(locale: Locale = 'uz') {
  return {
    '@type': ['Organization', 'LocalBusiness'],
    '@id': SCHEMA_IDS.business,
    name: BRAND.name,
    alternateName: BRAND.alternateName,
    legalName: BRAND.legalName,
    foundingDate: BRAND.foundingDate,
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      '@id': SCHEMA_IDS.logo,
      url: BRAND.logo.url,
      width: BRAND.logo.width,
      height: BRAND.logo.height,
    },
    image: BRAND.ogImage,
    description: BRAND.description[locale],
    priceRange: BRAND.priceRange,
    address: {
      '@type': 'PostalAddress',
      ...BRAND.address,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: BRAND.geo.latitude,
      longitude: BRAND.geo.longitude,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: BRAND.openingHours.dayOfWeek,
        opens: BRAND.openingHours.opens,
        closes: BRAND.openingHours.closes,
      },
    ],
    contactPoint: BRAND.contactPoints.map((c) => ({
      '@type': 'ContactPoint',
      ...c,
    })),
    sameAs: BRAND.sameAs,
    areaServed: BRAND.areaServed.map((a) => ({
      '@type': 'Country',
      name: a.name,
      identifier: a.code,
    })),
  };
}

function website(locale: Locale = 'uz') {
  return {
    '@type': 'WebSite',
    '@id': SCHEMA_IDS.website,
    url: SITE_URL,
    name: BRAND.name,
    alternateName: BRAND.alternateName,
    description: BRAND.description[locale],
    publisher: { '@id': SCHEMA_IDS.business },
    inLanguage: ['uz', 'ru', 'en'],
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/${locale}/tracking?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Root-level graph. Include once per page (layout is fine).
 */
export function buildOrganizationGraph(locale: Locale = 'uz') {
  return {
    '@context': 'https://schema.org',
    '@graph': [organization(locale), website(locale)],
  };
}

/**
 * BreadcrumbList — use on every page except home.
 */
export function buildBreadcrumb(
  items: { name: string; url: string }[]
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
    })),
  };
}

const BREADCRUMB_LABELS: Record<string, Record<Locale, string>> = {
  home: { uz: 'Bosh sahifa', ru: 'Главная', en: 'Home' },
  about: { uz: 'Biz haqimizda', ru: 'О нас', en: 'About' },
  services: { uz: 'Xizmatlar', ru: 'Услуги', en: 'Services' },
  contact: { uz: "Bog'lanish", ru: 'Контакты', en: 'Contact' },
  blog: { uz: 'Blog', ru: 'Блог', en: 'Blog' },
  tracking: { uz: 'Kuzatuv', ru: 'Отслеживание', en: 'Tracking' },
  calculator: { uz: 'Kalkulyator', ru: 'Калькулятор', en: 'Calculator' },
  privacy: { uz: 'Maxfiylik', ru: 'Конфиденциальность', en: 'Privacy' },
  terms: { uz: 'Shartlar', ru: 'Условия', en: 'Terms' },
};

/**
 * Build breadcrumbs from a locale + ordered path segments.
 *   breadcrumbsFor('uz', ['services', 'road'], 'Avtomobil tashish')
 *   → Home > Services > Avtomobil tashish
 * The last argument may be a raw label for dynamic segments (blog slug, service slug).
 */
export function breadcrumbsFor(
  locale: Locale,
  segments: string[],
  leafLabel?: string
) {
  const crumbs: { name: string; url: string }[] = [
    { name: BREADCRUMB_LABELS.home[locale], url: `/${locale}` },
  ];
  let path = `/${locale}`;
  segments.forEach((seg, i) => {
    path += `/${seg}`;
    const isLeaf = i === segments.length - 1;
    const label =
      isLeaf && leafLabel
        ? leafLabel
        : BREADCRUMB_LABELS[seg]?.[locale] ?? seg;
    crumbs.push({ name: label, url: path });
  });
  return buildBreadcrumb(crumbs);
}

/**
 * FAQPage — use on /faq and any page with inline FAQ. Produces rich snippets.
 */
export function buildFAQ(items: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

/**
 * Service — use on /services and each sub-service page.
 */
export function buildService(input: {
  name: string;
  description: string;
  serviceType: string;
  url?: string;
  offers?: { name: string; description?: string }[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: input.name,
    description: input.description,
    serviceType: input.serviceType,
    provider: { '@id': SCHEMA_IDS.business },
    areaServed: BRAND.areaServed.map((a) => ({
      '@type': 'Country',
      name: a.name,
    })),
    ...(input.url && { url: input.url.startsWith('http') ? input.url : `${SITE_URL}${input.url}` }),
    ...(input.offers && {
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: input.name,
        itemListElement: input.offers.map((offer) => ({
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: offer.name,
            ...(offer.description && { description: offer.description }),
          },
        })),
      },
    }),
  };
}

/**
 * Article — use on blog posts.
 */
export function buildArticle(input: {
  title: string;
  description: string;
  image: string;
  url: string;
  publishedAt: Date | string;
  updatedAt?: Date | string;
  authorName?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.title,
    description: input.description,
    image: input.image.startsWith('http') ? input.image : `${SITE_URL}${input.image}`,
    url: input.url.startsWith('http') ? input.url : `${SITE_URL}${input.url}`,
    datePublished: new Date(input.publishedAt).toISOString(),
    dateModified: new Date(input.updatedAt ?? input.publishedAt).toISOString(),
    author: {
      '@type': input.authorName ? 'Person' : 'Organization',
      name: input.authorName ?? BRAND.name,
    },
    publisher: { '@id': SCHEMA_IDS.business },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': input.url.startsWith('http') ? input.url : `${SITE_URL}${input.url}`,
    },
  };
}
