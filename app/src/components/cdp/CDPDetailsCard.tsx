"use client";

import React, { useState } from 'react';
import { CDPWithAsset } from '@/utils/cdpTypes';
import Card from '../ui/Card';
import { formatNumber, formatPercent, formatUSD } from '@/utils/cdp';
import AssetPriceDisplay from '../AssetPriceDisplay';
import Button from '../ui/Button';

interface CDPDetailsCardProps {
  cdp: CDPWithAsset;
  onManage: (cdp: CDPWithAsset) => void;
}

const CDPDetailsCard: React.FC<CDPDetailsCardProps> = ({ cdp, onManage }) => {
  // Calculate health factor: ratio of current collateral ratio to liquidation ratio
  const healthFactor = cdp.collateralRatio / cdp.asset.liquidationRatio;
  
  // Determine health status based on health factor
  const getHealthStatus = () => {
    if (healthFactor > 2) return { text: 'Excellent', color: 'text-green-500' };
    if (healthFactor > 1.5) return { text: 'Good', color: 'text-green-400' };
    if (healthFactor > 1.2) return { text: 'Moderate', color: 'text-yellow-500' };
    if (healthFactor > 1.05) return { text: 'At Risk', color: 'text-orange-500' };
    return { text: 'Danger', color: 'text-red-500' };
  };
  
  const healthStatus = getHealthStatus();
  
  // Calculate current collateral value
  const collateralValue = cdp.collateralAmount * cdp.asset.priceUSD;
  
  // Format dates
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">
          {cdp.asset.symbol} Vault
        </h3>
        <div className={`px-2 py-1 rounded text-sm font-medium ${healthStatus.color}`}>
          {healthStatus.text}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-6">
        <div>
          <div className="text-sm text-muted-foreground">Collateral:</div>
          <div className="font-medium">
            {formatNumber(cdp.collateralAmount)} {cdp.asset.symbol}
            <span className="text-sm text-muted-foreground ml-1">
              (~{formatUSD(collateralValue)})
            </span>
          </div>
        </div>
        
        <div>
          <div className="text-sm text-muted-foreground">Debt:</div>
          <div className="font-medium">
            {formatNumber(cdp.debtAmount)} DAI
          </div>
        </div>
        
        <div>
          <div className="text-sm text-muted-foreground">Current Price:</div>
          <div>
            <AssetPriceDisplay assetId={cdp.asset.id} showTimestamp={false} />
          </div>
        </div>
        
        <div>
          <div className="text-sm text-muted-foreground">Liquidation Price:</div>
          <div className="font-medium">
            {formatUSD(cdp.liquidationPrice)}
          </div>
        </div>
        
        <div>
          <div className="text-sm text-muted-foreground">Collateral Ratio:</div>
          <div className="font-medium">
            {formatPercent(cdp.collateralRatio)}
          </div>
        </div>
        
        <div>
          <div className="text-sm text-muted-foreground">Min. Ratio:</div>
          <div className="font-medium">
            {formatPercent(cdp.asset.liquidationRatio)}
          </div>
        </div>
        
        <div>
          <div className="text-sm text-muted-foreground">Stability Fee:</div>
          <div className="font-medium">
            {formatPercent(cdp.asset.stabilityFee)}
          </div>
        </div>
        
        <div>
          <div className="text-sm text-muted-foreground">Fee Accrued:</div>
          <div className="font-medium">
            {formatNumber(cdp.stabilityFeeAccrued)} DAI
          </div>
        </div>
      </div>
      
      <div className="text-xs text-muted-foreground grid grid-cols-2 gap-4 mb-6">
        <div>
          <span>Created:</span>
          <span className="ml-1">{formatDate(cdp.createdAt)}</span>
        </div>
        <div>
          <span>Last Updated:</span>
          <span className="ml-1">{formatDate(cdp.lastUpdatedAt)}</span>
        </div>
      </div>
      
      <Button onClick={() => onManage(cdp)} fullWidth>
        Manage CDP
      </Button>
    </Card>
  );
};

export default CDPDetailsCard;
