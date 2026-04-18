import type { MetadataRoute } from 'next';
import { locales } from '@/lib/i18n';
import { prisma } from '@/lib/prisma';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://daspay.uz';

/**
 * Public routes we want indexed. Admin / cabinet / feedback-token routes stay
 * out of the sitemap — they're gated or transactional.
 */
const PUBLIC_ROUTES: { path: string; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']; priority: number }[] = [
  { path: '', changeFrequency: 'weekly', priority: 1.0 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/services', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/pricing', changeFrequency: 'weekly', priority: 0.85 },
  { path: '/contact', changeFrequency: 'yearly', priority: 0.7 },
  { path: '/blog', changeFrequency: 'daily', priority: 0.8 },
  { path: '/tracking', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/faq', changeFrequency: 'monthly', priority: 0.6 },
];

function alternates(path: string): Record<string, string> {
  return Object.fromEntries(locales.map((l) => [l, `${SITE_URL}/${l}${path}`]));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const base: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const route of PUBLIC_ROUTES) {
      base.push({
        url: `${SITE_URL}/${locale}${route.path}`,
        lastModified: now,
        changeFrequency: route.changeFrequency,
        priority: route.priority,
        alternates: { languages: alternates(route.path) },
      });
    }
  }

  // Blog posts (if any)
  try {
    const posts = await prisma.blogPost.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 1000,
    });

    for (const post of posts) {
      for (const locale of locales) {
        base.push({
          url: `${SITE_URL}/${locale}/blog/${post.slug}`,
          lastModified: post.updatedAt,
          changeFrequency: 'weekly',
          priority: 0.6,
          alternates: { languages: alternates(`/blog/${post.slug}`) },
        });
      }
    }
  } catch {
    // Don't fail the whole sitemap if DB is unreachable at build time.
  }

  return base;
}
