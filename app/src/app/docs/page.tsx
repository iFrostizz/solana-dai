"use client";

import React, { useState } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';

type DocSection = {
  id: string;
  title: string;
  items: { id: string; title: string }[];
};

// MakerDAO-style documentation structure with placeholder content
const docSections: DocSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    items: [
      { id: 'introduction', title: 'Introduction to Solana DAI' },
      { id: 'overview', title: 'System Overview' },
      { id: 'key-concepts', title: 'Key Concepts' },
      { id: 'glossary', title: 'Glossary' },
    ],
  },
  {
    id: 'solana-dai-protocol',
    title: 'Solana DAI Protocol',
    items: [
      { id: 'cdp-mechanism', title: 'CDP Mechanism' },
      { id: 'collateral-types', title: 'Collateral Types' },
      { id: 'stability-fees', title: 'Stability Fees' },
      { id: 'liquidation', title: 'Liquidation Mechanism' },
      { id: 'emergency-shutdown', title: 'Emergency Shutdown' },
    ],
  },
  {
    id: 'solana-dai-token',
    title: 'Solana DAI Token',
    items: [
      { id: 'token-details', title: 'Token Details' },
      { id: 'token-economy', title: 'Token Economy' },
      { id: 'use-cases', title: 'Use Cases' },
    ],
  },
  {
    id: 'governance',
    title: 'Governance',
    items: [
      { id: 'governance-overview', title: 'Governance Overview' },
      { id: 'protocol-parameters', title: 'Protocol Parameters' },
      { id: 'voting', title: 'Voting Process' },
    ],
  },
  {
    id: 'guides',
    title: 'Guides',
    items: [
      { id: 'open-cdp', title: 'How to Open a CDP' },
      { id: 'manage-cdp', title: 'How to Manage a CDP' },
      { id: 'close-cdp', title: 'How to Close a CDP' },
      { id: 'avoid-liquidation', title: 'How to Avoid Liquidation' },
    ],
  },
  {
    id: 'security',
    title: 'Security',
    items: [
      { id: 'audits', title: 'Security Audits' },
      { id: 'bug-bounty', title: 'Bug Bounty Program' },
      { id: 'risks', title: 'Risk Framework' },
    ],
  },
  {
    id: 'developers',
    title: 'Developers',
    items: [
      { id: 'api-reference', title: 'API Reference' },
      { id: 'solana-integration', title: 'Solana Integration' },
      { id: 'sdk', title: 'SDK Documentation' },
      { id: 'smart-contracts', title: 'Smart Contract Documentation' },
    ],
  },
];

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState(docSections[0].id);
  const [activeItem, setActiveItem] = useState(docSections[0].items[0].id);

  const getActiveSection = (): DocSection | undefined => {
    return docSections.find(section => section.id === activeSection);
  };

  const handleSectionClick = (sectionId: string) => {
    setActiveSection(sectionId);
    
    // Set active item to first item in the section
    const section = docSections.find(s => s.id === sectionId);
    if (section && section.items.length > 0) {
      setActiveItem(section.items[0].id);
    }
  };

  const handleItemClick = (itemId: string) => {
    setActiveItem(itemId);
  };

  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-muted p-4 overflow-y-auto border-r border-border">
          <div className="mb-6">
            <h1 className="text-xl font-bold mb-4 gradient-text">Documentation</h1>
            <div className="relative">
              <input
                type="text"
                placeholder="Search docs..."
                className="w-full rounded-lg bg-card border border-border py-2 px-4 pl-10 focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <div className="absolute left-3 top-2.5 text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          <nav className="space-y-6">
            {docSections.map((section) => (
              <div key={section.id} className="space-y-2">
                <button
                  className={`text-left font-medium w-full ${
                    activeSection === section.id ? 'text-accent' : 'text-foreground'
                  }`}
                  onClick={() => handleSectionClick(section.id)}
                >
                  {section.title}
                </button>
                {activeSection === section.id && (
                  <ul className="pl-4 space-y-2">
                    {section.items.map((item) => (
                      <li key={item.id}>
                        <button
                          className={`text-sm text-left ${
                            activeItem === item.id
                              ? 'text-accent font-medium'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                          onClick={() => handleItemClick(item.id)}
                        >
                          {item.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          <div className="max-w-3xl mx-auto">
            <div className="text-sm text-muted-foreground mb-2">
              <span>{getActiveSection()?.title}</span>
              <span className="mx-2">/</span>
              <span>
                {getActiveSection()?.items.find(item => item.id === activeItem)?.title}
              </span>
            </div>

            <h1 className="text-3xl font-bold mb-6">
              {getActiveSection()?.items.find(item => item.id === activeItem)?.title}
            </h1>

            <div className="prose max-w-none">
              {/* Placeholder documentation content */}
              <p className="lead text-lg">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed at nisl euismod urna bibendum sollicitudin.
              </p>

              <h2>Overview</h2>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed at nisl euismod urna bibendum sollicitudin. 
                Nam risus ante, dapibus a molestie consequat, ultrices ac magna. Fusce dui lectus, congue vel laoreet ac, 
                dictum vitae odio. Donec aliquet.
              </p>

              <h2>Key Concepts</h2>
              <p>
                Nam risus ante, dapibus a molestie consequat, ultrices ac magna. Fusce dui lectus, congue vel laoreet ac, 
                dictum vitae odio. Donec aliquet. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed at nisl 
                euismod urna bibendum sollicitudin.
              </p>

              <h3>Solana Integration</h3>
              <p>
                Donec aliquet. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed at nisl euismod urna bibendum 
                sollicitudin. Nam risus ante, dapibus a molestie consequat, ultrices ac magna. Fusce dui lectus, congue 
                vel laoreet ac.
              </p>

              <div className="bg-muted p-4 rounded-lg my-6">
                <p className="text-sm font-medium mb-2">Note</p>
                <p className="text-sm">
                  This documentation is in placeholder form and will be filled with actual content in the future.
                </p>
              </div>

              <h2>Example Code</h2>
              <pre className="bg-card p-4 rounded-lg overflow-x-auto">
                <code className="language-typescript">
                  {`// Example Solana DAI interaction
import { Connection, PublicKey } from '@solana/web3.js';
import { SolanaDai } from '@solana-dai/sdk';

// Initialize connection
const connection = new Connection('https://api.mainnet-beta.solana.com');
const solanaDai = new SolanaDai(connection);

// Open a CDP with SOL collateral
async function openCDP(wallet, collateralAmount, daiAmount) {
  const tx = await solanaDai.openCDP({
    owner: wallet.publicKey,
    collateralType: 'SOL',
    collateralAmount,
    daiAmount,
  });
  
  return await wallet.signAndSendTransaction(tx);
}`}
                </code>
              </pre>

              <h2>Related Resources</h2>
              <ul>
                <li>
                  <a href="#" className="text-accent hover:underline">
                    Technical Whitepaper
                  </a>
                </li>
                <li>
                  <a href="#" className="text-accent hover:underline">
                    Developer Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="text-accent hover:underline">
                    API Reference
                  </a>
                </li>
              </ul>
            </div>

            <div className="mt-10 py-6 border-t border-border">
              <div className="flex justify-between items-center">
                <Link
                  href="#"
                  className="text-accent hover:underline flex items-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Previous
                </Link>
                <Link
                  href="#"
                  className="text-accent hover:underline flex items-center"
                >
                  Next
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 ml-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
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
