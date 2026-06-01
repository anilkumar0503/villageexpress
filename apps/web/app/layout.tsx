import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Village Express",
  description: "Fast & reliable courier delivery across villages and towns",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
