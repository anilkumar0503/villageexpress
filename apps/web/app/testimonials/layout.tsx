import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Testimonials',
  description: 'See what our customers say about Village Express. Real stories from villages and towns across India about our parcel delivery service.',
  openGraph: {
    title: 'Testimonials | Village Express',
    description: 'Real stories from our customers about Village Express parcel delivery service across India.',
    url: '/testimonials',
  },
  alternates: { canonical: '/testimonials' },
}

export default function TestimonialsLayout({ children }: { children: React.ReactNode }) {
  return children
}
