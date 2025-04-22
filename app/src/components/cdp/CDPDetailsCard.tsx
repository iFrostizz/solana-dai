"use client";

import React from 'react';
import { CDPWithAsset } from '@/utils/cdpTypes';
import { formatNumber, formatPercent, formatUSD, formatDate } from '@/utils/format';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface CDPDetailsCardProps {
  cdp: CDPWithAsset;
  onManage: (cdp: CDPWithAsset) => void;
}

export default function CDPDetailsCard({ cdp, onManage }: CDPDetailsCardProps) {
  // Function to determine health status color
  const getHealthColor = () => {
    const ratio = cdp.collateralRatio;
    const min = cdp.asset.liquidationRatio;
    
    if (ratio < min * 1.1) {
      return 'text-error'; // Danger
    } else if (ratio < min * 1.5) {
      return 'text-warning'; // Warning
    } else {
      return 'text-success'; // Safe
    }
  };
  
  // Function to get health status text
  const getHealthStatus = () => {
    const ratio = cdp.collateralRatio;
    const min = cdp.asset.liquidationRatio;
    
    if (ratio < min * 1.1) {
      return 'At Risk';
    } else if (ratio < min * 1.5) {
      return 'Warning';
    } else {
      return 'Safe';
    }
  };
  
  return (
    <Card className="h-full">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center mr-3">
              <span className="text-accent font-bold">{cdp.asset.symbol}</span>
            </div>
            <div>
              <h3 className="font-medium">{cdp.asset.name} CDP</h3>
              <p className="text-xs text-muted-foreground">#{cdp.id.slice(0, 8)}</p>
            </div>
          </div>
          <div className={`px-2 py-1 rounded text-xs font-medium ${getHealthColor()} bg-opacity-10`}>
            {getHealthStatus()}
          </div>
        </div>
        
        <div className="flex-1 space-y-3 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Collateral:</span>
            <span className="font-medium">
              {formatNumber(cdp.collateralAmount)} {cdp.asset.symbol} 
              <span className="text-muted-foreground ml-1">
                ({formatUSD(cdp.collateralAmount * cdp.asset.priceUSD)})
              </span>
            </span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Debt:</span>
            <span className="font-medium">
              {formatNumber(cdp.debtAmount)} USDE
            </span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Collateral Ratio:</span>
            <span className={`font-medium ${getHealthColor()}`}>
              {formatPercent(cdp.collateralRatio * 100)}
            </span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Current Price:</span>
            <span className="font-medium">
              {formatUSD(cdp.asset.priceUSD)} / {cdp.asset.symbol}
            </span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Liquidation Price:</span>
            <span className="font-medium">
              {formatUSD((cdp.debtAmount * cdp.asset.liquidationRatio) / cdp.collateralAmount)}
            </span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Stability Fee:</span>
            <span className="font-medium">
              {formatPercent(cdp.asset.stabilityFee * 100)}
            </span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Created:</span>
            <span className="font-medium">
              {formatDate(typeof cdp.createdAt === 'number' ? cdp.createdAt : new Date(cdp.createdAt).getTime())}
            </span>
          </div>
        </div>
        
        <Button onClick={() => onManage(cdp)} fullWidth>
          Manage CDP
        </Button>
      </div>
    </Card>
  );
}
