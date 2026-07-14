import type { MetadataRoute } from 'next'
import { prisma } from '@ve/db'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.villageexpress.in'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: APP_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${APP_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${APP_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${APP_URL}/blogs`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${APP_URL}/testimonials`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${APP_URL}/partner-with-us`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${APP_URL}/partner-with-us/captain`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${APP_URL}/partner-with-us/point-manager`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${APP_URL}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${APP_URL}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${APP_URL}/refund`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ]

  let blogRoutes: MetadataRoute.Sitemap = []
  try {
    const blogs = await prisma.blog.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
    })
    blogRoutes = blogs.map((blog) => ({
      url: `${APP_URL}/blogs/${blog.slug}`,
      lastModified: blog.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  } catch {
    // ignore DB errors during sitemap generation
  }

  return [...staticRoutes, ...blogRoutes]
}
