"use client";

import React, { useState } from 'react';
import Header from '@/components/Header';
import { useCDPManagement } from '@/services/cdp-management.service';
import CDPPortfolioOverview from '@/components/cdp/CDPPortfolioOverview';
import CDPDetailsCard from '@/components/cdp/CDPDetailsCard';
import CDPActionCard from '@/components/cdp/CDPActionCard';
import { CDPAction, CDPWithAsset } from '@/utils/cdpTypes';
import { useWallet } from '@solana/wallet-adapter-react';
import Button from '@/components/ui/Button';
import Image from 'next/image';

export default function ManageCDP() {
  const { connected } = useWallet();
  const { cdps, cdpStats, isLoading, error, executeCDPAction } = useCDPManagement();
  const [selectedCDP, setSelectedCDP] = useState<CDPWithAsset | null>(null);
  const [activeActionTab, setActiveActionTab] = useState<CDPAction | null>(null);
  const [isActionExecuting, setIsActionExecuting] = useState(false);

  // Handle selecting a CDP to manage
  const handleManageCDP = (cdp: CDPWithAsset) => {
    setSelectedCDP(cdp);
    setActiveActionTab(CDPAction.BOOST); // Default action tab
  };

  // Handle going back to the CDP list
  const handleBackToList = () => {
    setSelectedCDP(null);
    setActiveActionTab(null);
  };

  // Execute a CDP action
  const handleExecuteAction = async (cdpId: string, actionType: CDPAction, amount: number) => {
    setIsActionExecuting(true);
    try {
      const result = await executeCDPAction({
        cdpId,
        actionType,
        amount
      });
      
      if (!result.success) {
        alert(result.message);
      }
    } catch (err: any) {
      alert(err.message || `Failed to execute ${actionType}`);
    } finally {
      setIsActionExecuting(false);
    }
  };

  // Get appropriate max amounts for different actions
  const getMaxActionAmount = (actionType: CDPAction): number => {
    if (!selectedCDP) return 0;
    
    switch (actionType) {
      case CDPAction.BOOST:
        // Max amount to borrow is based on available collateral value
        const maxBorrow = (selectedCDP.collateralAmount * selectedCDP.asset.priceUSD * selectedCDP.asset.maxLTV) - selectedCDP.debtAmount;
        return Math.max(0, maxBorrow);
      case CDPAction.REPAY:
        // Max amount of collateral to take out for repayment (keeping a safety buffer)
        const safeWithdrawalAmount = selectedCDP.collateralAmount * 0.8;
        return safeWithdrawalAmount;
      case CDPAction.SUPPLY:
        // For demo purposes, limit to 100 of the asset
        return 100;
      case CDPAction.WITHDRAW:
        // Max withdrawal while maintaining safe collateral ratio
        const minRequiredCollateral = (selectedCDP.debtAmount * selectedCDP.asset.liquidationRatio * 1.1) / selectedCDP.asset.priceUSD;
        const availableToWithdraw = selectedCDP.collateralAmount - minRequiredCollateral;
        return Math.max(0, availableToWithdraw);
      case CDPAction.BORROW:
        // Same as BOOST
        const maxBorrowAmount = (selectedCDP.collateralAmount * selectedCDP.asset.priceUSD * selectedCDP.asset.maxLTV) - selectedCDP.debtAmount;
        return Math.max(0, maxBorrowAmount);
      case CDPAction.PAYBACK:
        // Can pay back up to the full debt amount
        return selectedCDP.debtAmount;
      default:
        return 0;
    }
  };

  // Render the CDP management view when a CDP is selected
  const renderCDPManagement = () => {
    if (!selectedCDP) return null;

    return (
      <div>
        <div className="mb-4">
          <button 
            onClick={handleBackToList}
            className="flex items-center text-accent hover:underline"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to CDPs
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* CDP Details */}
          <div className="md:col-span-1">
            <CDPDetailsCard cdp={selectedCDP} onManage={() => {}} />
          </div>

          {/* CDP Actions */}
          <div className="md:col-span-2">
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              {/* Action Tabs */}
              <div className="flex overflow-x-auto scrollbar-hide">
                {[
                  CDPAction.BOOST,
                  CDPAction.REPAY,
                  CDPAction.SUPPLY,
                  CDPAction.WITHDRAW,
                  CDPAction.BORROW,
                  CDPAction.PAYBACK
                ].map((action) => (
                  <button
                    key={action}
                    className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                      activeActionTab === action
                        ? 'border-b-2 border-accent text-accent'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setActiveActionTab(action)}
                  >
                    {action.charAt(0) + action.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>

              {/* Action Content */}
              <div className="p-4">
                {activeActionTab && (
                  <CDPActionCard
                    cdp={selectedCDP}
                    actionType={activeActionTab}
                    onExecute={handleExecuteAction}
                    maxAmount={getMaxActionAmount(activeActionTab)}
                    isExecuting={isActionExecuting}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render the CDP list view
  const renderCDPList = () => {
    if (isLoading) {
      return <div className="text-center py-10">Loading your CDPs...</div>;
    }

    if (error) {
      return (
        <div className="text-center py-10 text-error">
          Error loading your CDPs. Please try again.
        </div>
      );
    }

    if (!connected) {
      return (
        <div className="text-center py-10">
          <div className="mb-4 text-muted-foreground">Connect your wallet to view your CDPs</div>
          <Button variant="primary" size="lg" disabled>
            Connect Wallet
          </Button>
        </div>
      );
    }

    if (cdps.length === 0) {
      return (
        <div className="text-center py-10">
          <div className="mb-6">
            <div className="relative mx-auto w-24 h-24 mb-4">
              <Image 
                src="/assets/empty-cdp.png" 
                alt="No CDPs found" 
                width={96} 
                height={96}
                className="opacity-60"
              />
            </div>
            <h3 className="text-lg font-medium mb-2">No Vaults Found</h3>
            <p className="text-muted-foreground">
              You don't have any active vaults. Create a CDP to get started.
            </p>
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={() => window.location.href = '/create-cdp'}
          >
            Create CDP
          </Button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cdps.map((cdp) => (
          <CDPDetailsCard
            key={cdp.id}
            cdp={cdp}
            onManage={handleManageCDP}
          />
        ))}
      </div>
    );
  };

  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Manage CDPs</h1>
          <p className="text-muted-foreground">
            View and manage your active CDPs. Add collateral, borrow more DAI, or pay back your debt.
          </p>
        </div>

        {connected && cdps.length > 0 && (
          <CDPPortfolioOverview stats={cdpStats} />
        )}

        {selectedCDP ? renderCDPManagement() : renderCDPList()}
      </div>
    </main>
  );
}
