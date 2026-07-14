import type { MetadataRoute } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.villageexpress.in'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/about',
          '/contact',
          '/blogs',
          '/blogs/',
          '/testimonials',
          '/partner-with-us',
          '/terms',
          '/privacy',
          '/refund',
        ],
        disallow: [
          '/dashboard',
          '/api/',
          '/admin',
          '/bookings/new',
          '/profile',
          '/wallet',
          '/captain',
          '/point-manager',
        ],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  }
}
