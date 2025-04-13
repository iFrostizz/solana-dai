"use client";

import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Button from './ui/Button';

const WalletConnectButton: React.FC = () => {
  const { publicKey, connected } = useWallet();
  
  return (
    <div className="wallet-connect-button">
      {/* We're using the WalletMultiButton from wallet-adapter-react-ui, 
          but styling it to match our app's design */}
      <div className="hidden sm:block">
        <WalletMultiButton className="phantom-button" />
      </div>
      
      <style jsx global>{`
        .phantom-button {
          background: linear-gradient(to right, var(--solana-purple), var(--solana-blue)) !important;
          color: white !important;
          border-radius: 0.5rem !important;
          padding: 0.5rem 1rem !important;
          font-size: 0.875rem !important;
          font-weight: 500 !important;
          height: auto !important;
          transition: opacity 0.2s ease !important;
        }
        
        .phantom-button:hover {
          opacity: 0.9 !important;
        }
        
        .wallet-adapter-dropdown-list {
          background-color: var(--card) !important;
          border: 1px solid var(--border) !important;
          border-radius: 0.5rem !important;
          color: var(--foreground) !important;
        }
        
        .wallet-adapter-dropdown-list-item {
          border-radius: 0.25rem !important;
        }
        
        .wallet-adapter-dropdown-list-item:hover {
          background-color: var(--muted) !important;
        }
      `}</style>
    </div>
  );
};

export default WalletConnectButton;
