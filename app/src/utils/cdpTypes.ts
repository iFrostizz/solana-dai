import { SupportedAsset } from './supportedAssets';
import { PublicKey } from '@solana/web3.js';

export interface CDP {
  id: string;
  owner: PublicKey;
  collateralType: string;  // Asset ID (e.g., "sol", "msol")
  collateralAmount: number;
  debtAmount: number;
  createdAt: Date;
  lastUpdatedAt: Date;
  stabilityFeeAccrued: number;
  liquidationPrice: number;
  collateralRatio: number;
}

export interface CDPWithAsset extends CDP {
  asset: SupportedAsset;
}

export enum CDPAction {
  BOOST = 'BOOST',
  REPAY = 'REPAY',
  SUPPLY = 'SUPPLY',
  WITHDRAW = 'WITHDRAW',
  BORROW = 'BORROW',
  PAYBACK = 'PAYBACK'
}

export interface CDPActionParams {
  cdpId: string;
  actionType: CDPAction;
  amount: number; // Amount of collateral or DAI depending on action
}

export interface CDPStats {
  totalCollateralValueUSD: number;
  totalDebtValueUSD: number;
  overallCollateralRatio: number;
  availableDaiToBorrow: number;
  liquidationRisk: 'none' | 'low' | 'medium' | 'high' | 'extreme';
}
