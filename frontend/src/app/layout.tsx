import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AI Quant Research Terminal',
  description:
    'Multi-agent financial research terminal — explainable AI, streaming consensus, scenario reasoning. Educational use only.',
  keywords: [
    'AI',
    'quant',
    'multi-agent',
    'financial research',
    'terminal',
    'Claude',
    'RAG',
  ],
  icons: { icon: '/favicon.svg' },
};

export const viewport: Viewport = {
  themeColor: '#06080f',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-bg text-text antialiased">{children}</body>
    </html>
  );
}
