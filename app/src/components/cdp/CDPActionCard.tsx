"use client";

import React, { useState, useEffect } from 'react';
import { CDPAction, CDPWithAsset } from '@/utils/cdpTypes';
import { formatNumber } from '@/utils/format';
import { Card } from '../ui/Card';
import Input from '../ui/Input';
import { Button } from '../ui/Button';

interface CDPActionCardProps {
  cdp: CDPWithAsset;
  actionType: CDPAction;
  maxAmount: number;
  isExecuting?: boolean;
  onExecute: (cdpId: string, actionType: CDPAction, amount: number) => void;
}

export default function CDPActionCard({
  cdp,
  actionType,
  maxAmount,
  isExecuting = false,
  onExecute,
}: CDPActionCardProps) {
  const [amount, setAmount] = useState<number>(0);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    setAmount(0);
    setError('');
  }, [actionType, cdp.id]);

  const handleAmountChange = (value: string) => {
    const parsedValue = parseFloat(value);

    if (isNaN(parsedValue)) {
      setAmount(0);
      return;
    }

    setAmount(parsedValue);

    if (parsedValue <= 0) {
      setError('Amount must be greater than 0');
    } else if (parsedValue > maxAmount) {
      setError(`Maximum amount allowed is ${formatNumber(maxAmount)}`);
    } else {
      setError('');
    }
  };

  const handleSetMax = () => {
    setAmount(maxAmount);
    setError('');
  };

  const handleExecute = () => {
    if (amount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    if (amount > maxAmount) {
      setError(`Maximum amount allowed is ${formatNumber(maxAmount)}`);
      return;
    }

    onExecute(cdp.id, actionType, amount);
  };

  const getActionDescription = () => {
    switch (actionType) {
      case CDPAction.BOOST:
        return 'Generate DAI to buy more collateral and add it to your vault';
      case CDPAction.REPAY:
        return 'Take out collateral to buy DAI and pay back debt';
      case CDPAction.SUPPLY:
        return 'Add more collateral to your vault';
      case CDPAction.WITHDRAW:
        return 'Withdraw collateral from your vault';
      case CDPAction.BORROW:
        return 'Generate more DAI from your vault';
      case CDPAction.PAYBACK:
        return 'Pay back the DAI debt of your vault';
      default:
        return '';
    }
  };

  const getInputLabel = () => {
    switch (actionType) {
      case CDPAction.BOOST:
      case CDPAction.BORROW:
        return 'DAI to generate';
      case CDPAction.REPAY:
      case CDPAction.PAYBACK:
        return 'DAI to pay back';
      case CDPAction.SUPPLY:
      case CDPAction.WITHDRAW:
        return `${cdp.asset.symbol} amount`;
      default:
        return 'Amount';
    }
  };

  const getButtonText = () => {
    return actionType.charAt(0) + actionType.slice(1).toLowerCase();
  };

  const handleError = (callback: () => void) => {
    try {
      callback();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
    }
  };

  return (
    <Card className="p-4">
      <div className="mb-4">
        <p className="text-sm text-muted-foreground mb-1">{getActionDescription()}</p>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1" htmlFor="amount">
          {getInputLabel()}
        </label>
        <div className="relative">
          <Input
            label=""
            type="number"
            value={amount === 0 ? '' : amount.toString()}
            onChange={handleAmountChange}
            placeholder="0.00"
            className="pr-20"
            disabled={isExecuting}
            min={0}
            max={maxAmount}
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs bg-accent/10 text-accent px-2 py-1 rounded"
            onClick={handleSetMax}
            disabled={isExecuting}
          >
            MAX
          </button>
        </div>
        {error && <p className="mt-1 text-sm text-error">{error}</p>}
      </div>

      <Button
        variant="primary"
        fullWidth
        onClick={() => handleError(handleExecute)}
        disabled={isExecuting || amount <= 0 || !!error}
      >
        {isExecuting ? 'Processing...' : getButtonText()}
      </Button>
    </Card>
  );
}
