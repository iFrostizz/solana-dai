/**
 * Utility functions for formatting numbers, percentages, currency, etc.
 */

/**
 * Format a number with comma separators and optional decimal places
 */
export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', { 
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

/**
 * Format a number as a percentage
 */
export function formatPercent(value: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', { 
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value / 100);
}

/**
 * Format a number as USD currency
 */
export function formatUSD(value: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

/**
 * Format a timestamp as a readable date
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}
