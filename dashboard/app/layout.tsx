import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'NIED Social Development Intelligence Hub',
  description: 'National Institute for Educational Development (NIED) Social Development Intelligence Hub — institutional government procurement, CSR funding, and development sector intelligence.',
  icons: {
    icon: '/favicon.ico'
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F4F7F9] text-[#17232E] antialiased">
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
