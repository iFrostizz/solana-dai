import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import WalletContextProvider from '@/context/WalletContextProvider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Solana DAI - Decentralized Stablecoin',
  description: 'A decentralized stablecoin backed by Solana assets',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans min-h-screen`}>
        <WalletContextProvider>
          {children}
        </WalletContextProvider>
      </body>
    </html>
  );
}
