import type { Metadata } from 'next';
import './globals.css';
import { ThemeScript } from '@/components/theme-script';
import { getLocale } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'Provisio ERP — PT Provisio Permata Tropisantara',
  description: 'Sistem manajemen terintegrasi: Manufaktur, Konstruksi, Perdagangan.',
  icons: {
    icon: [
      { url: '/brand/logo.png', type: 'image/png' },
    ],
    shortcut: '/brand/logo.png',
    apple: '/brand/logo.png',
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <ThemeScript />
        {/* Explicit link sebagai backup, untuk dev server yang tidak pickup metadata */}
        <link rel="icon" href="/brand/logo.png" type="image/png" />
      </head>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
