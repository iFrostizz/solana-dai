import Decimal from 'decimal.js';
import { SUPPORTED_ASSETS, SupportedAsset, DEFAULT_MIN_COLLATERAL_RATIO } from './supportedAssets';

// Set Decimal precision
Decimal.set({ precision: 18 });

export interface CDPCalculationResult {
  collateralValue: Decimal;     // USD value of collateral
  debtValue: Decimal;           // USD value of debt (DAI)
  collateralRatio: Decimal;     // Ratio of collateral to debt as percentage
  liquidationPrice: Decimal;    // Price at which position will be liquidated
  isValidCDP: boolean;          // Whether the CDP is valid (above min collateral ratio)
  exposure: string;             // Leverage exposure (e.g., "1x")
  maxDAI: Decimal;              // Maximum DAI that can be borrowed
}

/**
 * Calculate CDP metrics based on input values
 */
export function calculateCDP(
  collateralType: SupportedAsset,
  collateralAmount: number | string,
  debtAmount: number | string,
  minCollateralRatio: number = DEFAULT_MIN_COLLATERAL_RATIO,
): CDPCalculationResult {
  try {
    // Convert inputs to Decimal for precise calculations
    const collateralAmountDecimal = new Decimal(collateralAmount || 0);
    const debtAmountDecimal = new Decimal(debtAmount || 0);
    const collateralPriceDecimal = new Decimal(collateralType.priceUSD);
    const liquidationRatioDecimal = new Decimal(collateralType.liquidationRatio);
    const minCollateralRatioDecimal = new Decimal(minCollateralRatio);
    
    // Calculate collateral value in USD
    const collateralValue = collateralAmountDecimal.mul(collateralPriceDecimal);
    
    // If no debt, return baseline values
    if (debtAmountDecimal.isZero()) {
      return {
        collateralValue,
        debtValue: new Decimal(0),
        collateralRatio: new Decimal('Infinity'),
        liquidationPrice: new Decimal(0),
        isValidCDP: true,
        exposure: '1x',
        maxDAI: collateralValue.mul(collateralType.maxLTV),
      };
    }
    
    // Calculate debt value in USD
    const debtValue = debtAmountDecimal;
    
    // Calculate collateral ratio
    const collateralRatio = collateralValue.div(debtValue);
    
    // Calculate liquidation price
    const liquidationPrice = debtAmountDecimal
      .mul(liquidationRatioDecimal)
      .div(collateralAmountDecimal);
    
    // Calculate maximum DAI that can be borrowed
    const maxDAI = collateralValue.mul(collateralType.maxLTV);
    
    // Calculate exposure (leverage)
    const exposure = collateralValue.div(collateralValue.sub(debtValue)).toFixed(2);
    
    // Check if CDP is valid
    const isValidCDP = collateralRatio.gte(minCollateralRatioDecimal);
    
    return {
      collateralValue,
      debtValue,
      collateralRatio,
      liquidationPrice,
      isValidCDP,
      exposure: `${exposure}x`,
      maxDAI,
    };
  } catch {
    // Return default values in case of calculation errors
    return {
      collateralValue: new Decimal(0),
      debtValue: new Decimal(0),
      collateralRatio: new Decimal('Infinity'),
      liquidationPrice: new Decimal(0),
      isValidCDP: false,
      exposure: '1x',
      maxDAI: new Decimal(0),
    };
  }
}

/**
 * Format a number with comma separators and specified decimal places
 */
export function formatNumber(value: number | string | Decimal, decimals: number = 2): string {
  if (value === undefined || value === null) return '0';
  
  try {
    const decimalValue = new Decimal(value);
    if (decimalValue.isNaN()) return '0';
    
    return decimalValue
      .toFixed(decimals)
      .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  } catch {
    return '0';
  }
}

/**
 * Format a USD value with $ prefix and commas
 */
export function formatUSD(value: number | string | Decimal, decimals: number = 2): string {
  return `$${formatNumber(value, decimals)}`;
}

/**
 * Format a percentage value
 */
export function formatPercent(value: number | string | Decimal, decimals: number = 2): string {
  if (value === undefined || value === null) return '0%';
  
  try {
    const decimalValue = new Decimal(value).mul(100);
    if (decimalValue.isNaN()) return '0%';
    
    return `${decimalValue.toFixed(decimals)}%`;
  } catch {
    return '0%';
  }
}
