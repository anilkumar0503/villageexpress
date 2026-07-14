import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Become a Point Manager',
  description: 'Open a Village Express parcel point. Earn commission on every parcel handled and serve your community with reliable delivery services.',
  openGraph: {
    title: 'Become a Point Manager | Village Express',
    description: 'Open a Village Express parcel point. Earn commission on every parcel handled.',
    url: '/partner-with-us/point-manager',
  },
  alternates: { canonical: '/partner-with-us/point-manager' },
}

export default function PointManagerLayout({ children }: { children: React.ReactNode }) {
  return children
}
