"use client";

import React from 'react';
import { usePriceOracle } from '@/services/price.service';
import { formatUSD } from '@/utils/cdp';

interface AssetPriceDisplayProps {
  assetId: string;
  showTimestamp?: boolean;
  className?: string;
}

const AssetPriceDisplay: React.FC<AssetPriceDisplayProps> = ({
  assetId,
  showTimestamp = true,
  className = '',
}) => {
  const { getPriceForAsset, getTimeSinceUpdate, isLoading } = usePriceOracle();
  
  const priceData = getPriceForAsset(assetId);
  
  if (!priceData) {
    return (
      <div className={`text-muted-foreground ${className}`}>
        Price unavailable
      </div>
    );
  }
  
  return (
    <div className={`flex items-center ${className}`}>
      <span className="font-medium">{formatUSD(priceData.price)}</span>
      {showTimestamp && (
        <span className="text-xs text-muted-foreground ml-2">
          {isLoading ? 'Updating...' : getTimeSinceUpdate(priceData.timestamp)}
        </span>
      )}
    </div>
  );
};

export default AssetPriceDisplay;
