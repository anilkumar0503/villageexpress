import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with Village Express. We\'re here to help with your parcel delivery queries, complaints, or partnerships.',
  openGraph: {
    title: 'Contact Us | Village Express',
    description: 'Get in touch with Village Express for parcel delivery support, queries, and partnerships.',
    url: '/contact',
  },
  alternates: { canonical: '/contact' },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
