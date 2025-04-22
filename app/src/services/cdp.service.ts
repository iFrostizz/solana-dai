"use client";

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { getAssetByMint, SupportedAsset, DAI_TOKEN } from '@/utils/supportedAssets';
import { useCallback } from 'react';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

export interface CreateCDPParams {
  collateralMint: string;
  collateralAmount: number;
  daiAmount: number;
}

export function useCDPService() {
  const { connection } = useConnection();
  const { publicKey, signTransaction, sendTransaction } = useWallet();

  /**
   * Create a new CDP (Collateralized Debt Position)
   * This is a placeholder implementation that will be replaced with the actual 
   * implementation using the IDL once it's available.
   */
  const createCDP = useCallback(async (params: CreateCDPParams) => {
    if (!publicKey || !signTransaction) {
      throw new Error('Wallet not connected');
    }

    const { collateralMint, collateralAmount, daiAmount } = params;
    const asset = getAssetByMint(collateralMint);
    
    if (!asset) {
      throw new Error('Unsupported collateral type');
    }

    try {
      // This is a placeholder transaction that will be replaced with the actual CDP creation
      // using the program once the IDL is available
      
      console.log('Creating CDP with the following parameters:');
      console.log(`Collateral: ${collateralAmount} ${asset.symbol}`);
      console.log(`DAI Amount: ${daiAmount} ${DAI_TOKEN.symbol}`);
      
      // In a real implementation, we would:
      // 1. Create a transaction to transfer collateral to a CDP vault
      // 2. Mint sDAI to the user
      // 3. Create a record of the CDP
      
      // For now, just create a dummy transaction that transfers a tiny amount of SOL to self
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
      
      // Return the transaction signature
      return {
        signature,
        success: true,
        message: 'CDP creation transaction sent'
      };
    } catch (error: any) {
      console.error('Error creating CDP:', error);
      return {
        signature: null,
        success: false,
        message: error.message || 'Failed to create CDP'
      };
    }
  }, [connection, publicKey, sendTransaction]);

  /**
   * Validate if a CDP can be created with the given parameters
   */
  const validateCDPCreation = useCallback((params: CreateCDPParams) => {
    const { collateralMint, collateralAmount, daiAmount } = params;
    const asset = getAssetByMint(collateralMint);
    
    if (!asset) {
      return {
        isValid: false,
        message: 'Unsupported collateral type'
      };
    }
    
    if (collateralAmount <= 0) {
      return {
        isValid: false,
        message: 'Collateral amount must be greater than 0'
      };
    }
    
    if (daiAmount <= 0) {
      return {
        isValid: false,
        message: 'DAI amount must be greater than 0'
      };
    }
    
    // Calculate collateral value in USD
    const collateralValueUSD = collateralAmount * asset.priceUSD;
    
    // Calculate maximum DAI that can be borrowed
    const maxDAI = collateralValueUSD * asset.maxLTV;
    
    if (daiAmount > maxDAI) {
      return {
        isValid: false,
        message: `Cannot borrow more than ${maxDAI.toFixed(2)} DAI with this collateral`
      };
    }
    
    // Calculate collateral ratio
    const collateralRatio = collateralValueUSD / daiAmount;
    
    if (collateralRatio < asset.liquidationRatio) {
      return {
        isValid: false,
        message: `Collateral ratio (${(collateralRatio * 100).toFixed(2)}%) is below the minimum required (${(asset.liquidationRatio * 100).toFixed(2)}%)`
      };
    }
    
    return {
      isValid: true,
      message: 'Valid CDP parameters'
    };
  }, []);

  return {
    createCDP,
    validateCDPCreation
  };
}
