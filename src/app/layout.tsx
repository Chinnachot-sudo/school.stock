import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import { AuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  title: 'ระบบสต็อกสินค้าและตัดเบิกพัสดุในโรงเรียน',
  description: 'ระบบตรวจเช็คและตัดสต็อกพัสดุสำหรับเจ้าหน้าที่และครู ใช้งานง่ายผ่านมือถือด้วยกล้องสแกน QR Code',
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
          <main className="max-w-5xl mx-auto px-3 sm:px-6 py-4">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
