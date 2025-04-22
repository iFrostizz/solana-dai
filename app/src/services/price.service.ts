"use client";

import { useEffect, useState } from 'react';
import { StargateClient } from '@cosmjs/stargate';
import { SupportedAsset, SUPPORTED_ASSETS } from '@/utils/supportedAssets';

// Interface for price data with timestamp
export interface PriceData {
  price: number;
  timestamp: Date;
  symbol: string;
}

// This is a placeholder for a real-world Cosmos-based oracle RPC endpoint
// In practice, you would use a real oracle service endpoint
const COSMOS_ORACLE_RPC = "https://cosmos-rpc.quicknode.pro";

/**
 * Custom hook to fetch and maintain real-time price data
 */
export function usePriceOracle() {
  const [priceData, setPriceData] = useState<Record<string, PriceData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set initial price data from our constants
  useEffect(() => {
    const initialPrices: Record<string, PriceData> = {};
    SUPPORTED_ASSETS.forEach(asset => {
      initialPrices[asset.id] = {
        price: asset.priceUSD,
        timestamp: new Date(),
        symbol: asset.symbol,
      };
    });
    setPriceData(initialPrices);
  }, []);

  /**
   * Fetch prices from Cosmos-based oracle
   * This is a mock implementation since we don't have a real oracle endpoint
   */
  const fetchPrices = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // In a real implementation, we would connect to a Cosmos oracle
      // and fetch real price data. This is a mock implementation.
      
      // This code would normally use the CosmJS client:
      // const client = await StargateClient.connect(COSMOS_ORACLE_RPC);
      // const queryClient = client.queryClient;
      // const priceResponse = await queryClient.queryContractSmart(ORACLE_CONTRACT_ADDRESS, { get_prices: {} });
      
      // For now, generate mock price data with small variations to simulate real updates
      const mockPriceUpdates: Record<string, PriceData> = {};
      
      SUPPORTED_ASSETS.forEach(asset => {
        // Create a random price fluctuation within ±2% of the base price
        const fluctuation = 0.96 + Math.random() * 0.08; // 0.96 to 1.04 (±4%)
        
        mockPriceUpdates[asset.id] = {
          price: asset.priceUSD * fluctuation,
          timestamp: new Date(),
          symbol: asset.symbol,
        };
      });
      
      setPriceData(prev => ({
        ...prev,
        ...mockPriceUpdates,
      }));
      
    } catch (err: any) {
      console.error('Error fetching prices:', err);
      setError('Failed to fetch price data');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch prices on mount and set up a polling interval
  useEffect(() => {
    // Initial fetch
    fetchPrices();
    
    // Set up polling interval (every 30 seconds)
    const intervalId = setInterval(fetchPrices, 30000);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  /**
   * Get price data for a specific asset
   */
  const getPriceForAsset = (assetId: string): PriceData | null => {
    return priceData[assetId] || null;
  };

  /**
   * Format the time difference between now and the price timestamp
   */
  const getTimeSinceUpdate = (timestamp: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    
    // Convert to seconds
    const diffSec = Math.floor(diffMs / 1000);
    
    if (diffSec < 60) {
      return `${diffSec}s ago`;
    } else if (diffSec < 3600) {
      return `${Math.floor(diffSec / 60)}m ago`;
    } else if (diffSec < 86400) {
      return `${Math.floor(diffSec / 3600)}h ago`;
    } else {
      return `${Math.floor(diffSec / 86400)}d ago`;
    }
  };

  return {
    priceData,
    isLoading,
    error,
    getPriceForAsset,
    refreshPrices: fetchPrices,
    getTimeSinceUpdate,
  };
}
