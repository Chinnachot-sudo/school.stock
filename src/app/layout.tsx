import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import { AuthProvider } from '@/lib/auth-context';
import AuthGuard from '@/components/AuthGuard';

export const metadata: Metadata = {
  title: 'Roong Aroon International School | โรงเรียนนานาชาติรุ่งอรุณ - ERP & Inventory',
  description: 'ระบบ ERP คลังพัสดุ และจุดขายสวัสดิการ โรงเรียนนานาชาติรุ่งอรุณ (Roong Aroon International School)',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.png',
    apple: '/icon.png'
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#1F4D3A'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className="min-h-screen bg-[#F7F4EF] text-[#1A1A1A] pb-24 md:pb-8 antialiased selection:bg-[#E8F0EB] selection:text-[#1F4D3A]">
        <AuthProvider>
          <Navbar />
          <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
            <AuthGuard>
              {children}
            </AuthGuard>
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
