"use client";

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { useCallback, useEffect, useState } from 'react';
import { CDP, CDPAction, CDPActionParams, CDPStats, CDPWithAsset } from '@/utils/cdpTypes';
import { SupportedAsset, SUPPORTED_ASSETS, getAssetByMint } from '@/utils/supportedAssets';
import { usePriceOracle } from './price.service';

// Mock data for demonstration purposes - in production, this would come from the blockchain
const MOCK_CDPS: CDP[] = [
  {
    id: 'cdp-1',
    owner: new PublicKey('8YUVQCdEFnQ4g5zLbkKXsJEG6pYa4BrXN8xTmZfAkKgn'),
    collateralType: 'sol',
    collateralAmount: 10,
    debtAmount: 900,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    lastUpdatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    stabilityFeeAccrued: 5.23,
    liquidationPrice: 100,
    collateralRatio: 1.65,
  },
  {
    id: 'cdp-2',
    owner: new PublicKey('8YUVQCdEFnQ4g5zLbkKXsJEG6pYa4BrXN8xTmZfAkKgn'),
    collateralType: 'msol',
    collateralAmount: 5,
    debtAmount: 500,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
    lastUpdatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    stabilityFeeAccrued: 2.15,
    liquidationPrice: 105,
    collateralRatio: 1.70,
  },
];

