"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import WalletConnectButton from './WalletConnectButton';

const Header: React.FC = () => {
  const pathname = usePathname();
  
  const isActive = (path: string) => {
    return pathname === path;
  };
  
  return (
    <header className="border-b border-border bg-background">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold gradient-text">Solana DAI</span>
            </Link>
            <nav className="hidden md:flex ml-10 space-x-6">
              <Link 
                href="/" 
                className={`transition-colors ${
                  isActive('/') 
                    ? 'text-accent font-medium' 
                    : 'text-foreground hover:text-accent'
                }`}
              >
                Home
              </Link>
              <Link 
                href="/create-cdp" 
                className={`transition-colors ${
                  isActive('/create-cdp') 
                    ? 'text-accent font-medium' 
                    : 'text-foreground hover:text-accent'
                }`}
              >
                Create CDP
              </Link>
              <Link 
                href="/manage-cdp" 
                className={`transition-colors ${
                  isActive('/manage-cdp') 
                    ? 'text-accent font-medium' 
                    : 'text-foreground hover:text-accent'
                }`}
              >
                Manage CDP
              </Link>
              <Link 
                href="/docs" 
                className={`transition-colors ${
                  isActive('/docs') 
                    ? 'text-accent font-medium' 
                    : 'text-foreground hover:text-accent'
                }`}
              >
                Docs
              </Link>
            </nav>
          </div>
          <div className="flex items-center">
            <WalletConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
