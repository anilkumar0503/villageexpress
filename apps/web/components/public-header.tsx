'use client'

import Link from 'next/link'
import { Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { useEffect, useState } from 'react'

export function PublicHeader() {
  const { isAuthenticated } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <nav className="bg-background border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <Truck className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">Village Express</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/about" className="text-sm font-medium hover:text-primary transition">About Us</Link>
            <Link href="/partner-with-us" className="text-sm font-medium hover:text-primary transition">Partner With Us</Link>
            <Link href="/testimonials" className="text-sm font-medium hover:text-primary transition">Testimonials</Link>
            <Link href="/blogs" className="text-sm font-medium hover:text-primary transition">Blog</Link>
            <Link href="/contact" className="text-sm font-medium hover:text-primary transition">Contact</Link>
          </div>
          {mounted && isAuthenticated() ? (
            <Link
              href="/dashboard"
              className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-semibold hover:bg-primary/90 transition text-sm"
            >
              Go to Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-semibold hover:bg-primary/90 transition text-sm"
            >
              Get Started
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
