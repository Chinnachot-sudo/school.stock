import type { Metadata, Viewport } from 'next';
import './globals.css';
import AppLayout from '@/components/AppLayout';
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
