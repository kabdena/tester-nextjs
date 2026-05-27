import type { MetadataRoute } from 'next';

const SITE_URL = 'https://tester-ayan.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/quiz', '/results'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
