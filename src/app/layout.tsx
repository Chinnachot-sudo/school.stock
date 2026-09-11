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
  themeColor: '#2563eb'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className="min-h-screen bg-slate-50 text-slate-900 pb-20 md:pb-6">
        <AuthProvider>
          <Navbar />
          <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5">
            <AuthGuard>
              {children}
            </AuthGuard>
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
