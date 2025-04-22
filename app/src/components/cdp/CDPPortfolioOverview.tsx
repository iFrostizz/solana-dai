"use client";

import React from 'react';
import Card from '../ui/Card';
import { CDPStats } from '@/utils/cdpTypes';
import { formatNumber, formatPercent, formatUSD } from '@/utils/cdp';

interface CDPPortfolioOverviewProps {
  stats: CDPStats;
}

const CDPPortfolioOverview: React.FC<CDPPortfolioOverviewProps> = ({ stats }) => {
  // Get the appropriate color for the risk level
  const getRiskColor = () => {
    switch (stats.liquidationRisk) {
      case 'none':
        return 'text-gray-500';
      case 'low':
        return 'text-green-500';
      case 'medium':
        return 'text-yellow-500';
      case 'high':
        return 'text-orange-500';
      case 'extreme':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <Card title="Portfolio Overview" gradient={true} className="w-full mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-1">Total Collateral</h4>
          <div className="text-2xl font-bold">{formatUSD(stats.totalCollateralValueUSD)}</div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-1">Total Debt</h4>
          <div className="text-2xl font-bold">{formatUSD(stats.totalDebtValueUSD)}</div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-1">Available to Borrow</h4>
          <div className="text-2xl font-bold">{formatUSD(stats.availableDaiToBorrow).replace('DAI', 'USDE')}</div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-1">Overall Collateral Ratio</h4>
          <div className="text-2xl font-bold">{formatPercent(stats.overallCollateralRatio)}</div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-1">Number of Vaults</h4>
          <div className="text-2xl font-bold">{stats.totalCollateralValueUSD > 0 ? '2' : '0'}</div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-1">Liquidation Risk</h4>
          <div className={`text-2xl font-bold ${getRiskColor()}`}>
            {stats.liquidationRisk.charAt(0).toUpperCase() + stats.liquidationRisk.slice(1)}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default CDPPortfolioOverview;
