import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
  display: "swap",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.villageexpress.in";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Village Express — Parcel Delivery Across Villages & Towns",
    template: "%s | Village Express",
  },
  description:
    "Delivering Happiness To Every Village. Reliable parcel delivery service connecting villages across India. Fast, secure, and affordable with real-time tracking.",
  keywords: [
    "village express",
    "parcel delivery",
    "courier service",
    "village courier",
    "rural delivery",
    "India delivery",
    "fast courier",
    "reliable delivery",
    "parcel tracking",
  ],
  authors: [{ name: "Village Express", url: APP_URL }],
  creator: "Village Express",
  publisher: "Village Express",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: APP_URL,
    siteName: "Village Express",
    title: "Village Express — Parcel Delivery Across Villages & Towns",
    description:
      "Delivering Happiness To Every Village. Reliable parcel delivery service connecting villages across India. Fast, secure, and affordable with real-time tracking.",
    images: [
      {
        url: "/logoh.png",
        width: 512,
        height: 512,
        alt: "Village Express Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Village Express — Parcel Delivery Across Villages & Towns",
    description:
      "Delivering Happiness To Every Village. Reliable parcel delivery service connecting villages across India.",
    images: ["/logoh.png"],
    creator: "@villageexpress",
  },
  icons: {
    icon: [
      { url: "/logoh.png", type: "image/png" },
    ],
    shortcut: "/logoh.png",
    apple: "/logoh.png",
  },
  manifest: undefined,
  alternates: {
    canonical: APP_URL,
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Village Express",
  url: APP_URL,
  logo: `${APP_URL}/logoh.png`,
  sameAs: [
    "https://www.instagram.com/villageexpress.in",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    url: `${APP_URL}/contact`,
  },
  description:
    "Delivering Happiness To Every Village. Reliable parcel delivery service connecting villages across India.",
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Village Express",
  url: APP_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${APP_URL}/blogs?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        {children}
      </body>
    </html>
  );
}
