import { PublicKey } from '@solana/web3.js';

export interface SupportedAsset {
  id: string;
  name: string;
  symbol: string;
  mintAddress: string;  // Solana token mint address
  decimals: number;
  logoUri: string;
  maxLTV: number;       // Loan-to-Value ratio (0-1)
  stabilityFee: number; // Annual fee (0-1)
  liquidationRatio: number; // Minimum collateral ratio before liquidation (e.g., 1.5 = 150%)
  priceUSD: number;     // Current price in USD
  isActive: boolean;    // Whether this asset is currently accepting new CDPs
}

// List of supported assets for collateral
export const SUPPORTED_ASSETS: SupportedAsset[] = [
  {
    id: 'sol',
    name: 'Solana',
    symbol: 'SOL',
    mintAddress: 'So11111111111111111111111111111111111111112', // Native SOL mint address
    decimals: 9,
    logoUri: '/assets/solana-logo.png',
    maxLTV: 0.66, // 66%
    stabilityFee: 0.06, // 6%
    liquidationRatio: 1.45, // 145%
    priceUSD: 142.5,
    isActive: true,
  },
  {
    id: 'msol',
    name: 'Marinade SOL',
    symbol: 'mSOL',
    mintAddress: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
    decimals: 9,
    logoUri: '/assets/msol-logo.png',
    maxLTV: 0.70, // 70%
    stabilityFee: 0.055, // 5.5%
    liquidationRatio: 1.40, // 140%
    priceUSD: 146.25,
    isActive: true,
  },
  {
    id: 'bsol',
    name: 'Blaze SOL',
    symbol: 'bSOL',
    mintAddress: 'bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1',
    decimals: 9,
    logoUri: '/assets/bsol-logo.png',
    maxLTV: 0.68, // 68%
    stabilityFee: 0.057, // 5.7%
    liquidationRatio: 1.43, // 143%
    priceUSD: 144.80,
    isActive: true,
  },
  {
    id: 'jsol',
    name: 'Jito SOL',
    symbol: 'jitoSOL',
    mintAddress: 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn',
    decimals: 9,
    logoUri: '/assets/jsol-logo.png',
    maxLTV: 0.69, // 69%
    stabilityFee: 0.058, // 5.8%
    liquidationRatio: 1.42, // 142%
    priceUSD: 145.30,
    isActive: true,
  },
  {
    id: 'usdc',
    name: 'USD Coin',
    symbol: 'USDC',
    mintAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    decimals: 6,
    logoUri: '/assets/usdc-logo.png',
    maxLTV: 0.80, // 80%
    stabilityFee: 0.04, // 4%
    liquidationRatio: 1.20, // 120%
    priceUSD: 1.00,
    isActive: true,
  },
  {
    id: 'usdt',
    name: 'Tether USD',
    symbol: 'USDT',
    mintAddress: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    decimals: 6,
    logoUri: '/assets/usdt-logo.png',
    maxLTV: 0.75, // 75%
    stabilityFee: 0.045, // 4.5%
    liquidationRatio: 1.25, // 125%
    priceUSD: 1.00,
    isActive: true,
  },
  {
    id: 'bonk',
    name: 'Bonk',
    symbol: 'BONK',
    mintAddress: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    decimals: 5,
    logoUri: '/assets/bonk-logo.png',
    maxLTV: 0.40, // 40%
    stabilityFee: 0.10, // 10%
    liquidationRatio: 2.00, // 200%
    priceUSD: 0.00002145,
    isActive: true,
  }
];

// Function to check if a token mint address is supported
export function isSupportedAsset(mintAddress: string): boolean {
  return SUPPORTED_ASSETS.some(asset => 
    asset.mintAddress.toLowerCase() === mintAddress.toLowerCase() && asset.isActive
  );
}

// Function to get asset details by mint address
export function getAssetByMint(mintAddress: string): SupportedAsset | undefined {
  return SUPPORTED_ASSETS.find(asset => 
    asset.mintAddress.toLowerCase() === mintAddress.toLowerCase()
  );
}

// Function to get active assets (those that are currently accepting new CDPs)
export function getActiveAssets(): SupportedAsset[] {
  return SUPPORTED_ASSETS.filter(asset => asset.isActive);
}

// Default minimum collateral ratio for CDPs
export const DEFAULT_MIN_COLLATERAL_RATIO = 1.55; // 155%

// DAI token information (placeholder for when we have our own token)
export const DAI_TOKEN = {
  name: 'Solana DAI',
  symbol: 'sDAI',
  priceUSD: 1.00, // DAI is a stablecoin pegged to $1
  decimals: 6,
};
