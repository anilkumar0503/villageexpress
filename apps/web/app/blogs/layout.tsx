import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Read the latest articles from Village Express — delivery tips, rural logistics insights, village stories, and company updates.',
  openGraph: {
    title: 'Blog | Village Express',
    description: 'Read the latest articles from Village Express — delivery tips, rural logistics insights, and company updates.',
    url: '/blogs',
  },
  alternates: { canonical: '/blogs' },
}

export default function BlogsLayout({ children }: { children: React.ReactNode }) {
  return children
}
