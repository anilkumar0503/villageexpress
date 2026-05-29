'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Calendar, User, ArrowLeft, Clock } from 'lucide-react'

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
}

export default function BlogDetailPage() {
  const params = useParams()
  const [blog, setBlog] = useState<Blog | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function fetchBlog() {
      try {
        const response = await fetch(`/api/blogs?slug=${params.slug}`)
        const data = await response.json()
        if (data.success && data.data) {
          setBlog(data.data)
        } else {
          setNotFound(true)
        }
      } catch (error) {
        console.error('Failed to fetch blog:', error)
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    fetchBlog()
  }, [params.slug])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading blog...</p>
        </div>
      </div>
    )
  }

  if (notFound || !blog) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Blog Not Found</h1>
          <Link href="/blogs" className="text-primary hover:underline">
            Back to Blogs
          </Link>
        </div>
      </div>
    )
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
