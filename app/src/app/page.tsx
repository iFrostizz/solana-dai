import React from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-background to-muted">
        <div className="container mx-auto px-4 py-20">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                <span className="gradient-text">Solana USDE</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-xl">
                A decentralized stablecoin backed by Solana assets, providing stability in the volatile crypto market.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/create-cdp">
                  <Button variant="primary" size="lg" className="w-full sm:w-auto">
                    Create CDP
                  </Button>
                </Link>
                <Link href="/docs">
                  <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <div className="relative w-full max-w-md aspect-square">
                <div className="absolute inset-0 bg-accent/20 rounded-full blur-3xl"></div>
                <div className="relative z-10 flex items-center justify-center h-full">
                  <div className="bg-card border border-border rounded-3xl p-6 shadow-lg w-5/6 aspect-square flex items-center justify-center">
                    <span className="text-6xl md:text-8xl font-bold gradient-text">USDE</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Solana USDE</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Built on Solana&apos;s high-performance blockchain, our stablecoin provides the best of both worlds - stability and speed.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-card border border-border rounded-lg p-6 transition-transform hover:transform hover:-translate-y-1">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Stable Value</h3>
              <p className="text-muted-foreground">
                Solana USDE maintains a soft peg to the US Dollar, providing stability in volatile markets.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-card border border-border rounded-lg p-6 transition-transform hover:transform hover:-translate-y-1">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Lightning Fast</h3>
              <p className="text-muted-foreground">
                Built on Solana&apos;s high-performance blockchain, enjoy sub-second finality and low transaction costs.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-card border border-border rounded-lg p-6 transition-transform hover:transform hover:-translate-y-1">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Fully Collateralized</h3>
              <p className="text-muted-foreground">
                Each Solana USDE token is backed by Solana assets locked in transparent smart contracts.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* How It Works */}
      <div className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Creating and managing your Collateralized Debt Position (CDP) is simple.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-card border border-border flex items-center justify-center text-2xl font-bold mx-auto mb-6">1</div>
              <h3 className="text-xl font-bold mb-3">Deposit Collateral</h3>
              <p className="text-muted-foreground">
                Lock up your Solana assets as collateral in a secure vault to back your generated USDE.
              </p>
            </div>
            
            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-card border border-border flex items-center justify-center text-2xl font-bold mx-auto mb-6">2</div>
              <h3 className="text-xl font-bold mb-3">Generate USDE</h3>
              <p className="text-muted-foreground">
                Create USDE stablecoins against your deposited collateral, maintaining a safe collateralization ratio.
              </p>
            </div>
            
            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-card border border-border flex items-center justify-center text-2xl font-bold mx-auto mb-6">3</div>
              <h3 className="text-xl font-bold mb-3">Manage Your Position</h3>
              <p className="text-muted-foreground">
                Add collateral, generate more USDE, or pay back your debt as needed through an intuitive interface.
              </p>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <Link href="/create-cdp">
              <Button variant="primary" size="lg">
                Create Your First CDP
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="bg-card border border-border rounded-lg p-8 md:p-12 text-center max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to get started?</h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
              Join the future of decentralized finance on Solana. Create your first CDP vault and experience the stability of Solana USDE.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/create-cdp">
                <Button variant="primary" size="lg">
                  Create CDP
                </Button>
              </Link>
              <Link href="/manage-cdp">
                <Button variant="secondary" size="lg">
                  Manage CDPs
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-muted py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <span className="text-lg font-bold gradient-text">Solana USDE</span>
              <p className="text-sm text-muted-foreground mt-1">
                &copy; 2025 Solana USDE. All rights reserved.
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
