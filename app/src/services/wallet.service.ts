"use client";

import { useCallback, useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { AccountInfo, PublicKey, Transaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { SUPPORTED_ASSETS, SupportedAsset, getAssetByMint, isSupportedAsset } from '@/utils/supportedAssets';

export interface TokenAccount {
  pubkey: PublicKey;
  account: AccountInfo<Buffer>;
  mint: string;
  owner: string;
  amount: bigint;
  decimals: number;
}

export interface UserToken {
  mint: string;
  balance: bigint;
  decimals: number;
  uiBalance: number;
  asset?: SupportedAsset;
}

export function useWalletTokens() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [userTokens, setUserTokens] = useState<UserToken[]>([]);
  const [supportedUserTokens, setSupportedUserTokens] = useState<UserToken[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTokenAccounts = useCallback(async () => {
    if (!publicKey) {
      setUserTokens([]);
      setSupportedUserTokens([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { programId: TOKEN_PROGRAM_ID }
      );

      const tokens = tokenAccounts.value.map(accountInfo => {
        const parsedInfo = accountInfo.account.data.parsed.info;
        const mintAddress = parsedInfo.mint;
        const balance = BigInt(parsedInfo.tokenAmount.amount);
        const decimals = parsedInfo.tokenAmount.decimals;
        const uiBalance = Number(balance) / Math.pow(10, decimals);
        const asset = getAssetByMint(mintAddress);

        return {
          mint: mintAddress,
          balance,
          decimals,
          uiBalance,
          asset
        };
      }).filter(token => token.uiBalance > 0);

      // Add native SOL balance
      try {
        const solBalance = await connection.getBalance(publicKey);
        const solAsset = SUPPORTED_ASSETS.find(asset => asset.symbol === 'SOL');
        if (solAsset) {
          tokens.push({
            mint: solAsset.mintAddress,
            balance: BigInt(solBalance),
            decimals: 9,
            uiBalance: solBalance / 1e9,
            asset: solAsset
          });
        }
      } catch (err) {
        console.error('Error fetching SOL balance:', err);
      }

      // Filter for supported tokens
      const supportedTokens = tokens.filter(
        token => token.asset && isSupportedAsset(token.mint)
      );

      setUserTokens(tokens);
      setSupportedUserTokens(supportedTokens);
    } catch (err) {
      console.error('Error fetching token accounts:', err);
      setError('Failed to fetch token accounts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [connection, publicKey]);

  useEffect(() => {
    fetchTokenAccounts();
    
    // Set up an interval to refresh the token accounts every 30 seconds
    const intervalId = setInterval(fetchTokenAccounts, 30000);
    
    return () => clearInterval(intervalId);
  }, [fetchTokenAccounts]);

  return {
    userTokens,
    supportedUserTokens,
    isLoading,
    error,
    refreshTokens: fetchTokenAccounts
  };
}

// Helper function to format token amounts for display
export function formatTokenAmount(amount: bigint, decimals: number): string {
  const divisor = BigInt(10 ** decimals);
  const wholePart = amount / divisor;
  const fractionalPart = amount % divisor;
  
  let fractionStr = fractionalPart.toString().padStart(decimals, '0');
  // Trim trailing zeros
  fractionStr = fractionStr.replace(/0+$/, '');
  
  if (fractionStr.length > 0) {
    return `${wholePart.toString()}.${fractionStr}`;
  } else {
    return wholePart.toString();
  }
}

// Helper function to convert UI amount to on-chain amount
export function uiAmountToAmount(uiAmount: number, decimals: number): bigint {
  return BigInt(Math.floor(uiAmount * 10 ** decimals));
}
