"use client";

import React, { useState, useEffect } from 'react';
import Card from './ui/Card';
import Input from './ui/Input';
import Button from './ui/Button';
import Dropdown, { DropdownOption } from './ui/Dropdown';
import { calculateCDP, formatNumber, formatUSD, formatPercent } from '@/utils/cdp';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletTokens } from '@/services/wallet.service';
import { useCDPService, CreateCDPParams } from '@/services/cdp.service';
import { SupportedAsset, SUPPORTED_ASSETS, DEFAULT_MIN_COLLATERAL_RATIO } from '@/utils/supportedAssets';
import AssetPriceDisplay from './AssetPriceDisplay';
import { usePriceOracle } from '@/services/price.service';
import { sanitizeNumber, validateCDPInput, isValidSolanaAddress, generateSecureTransactionId } from '@/utils/securityUtils';

const CDPCreationForm: React.FC = () => {
  const { publicKey, connected } = useWallet();
  const { supportedUserTokens, isLoading: tokensLoading } = useWalletTokens();
  const { createCDP, validateCDPCreation } = useCDPService();
  const { getPriceForAsset } = usePriceOracle();
  
  // State variables for form inputs
  const [selectedAsset, setSelectedAsset] = useState<SupportedAsset>(SUPPORTED_ASSETS[0]);
  const [collateralAmount, setCollateralAmount] = useState('3');
  const [debtAmount, setDebtAmount] = useState('10000');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [recipientAddress, setRecipientAddress] = useState<string | null>(null);
  
  // Limit options to supported assets
  const [assetOptions, setAssetOptions] = useState<DropdownOption[]>(
    SUPPORTED_ASSETS.map(asset => ({
      id: asset.id,
      name: asset.name,
      symbol: asset.symbol,
      image: asset.logoUri
    }))
  );

  // Update asset options when wallet tokens change
  useEffect(() => {
    if (connected && supportedUserTokens.length > 0) {
      // Create options from user's tokens that match our supported assets
      const userTokenOptions = supportedUserTokens
        .filter(token => token.asset)
        .map(token => {
          const asset = token.asset!;
          return {
            id: asset.id,
            name: asset.name,
            symbol: asset.symbol,
            image: asset.logoUri,
            balance: token.uiBalance
          };
        });
      
      // If the user doesn't have any supported tokens, show all options
      if (userTokenOptions.length > 0) {
        setAssetOptions(userTokenOptions);
        
        // Set the first user token as selected if we don't have one yet
        if (!selectedAsset || !supportedUserTokens.some(t => t.asset?.id === selectedAsset.id)) {
          setSelectedAsset(supportedUserTokens[0].asset!);
        }
      }
    } else {
      // When not connected, show all supported assets
      setAssetOptions(SUPPORTED_ASSETS.map(asset => ({
        id: asset.id,
        name: asset.name,
        symbol: asset.symbol,
        image: asset.logoUri
      })));
    }
  }, [connected, supportedUserTokens, selectedAsset]);
  
  // Get the latest price data for the selected asset
  const priceData = getPriceForAsset(selectedAsset.id);
  
  // Use the real-time price if available, otherwise fall back to the static price
  const currentPrice = priceData?.price || selectedAsset.priceUSD;
  
  // Calculate CDP metrics with real-time price
  const cdpMetricsWithStaticPrice = calculateCDP(selectedAsset, collateralAmount, debtAmount);
  
  // Recalculate CDP metrics with dynamic price if available
  const cdpMetrics = priceData 
    ? calculateCDP({ ...selectedAsset, priceUSD: currentPrice }, collateralAmount, debtAmount)
    : cdpMetricsWithStaticPrice;

  // Handle collateral type selection
  const handleCollateralTypeChange = (option: DropdownOption) => {
    const selected = SUPPORTED_ASSETS.find(asset => asset.id === option.id);
    if (selected) {
      setSelectedAsset(selected);
    }
  };

  // Get user balance for current selected asset
  const getUserBalanceForSelectedAsset = () => {
    if (!connected || !selectedAsset) return null;
    
    const tokenAccount = supportedUserTokens.find(
      token => token.asset?.id === selectedAsset.id
    );
    
    return tokenAccount ? tokenAccount.uiBalance : null;
  };

  // Create CDP transaction
  const handleCreateCDP = async () => {
    setIsSubmitting(true);
    setError('');
    setSuccess(null);
    
    try {
      // Generate a secure transaction ID for tracking
      const transactionId = generateSecureTransactionId();
      
      // Sanitize input values to prevent attacks
      const sanitizedCollateralAmount = sanitizeNumber(collateralAmount);
      const sanitizedDebtAmount = sanitizeNumber(debtAmount);
      
      // Additional validation with security checks
      if (!selectedAsset) {
        throw new Error('Please select a collateral asset');
      }
      
      // Validate Solana address if creating for another user
      if (recipientAddress && !isValidSolanaAddress(recipientAddress)) {
        throw new Error('Invalid recipient Solana address');
      }
      
      // Validate CDP inputs with security constraints
      const validation = validateCDPInput(
        sanitizedCollateralAmount,
        sanitizedDebtAmount,
        selectedAsset.liquidationRatio
      );
      
      if (!validation.valid) {
        throw new Error(validation.message);
      }
      
      // Log secure transaction attempt (for audit trail)
      console.info(`[Secure TX: ${transactionId}] Creating CDP with ${sanitizedCollateralAmount} ${selectedAsset.symbol} collateral for ${sanitizedDebtAmount} DAI`);
      
      // Proceed with transaction
      const result = await createCDP({
        collateralMint: selectedAsset.mintAddress,
        collateralAmount: sanitizedCollateralAmount,
        daiAmount: sanitizedDebtAmount
      });
      
      // Transaction successful
      setSuccess(`Successfully created CDP with ${sanitizedCollateralAmount} ${selectedAsset.symbol} - Transaction ID: ${result.signature}`);
      
      // Reset form after short delay
      setTimeout(() => {
        resetForm();
      }, 5000);
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('CDP Creation Error:', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Balance display for selected asset
  const balanceDisplay = () => {
    if (!connected) return null;
    
    const balance = getUserBalanceForSelectedAsset();
    if (balance === null) return null;
    
    return (
      <div className="text-xs text-muted-foreground ml-1">
        (Your balance: {formatNumber(balance)} {selectedAsset.symbol})
      </div>
    );
  };

  const resetForm = () => {
    setCollateralAmount('3');
    setDebtAmount('10000');
    setRecipientAddress(null);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <Card title="Create CDP" gradient={true} className="mb-8">
        <p className="text-muted-foreground mb-6">
          Creating a CDP allows you to generate DAI by depositing one of supported collateral types
        </p>
        
        {/* Collateral Selection */}
        <div className="mb-6">
          <Dropdown
            label="Collateral Type"
            options={assetOptions}
            selected={{
              id: selectedAsset.id,
              name: selectedAsset.name,
              symbol: selectedAsset.symbol,
              image: selectedAsset.logoUri
            }}
            onChange={handleCollateralTypeChange}
          />
          <div className="flex items-center mt-1">
            {balanceDisplay()}
            <span className="text-xs text-muted-foreground ml-auto">
              (max {formatNumber(cdpMetrics.maxDAI)} DAI)
            </span>
          </div>
        </div>
        
        {/* Collateral Amount Input */}
        <div className="mb-6">
          <Input
            label="Collateral:"
            value={collateralAmount}
            onChange={setCollateralAmount}
            type="number"
            suffix={selectedAsset.symbol}
          />
          <div className="flex items-center mt-1">
            <span className="text-xs text-muted-foreground">
              ~{formatUSD(cdpMetrics.collateralValue)}
            </span>
            {connected && (
              <span className="ml-2 text-xs text-muted-foreground">
                {balanceDisplay()}
              </span>
            )}
          </div>
        </div>
        
        {/* Debt Amount Input */}
        <div className="mb-6">
          <Input
            label="Debt:"
            value={debtAmount}
            onChange={setDebtAmount}
            type="number"
            suffix="DAI"
          />
          <div className="flex items-center mt-1">
            <span className="text-xs text-muted-foreground">
              (max {formatNumber(cdpMetrics.maxDAI)} DAI)
            </span>
          </div>
        </div>
        
        {/* Recipient Address Input */}
        <div className="mb-6">
          <Input
            label="Recipient Address (optional):"
            value={recipientAddress || ''}
            onChange={setRecipientAddress}
            type="text"
          />
        </div>
        
        {/* CDP Information */}
        <div className="bg-muted rounded-lg p-4 mb-6">
          <h4 className="font-medium mb-3">Leveraged</h4>
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <div className="text-sm text-muted-foreground">Collateral:</div>
              <div className="font-medium">{collateralAmount} {selectedAsset.symbol}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Exposure:</div>
              <div className="font-medium">{cdpMetrics.exposure}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <div className="text-sm text-muted-foreground">Received DAI:</div>
              <div className="font-medium">{formatNumber(debtAmount)} DAI</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Coll. ratio:</div>
              <div className={`font-medium ${
                !cdpMetrics.isValidCDP ? 'text-error' : ''
              }`}>
                {formatPercent(cdpMetrics.collateralRatio)}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <div className="text-sm text-muted-foreground">Price:</div>
              <div className="flex items-center">
                <AssetPriceDisplay assetId={selectedAsset.id} />
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Liquidation price:</div>
              <div className="font-medium">{formatUSD(cdpMetrics.liquidationPrice)}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Liquidation ratio:</div>
              <div className="font-medium">{formatPercent(selectedAsset.liquidationRatio)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Stability Fee:</div>
              <div className="font-medium">{formatPercent(selectedAsset.stabilityFee)}</div>
            </div>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between mb-2">
            <span className="text-sm">DAI available from {selectedAsset.symbol}:</span>
            <span className="text-sm font-medium">{formatNumber(10_000_000)} DAI</span>
          </div>
          <div className={`text-sm ${!cdpMetrics.isValidCDP ? 'text-error' : 'text-muted-foreground'}`}>
            Create your ratio must be over {formatPercent(DEFAULT_MIN_COLLATERAL_RATIO)}
          </div>
        </div>
        
        {error && (
          <div className="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}
        
        <Button 
          onClick={handleCreateCDP} 
          fullWidth
          disabled={!connected || !cdpMetrics.isValidCDP || isSubmitting}
          className="mt-4"
        >
          {isSubmitting ? 'Creating CDP...' : connected ? 'Create CDP' : 'Connect Wallet to Create CDP'}
        </Button>
      </Card>
    </div>
  );
};

export default CDPCreationForm;
