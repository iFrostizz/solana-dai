import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import WalletContextProvider from '@/context/WalletContextProvider';
import { headers } from 'next/headers';
import SecurityProvider from '../components/security/SecurityProvider';
import SecurityGuard from '../components/security/SecurityGuard';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

// Security headers and metadata
export async function generateMetadata(): Promise<Metadata> {
  const baseMetadata: Metadata = {
    title: 'Solana DAI - Decentralized Stablecoin',
    description: 'A decentralized stablecoin backed by Solana assets',
    metadataBase: new URL('https://solana-dai.com'),
  };
  
  return {
    ...baseMetadata,
    other: {
      'Content-Security-Policy': `
        default-src 'self';
        script-src 'self' 'unsafe-inline' 'unsafe-eval';
        style-src 'self' 'unsafe-inline';
        img-src 'self' data: blob: https:;
        font-src 'self';
        object-src 'none';
        base-uri 'self';
        form-action 'self';
        frame-ancestors 'none';
        block-all-mixed-content;
        upgrade-insecure-requests;
      `.replace(/\s+/g, ' ').trim(),
      'X-XSS-Protection': '1; mode=block',
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload'
    }
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#000000" />
        <meta name="description" content="A decentralized stablecoin backed by Solana assets" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
      </head>
      <body className={`${inter.variable} font-sans min-h-screen`}>
        <WalletContextProvider>
          <SecurityProvider>
            <div className="container mx-auto px-4 py-2">
              <SecurityGuard mode="subtle" onlyShowProblems={true} />
            </div>
            {children}
          </SecurityProvider>
        </WalletContextProvider>
      </body>
    </html>
  );
}
