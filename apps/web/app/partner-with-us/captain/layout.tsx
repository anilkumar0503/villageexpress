import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Become a Captain',
  description: 'Join Village Express as a delivery captain. Flexible hours, competitive earnings, and the satisfaction of connecting villages across India.',
  openGraph: {
    title: 'Become a Captain | Village Express',
    description: 'Join Village Express as a delivery captain. Flexible hours and competitive earnings.',
    url: '/partner-with-us/captain',
  },
  alternates: { canonical: '/partner-with-us/captain' },
}

export default function CaptainLayout({ children }: { children: React.ReactNode }) {
  return children
}
