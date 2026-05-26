import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Quant Research Terminal',
  description:
    'Multi-agent financial research terminal — explainable AI, streaming consensus, scenario reasoning. Educational use only.',
  keywords: ['AI', 'quant', 'multi-agent', 'financial research', 'terminal', 'Claude', 'RAG'],
};

export const viewport: Viewport = {
  themeColor: '#05070d',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-bg font-mono text-text antialiased">{children}</body>
    </html>
  );
}
