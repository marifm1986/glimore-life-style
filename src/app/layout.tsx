import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import PublicShell from '@/components/shared/PublicShell';
import PwaRegister from '@/components/PwaRegister';

export const metadata: Metadata = {
  title: 'GLIMORE LIFE STYLE | Luxury Haute Couture & Curated Designer Pieces',
  description: 'Step into a world of curated elegance. GLIMORE life style offers premium apparel, hand-crafted leather goods, and high-fashion accessories from elite independent designers globally.',
  keywords: 'luxury fashion, curated clothing, handmade leather, independent designers, boutique ecommerce',
  openGraph: {
    title: 'GLIMORE LIFE STYLE | Luxury Designer Collective',
    description: 'Experience elite multi-vendor fashion and hand-crafted pieces.',
    url: 'https://glimorelifestyle.vercel.app',
    siteName: 'Glimore Style',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#d4a853" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Glimore" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/only_logo.webp" />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground selection:bg-primary/30 selection:text-white">
        <AuthProvider>
          <CartProvider>
            <PublicShell>{children}</PublicShell>
          </CartProvider>
        </AuthProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
