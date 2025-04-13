"use client";

import React from 'react';
import Header from '@/components/Header';
import CDPCreationForm from '@/components/CDPCreationForm';
import Link from 'next/link';

export default function CreateCDPPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Create a CDP</h1>
          <p className="text-muted-foreground">
            Generate Solana DAI by locking your Solana assets as collateral in a Collateralized Debt Position (CDP).
          </p>
        </div>
        
        <CDPCreationForm />
      </div>
      
      <footer className="bg-muted py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <span className="text-lg font-bold gradient-text">Solana DAI</span>
              <p className="text-sm text-muted-foreground mt-1">
                © 2025 Solana DAI. All rights reserved.
              </p>
            </div>
            <div className="flex space-x-6">
              <Link 
                href="/docs" 
                className="text-muted-foreground hover:text-accent transition-colors"
              >
                Docs
              </Link>
              <Link 
                href="https://github.com/iFrostizz/solana-dai" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-accent transition-colors"
              >
                GitHub
              </Link>
              <Link 
                href="https://discord.gg/uqErs3xZKD" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-accent transition-colors"
              >
                Discord
              </Link>
              <Link 
                href="https://x.com/encodeclub" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-accent transition-colors"
              >
                Twitter
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