export function useCDPManagement() {
  const { connection } = useConnection();
  const { publicKey, signTransaction, sendTransaction } = useWallet();
  const { priceData } = usePriceOracle();
  
  const [cdps, setCdps] = useState<CDPWithAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cdpStats, setCdpStats] = useState<CDPStats>({
    totalCollateralValueUSD: 0,
    totalDebtValueUSD: 0,
    overallCollateralRatio: 0,
    availableDaiToBorrow: 0,
    liquidationRisk: 'none',
  });

  // Fetch user CDPs
  const fetchUserCDPs = useCallback(async () => {
    if (!publicKey) {
      setCdps([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // In production, this would fetch real CDP data from the blockchain
      // For now, we'll use mock data
      const userCdps = MOCK_CDPS.filter(
        cdp => cdp.owner.toString() === publicKey.toString()
      );
      
      // Enrich with asset information
      const cdpsWithAssets = userCdps.map(cdp => {
        const asset = SUPPORTED_ASSETS.find(a => a.id === cdp.collateralType);
        return {
          ...cdp,
          asset: asset || SUPPORTED_ASSETS[0],
        };
      });
      
      setCdps(cdpsWithAssets);
      
      // Calculate portfolio stats
      calculateCDPStats(cdpsWithAssets);
    } catch (err) {
      console.error('Error fetching CDPs:', err);
      setError('Failed to fetch CDP data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [publicKey]);

  // Calculate overall CDP stats
  const calculateCDPStats = useCallback((cdpsWithAssets: CDPWithAsset[]) => {
    if (cdpsWithAssets.length === 0) {
      setCdpStats({
        totalCollateralValueUSD: 0,
        totalDebtValueUSD: 0,
        overallCollateralRatio: 0,
        availableDaiToBorrow: 0,
        liquidationRisk: 'none',
      });
      return;
    }
    
    let totalCollateralValueUSD = 0;
    let totalDebtValueUSD = 0;
    
    cdpsWithAssets.forEach(cdp => {
      // Get current price for the asset (use from oracle if available)
      const currentPrice = priceData[cdp.collateralType]?.price || cdp.asset.priceUSD;
      
      // Calculate values
      const collateralValueUSD = cdp.collateralAmount * currentPrice;
      totalCollateralValueUSD += collateralValueUSD;
      totalDebtValueUSD += cdp.debtAmount;
    });
    
    // Calculate overall collateral ratio
    const overallCollateralRatio = totalDebtValueUSD > 0 
      ? totalCollateralValueUSD / totalDebtValueUSD 
      : 0;
    
    // Estimate available DAI to borrow
    // This is a simplified calculation - in production it would be more sophisticated
    const availableDaiToBorrow = Math.max(
      0,
      (totalCollateralValueUSD * 0.6) - totalDebtValueUSD
    );
    
    // Assess liquidation risk
    let liquidationRisk: 'none' | 'low' | 'medium' | 'high' | 'extreme' = 'none';
    
    if (overallCollateralRatio === 0) {
      liquidationRisk = 'none';
    } else if (overallCollateralRatio > 2.0) {
      liquidationRisk = 'low';
    } else if (overallCollateralRatio > 1.75) {
      liquidationRisk = 'medium';
    } else if (overallCollateralRatio > 1.5) {
      liquidationRisk = 'high';
    } else {
      liquidationRisk = 'extreme';
    }
    
    setCdpStats({
      totalCollateralValueUSD,
      totalDebtValueUSD,
      overallCollateralRatio,
      availableDaiToBorrow,
      liquidationRisk,
    });
  }, [priceData]);
  
  // Update CDP stats when price data changes
  useEffect(() => {
    if (cdps.length > 0) {
      calculateCDPStats(cdps);
    }
  }, [cdps, priceData, calculateCDPStats]);

  // Fetch CDPs on mount and when wallet changes
  useEffect(() => {
    fetchUserCDPs();
  }, [fetchUserCDPs]);

  // Execute a CDP action (BOOST, REPAY, SUPPLY, WITHDRAW, BORROW, PAYBACK)
  const executeCDPAction = useCallback(async (params: CDPActionParams) => {
    if (!publicKey || !signTransaction) {
      throw new Error('Wallet not connected');
    }

    const { cdpId, actionType, amount } = params;
    
    // Find the CDP
    const cdp = cdps.find(c => c.id === cdpId);
    if (!cdp) {
      throw new Error('CDP not found');
    }

    try {
      console.log(`Executing ${actionType} action on CDP ${cdpId} with amount ${amount}`);
      
      // This is a placeholder transaction that will be replaced with the actual CDP transaction
      // using the program once the IDL is available
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: publicKey,
          lamports: 100, // Minimum amount for a valid transaction
        })
      );
      
      // Set a recent blockhash
      transaction.recentBlockhash = (
        await connection.getLatestBlockhash()
      ).blockhash;
      
      transaction.feePayer = publicKey;
      
      // Send transaction
      const signature = await sendTransaction(transaction, connection);
      
      // In production, we would update the CDP data from the blockchain
      // For now, we'll simulate the update with mock data
      setCdps(prev => {
        return prev.map(c => {
          if (c.id === cdpId) {
            let updatedCDP = { ...c };
            
            switch (actionType) {
              case CDPAction.BOOST:
                // Increase collateral and debt
                updatedCDP.collateralAmount += amount * 0.9; // Simulating buying more collateral with 90% of borrowed DAI
                updatedCDP.debtAmount += amount;
                break;
              case CDPAction.REPAY:
                // Decrease collateral and debt
                updatedCDP.collateralAmount -= amount;
                updatedCDP.debtAmount -= amount * c.asset.priceUSD * 0.9; // Simulating selling collateral to pay back 90% of value
                break;
              case CDPAction.SUPPLY:
                // Increase collateral
                updatedCDP.collateralAmount += amount;
                break;
              case CDPAction.WITHDRAW:
                // Decrease collateral
                updatedCDP.collateralAmount -= amount;
                break;
              case CDPAction.BORROW:
                // Increase debt
                updatedCDP.debtAmount += amount;
                break;
              case CDPAction.PAYBACK:
                // Decrease debt
                updatedCDP.debtAmount -= amount;
                break;
            }
            
            // Update lastUpdatedAt and recalculate ratios
            updatedCDP.lastUpdatedAt = new Date();
            updatedCDP.collateralRatio = (updatedCDP.collateralAmount * updatedCDP.asset.priceUSD) / updatedCDP.debtAmount;
            
            return updatedCDP;
          }
          return c;
        });
      });
      
      // Recalculate CDP stats
      calculateCDPStats(cdps);
      
      return {
        signature,
        success: true,
        message: `${actionType} action executed successfully`
      };
    } catch (error: any) {
      console.error(`Error executing ${actionType} action:`, error);
      return {
        signature: null,
        success: false,
        message: error.message || `Failed to execute ${actionType} action`
      };
    }
  }, [cdps, publicKey, signTransaction, sendTransaction, connection, calculateCDPStats]);

  return {
    cdps,
    cdpStats,
    isLoading,
    error,
    refreshCDPs: fetchUserCDPs,
    executeCDPAction,
  };
}
