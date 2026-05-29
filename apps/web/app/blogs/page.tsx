'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Calendar, User, ArrowLeft, Clock } from 'lucide-react'

interface Blog {
  id: string
  title: string
  slug: string
  excerpt: string | null
  coverImage: string | null
  author: string | null
  publishedAt: string | null
  createdAt: string
}

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBlogs() {
      try {
        const response = await fetch('/api/blogs')
        const data = await response.json()
        if (data.success) {
          setBlogs(data.data.items)
        }
      } catch (error) {
        console.error('Failed to fetch blogs:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchBlogs()
  }, [])

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4">
          <Link href="/" className="inline-flex items-center gap-2 text-primary-foreground/90 hover:text-primary-foreground mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold mb-4">Our Blog</h1>
          <p className="text-xl text-primary-foreground/90">Latest news, updates, and insights</p>
        </div>
      </section>

      {/* Blogs Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">Loading blogs...</p>
            </div>
          ) : blogs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No blogs published yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogs.map((blog) => (
                <Link key={blog.id} href={`/blogs/${blog.slug}`} className="block">
                  <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden hover:shadow-md transition">
                    {blog.coverImage && (
                      <div className="h-48 bg-muted">
                        <img
                          src={blog.coverImage}
                          alt={blog.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <h2 className="text-xl font-semibold mb-2 line-clamp-2">{blog.title}</h2>
                      {blog.excerpt && (
                        <p className="text-muted-foreground mb-4 line-clamp-3">{blog.excerpt}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {blog.author && (
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>{blog.author}</span>
                          </div>
                        )}
                        {blog.publishedAt && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(blog.publishedAt).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
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
