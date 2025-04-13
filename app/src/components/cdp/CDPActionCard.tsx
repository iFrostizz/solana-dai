"use client";

import React, { useState } from 'react';
import { CDPAction, CDPWithAsset } from '@/utils/cdpTypes';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { formatNumber, formatPercent, formatUSD } from '@/utils/cdp';
import AssetPriceDisplay from '../AssetPriceDisplay';

interface CDPActionCardProps {
  cdp: CDPWithAsset;
  actionType: CDPAction;
  onExecute: (cdpId: string, actionType: CDPAction, amount: number) => Promise<void>;
  maxAmount?: number;
  isExecuting: boolean;
}

const CDPActionCard: React.FC<CDPActionCardProps> = ({
  cdp,
  actionType,
  onExecute,
  maxAmount,
  isExecuting
}) => {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  const getActionTitle = (): string => {
    switch (actionType) {
      case CDPAction.BOOST:
        return 'Boost Position';
      case CDPAction.REPAY:
        return 'Repay Debt';
      case CDPAction.SUPPLY:
        return 'Supply Collateral';
      case CDPAction.WITHDRAW:
        return 'Withdraw Collateral';
      case CDPAction.BORROW:
        return 'Borrow More DAI';
      case CDPAction.PAYBACK:
        return 'Pay Back DAI';
      default:
        return 'Action';
    }
  };

  const getActionDescription = (): string => {
    switch (actionType) {
      case CDPAction.BOOST:
        return `Generate DAI to buy more ${cdp.asset.symbol} and add it to your vault.`;
      case CDPAction.REPAY:
        return `Take out ${cdp.asset.symbol} to buy DAI and pay back debt.`;
      case CDPAction.SUPPLY:
        return `Add more ${cdp.asset.symbol} collateral to your vault.`;
      case CDPAction.WITHDRAW:
        return `Withdraw ${cdp.asset.symbol} collateral from your vault.`;
      case CDPAction.BORROW:
        return `Generate more DAI from your vault.`;
      case CDPAction.PAYBACK:
        return `Pay back the DAI debt of your vault.`;
      default:
        return '';
    }
  };

  const getInputLabel = (): string => {
    switch (actionType) {
      case CDPAction.BOOST:
      case CDPAction.BORROW:
      case CDPAction.PAYBACK:
        return 'DAI Amount:';
      case CDPAction.REPAY:
      case CDPAction.SUPPLY:
      case CDPAction.WITHDRAW:
        return `${cdp.asset.symbol} Amount:`;
      default:
        return 'Amount:';
    }
  };

  const getInputSuffix = (): string => {
    switch (actionType) {
      case CDPAction.BOOST:
      case CDPAction.BORROW:
      case CDPAction.PAYBACK:
        return 'DAI';
      case CDPAction.REPAY:
      case CDPAction.SUPPLY:
      case CDPAction.WITHDRAW:
        return cdp.asset.symbol;
      default:
        return '';
    }
  };

  const validateAmount = (): boolean => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return false;
    }

    if (maxAmount && parseFloat(amount) > maxAmount) {
      setError(`Amount exceeds maximum (${formatNumber(maxAmount)})`);
      return false;
    }

    // Additional action-specific validations
    switch (actionType) {
      case CDPAction.WITHDRAW:
        // Make sure withdrawal doesn't reduce collateral ratio too much
        const newCollateralAmount = cdp.collateralAmount - parseFloat(amount);
        const newCollateralValue = newCollateralAmount * cdp.asset.priceUSD;
        const newRatio = newCollateralValue / cdp.debtAmount;
        
        if (newRatio < cdp.asset.liquidationRatio * 1.05) { // 5% buffer above liquidation
          setError(`Withdrawal would put your position at risk of liquidation`);
          return false;
        }
        break;
      case CDPAction.BORROW:
        // Make sure borrowing doesn't reduce collateral ratio too much
        const newDebtAmount = cdp.debtAmount + parseFloat(amount);
        const collateralValue = cdp.collateralAmount * cdp.asset.priceUSD;
        const borrowRatio = collateralValue / newDebtAmount;
        
        if (borrowRatio < cdp.asset.liquidationRatio * 1.05) { // 5% buffer above liquidation
          setError(`Borrowing would put your position at risk of liquidation`);
          return false;
        }
        break;
    }

    setError(null);
    return true;
  };

  const handleExecute = async () => {
    if (!validateAmount()) return;
    
    try {
      await onExecute(cdp.id, actionType, parseFloat(amount));
      setAmount(''); // Reset input after successful execution
    } catch (err: any) {
      setError(err.message || 'Failed to execute action');
    }
  };

  const handleSetMax = () => {
    if (maxAmount) {
      setAmount(maxAmount.toString());
    }
  };

  return (
    <Card title={getActionTitle()} className="w-full">
      <p className="text-sm text-muted-foreground mb-4">
        {getActionDescription()}
      </p>

      <div className="space-y-4">
        <div className="flex justify-between text-sm">
          <span>Current Collateral:</span>
          <span>{formatNumber(cdp.collateralAmount)} {cdp.asset.symbol}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span>Current Debt:</span>
          <span>{formatNumber(cdp.debtAmount)} DAI</span>
        </div>

        <div className="flex justify-between text-sm">
          <span>Current Price:</span>
          <AssetPriceDisplay assetId={cdp.asset.id} />
        </div>

        <div className="flex justify-between text-sm">
          <span>Collateral Ratio:</span>
          <span className={`${cdp.collateralRatio < cdp.asset.liquidationRatio * 1.1 ? 'text-error' : ''}`}>
            {formatPercent(cdp.collateralRatio)}
          </span>
        </div>

        <div className="mt-4">
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium">{getInputLabel()}</label>
            {maxAmount && (
              <button 
                onClick={handleSetMax}
                className="text-xs text-accent hover:underline"
              >
                Max: {formatNumber(maxAmount)}
              </button>
            )}
          </div>
          <Input
            value={amount}
            onChange={setAmount}
            type="number"
            suffix={getInputSuffix()}
            placeholder="Enter amount"
          />
          {error && (
            <p className="mt-1 text-xs text-error">{error}</p>
          )}
        </div>

        <Button
          onClick={handleExecute}
          fullWidth
          disabled={isExecuting || !amount}
        >
          {isExecuting ? 'Processing...' : `Execute ${getActionTitle()}`}
        </Button>
      </div>
    </Card>
  );
};

export default CDPActionCard;
