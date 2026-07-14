import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Partner With Us',
  description: 'Join the Village Express network as a Point Manager or Captain. Earn steady income while helping connect rural India with reliable parcel delivery.',
  openGraph: {
    title: 'Partner With Us | Village Express',
    description: 'Join the Village Express network as a Point Manager or Captain and earn steady income.',
    url: '/partner-with-us',
  },
  alternates: { canonical: '/partner-with-us' },
}

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  return children
}
