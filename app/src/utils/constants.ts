export const COLLATERAL_TYPES = [
  {
    id: 'sol-a',
    name: 'Solana',
    symbol: 'SOL-A',
    image: '/assets/solana-logo.png',
    maxLTV: 0.66, // 66% (Loan-to-Value ratio)
    stabilityFee: 0.06, // 6%
    liquidationRatio: 1.45, // 145%
    priceUSD: 142.50,
  },
  {
    id: 'msol-a',
    name: 'Marinade SOL',
    symbol: 'mSOL-A',
    image: '/assets/msol-logo.png',
    maxLTV: 0.70, // 70%
    stabilityFee: 0.055, // 5.5%
    liquidationRatio: 1.40, // 140%
    priceUSD: 146.25,
  },
  {
    id: 'bsol-a',
    name: 'Blaze SOL',
    symbol: 'bSOL-A',
    image: '/assets/bsol-logo.png',
    maxLTV: 0.68, // 68%
    stabilityFee: 0.057, // 5.7%
    liquidationRatio: 1.43, // 143%
    priceUSD: 144.80,
  },
  {
    id: 'jsol-a',
    name: 'Jito SOL',
    symbol: 'jitoSOL-A',
    image: '/assets/jsol-logo.png',
    maxLTV: 0.69, // 69%
    stabilityFee: 0.058, // 5.8%
    liquidationRatio: 1.42, // 142%
    priceUSD: 145.30,
  },
  {
    id: 'usdc-a',
    name: 'USD Coin',
    symbol: 'USDC-A',
    image: '/assets/usdc-logo.png',
    maxLTV: 0.80, // 80%
    stabilityFee: 0.04, // 4%
    liquidationRatio: 1.20, // 120%
    priceUSD: 1.00,
  }
];

export const DAI_PRICE_USD = 1.00; // DAI is a stablecoin pegged to $1

export const DEFAULT_MIN_COLLATERAL_RATIO = 1.55; // 155%
