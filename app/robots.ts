import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://das-pay.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/'],
        disallow: [
          '/api/',
          '/*/admin',
          '/*/admin/',
          '/*/cabinet',
          '/*/cabinet/',
          '/*/admin-login',
          '/*/login',
          '/*/feedback/',
          '/*/invoice/',
          // Legacy SEO-spam paths (gambling/casino injections from prior domain history).
          // Block so crawlers stop re-fetching 307/404 ghosts.
          '/slot-gacor*',
          '/*/slot-gacor*',
          '/toto-macau*',
          '/*/toto-macau*',
          '/toto*',
          '/*/toto*',
          '/gacor*',
          '/*/gacor*',
          '/judi*',
          '/*/judi*',
          '/casino*',
          '/*/casino*',
          '/poker*',
          '/*/poker*',
          '/bo-peng*',
          '/*/bo-peng*',
          '/*bopeng*',
          '/*/bopeng*',
          '/sbobet*',
          '/*/sbobet*',
        ],
      },
      {
        userAgent: ['AhrefsBot', 'SemrushBot', 'MJ12bot', 'DotBot', 'PetalBot'],
        disallow: '/',
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
