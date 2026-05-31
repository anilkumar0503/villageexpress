import Link from 'next/link'
import { Calendar, User, ArrowLeft } from 'lucide-react'
import { prisma } from '@ve/db'
import { notFound } from 'next/navigation'

interface Blog {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  coverImage: string | null
  author: string | null
  publishedAt: string | null
  createdAt: string
  // SEO fields
  metaTitle: string | null
  metaDescription: string | null
  metaKeywords: string | null
  ogImage: string | null
  canonicalUrl: string | null
  // Relations
  categories: { id: string; category: { id: string; name: string; slug: string } }[]
  tags: { id: string; tag: { id: string; name: string; slug: string } }[]
}

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  
  const blog = await prisma.blog.findUnique({
    where: { slug, isPublished: true },
    select: {
      title: true,
      excerpt: true,
      metaTitle: true,
      metaDescription: true,
      metaKeywords: true,
      ogImage: true,
      canonicalUrl: true,
      coverImage: true,
    },
  })

  if (!blog) {
    return {
      title: 'Blog Not Found',
    }
  }

  const title = blog.metaTitle || blog.title
  const description = blog.metaDescription || blog.excerpt || 'Read this blog post on Village Express'
  const ogImage = blog.ogImage || blog.coverImage
  const canonicalUrl = blog.canonicalUrl

  return {
    title,
    description,
    keywords: blog.metaKeywords,
    openGraph: {
      title,
      description,
      images: ogImage ? [{ url: ogImage }] : undefined,
      type: 'article',
      publishedTime: blog.publishedAt ? new Date(blog.publishedAt).toISOString() : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
    ...(canonicalUrl && { alternates: { canonical: canonicalUrl } }),
  }
}

async function getBlog(slug: string): Promise<Blog | null> {
  const blog = await prisma.blog.findUnique({
    where: { slug, isPublished: true },
    include: {
      categories: {
        include: {
          category: true,
        },
      },
      tags: {
        include: {
          tag: true,
        },
      },
    },
  })

  return blog
}

export default async function BlogDetailPage({ params }: Props) {
  const { slug } = await params
  const blog = await getBlog(slug)

  if (!blog) {
    notFound()
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4">
          <Link href="/blogs" className="inline-flex items-center gap-2 text-primary-foreground/90 hover:text-primary-foreground mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Blogs
          </Link>
          <h1 className="text-4xl font-bold mb-4">{blog.title}</h1>
          <div className="flex items-center gap-4 text-primary-foreground/90">
            {blog.author && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{blog.author}</span>
              </div>
            )}
            {blog.publishedAt && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{new Date(blog.publishedAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>
          {/* Categories and Tags */}
          {(blog.categories.length > 0 || blog.tags.length > 0) && (
            <div className="flex items-center gap-2 mt-4 text-primary-foreground/90 text-sm">
              {blog.categories.map((cat) => (
                <span key={cat.id} className="bg-primary-foreground/20 px-2 py-1 rounded">
                  {cat.category.name}
                </span>
              ))}
              {blog.tags.map((tag) => (
                <span key={tag.id} className="bg-primary-foreground/20 px-2 py-1 rounded">
                  #{tag.tag.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Blog Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            {blog.coverImage && (
              <div className="mb-8 rounded-lg overflow-hidden">
                <img
                  src={blog.coverImage}
                  alt={blog.title}
                  className="w-full object-cover"
                />
              </div>
            )}
            {blog.excerpt && (
              <p className="text-xl text-muted-foreground mb-8 italic">{blog.excerpt}</p>
            )}
            <div className="prose prose-lg max-w-none">
              <div dangerouslySetInnerHTML={{ __html: blog.content }} />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card text-muted-foreground py-12 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-foreground font-semibold mb-4">Village Express</h3>
              <p className="text-sm">Connecting villages with reliable parcel delivery services.</p>
            </div>
            <div>
              <h4 className="text-foreground font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/" className="hover:text-foreground">Home</Link></li>
                <li><Link href="/about" className="hover:text-foreground">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-foreground">Contact</Link></li>
                <li><Link href="/testimonials" className="hover:text-foreground">Testimonials</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-foreground font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/terms" className="hover:text-foreground">Terms & Conditions</Link></li>
                <li><Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link></li>
                <li><Link href="/refund" className="hover:text-foreground">Refund Policy</Link></li>
                <li><Link href="/cookies" className="hover:text-foreground">Cookies Policy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-foreground font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li>support@villageexpress.com</li>
                <li>+91 1234567890</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-sm">
            <p>&copy; 2024 Village Express. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
