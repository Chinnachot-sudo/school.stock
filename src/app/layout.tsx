import type { Metadata, Viewport } from 'next';
import './globals.css';
import AppLayout from '@/components/AppLayout';
import { AuthProvider } from '@/lib/auth-context';
import AuthGuard from '@/components/AuthGuard';

export const metadata: Metadata = {
  title: 'Romaneeya | Roong Aroon International School - ERP & Inventory',
  description: 'Romaneeya - ERP Inventory & School Store POS, Roong Aroon International School',
  manifest: '/manifest.json',
  icons: {
    icon: '/images/romaneeya_leaf_logo.svg',
    apple: '/images/romaneeya_leaf_logo.svg'
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#0B6B4F'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className="min-h-screen bg-[#F3F4F6] text-[#111827] antialiased selection:bg-[#E6F5EF] selection:text-[#0B6B4F]">
        <AuthProvider>
          <AuthGuard>
            <AppLayout>
              {children}
            </AppLayout>
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
