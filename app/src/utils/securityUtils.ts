/**
 * Security utilities for Solana DAI application
 */

import { PublicKey } from '@solana/web3.js';

/**
 * Validates a Solana address to ensure it's correctly formatted
 * @param address The address to validate
 * @returns Boolean indicating if the address is valid
 */
export function isValidSolanaAddress(address: string): boolean {
  try {
    // Attempt to create a PublicKey, which validates the format
    new PublicKey(address);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Sanitizes user input to prevent XSS attacks
 * @param input String to sanitize
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  // Replace potentially dangerous characters
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validates a CDP input to ensure it's within safe parameters
 * @param collateralAmount Amount of collateral
 * @param debtAmount Amount of debt
 * @param collateralRatio The required collateral ratio
 * @returns Object with validation status and error message if any
 */
export function validateCDPInput(
  collateralAmount: number,
  debtAmount: number,
  collateralRatio: number
): { valid: boolean; message?: string } {
  // Must have positive values
  if (collateralAmount <= 0) {
    return { valid: false, message: 'Collateral amount must be greater than 0' };
  }
  
  if (debtAmount <= 0) {
    return { valid: false, message: 'Debt amount must be greater than 0' };
  }
  
  // Ensure collateral ratio is safe (add 10% buffer to minimum required)
  const actualRatio = collateralAmount / debtAmount;
  if (actualRatio < (collateralRatio * 1.1)) {
    return { 
      valid: false, 
      message: `Collateral ratio too low. Minimum safe ratio is ${(collateralRatio * 1.1).toFixed(2)}` 
    };
  }
  
  return { valid: true };
}

/**
 * Rate limits user actions to prevent brute force or DoS attacks
 */
export class RateLimiter {
  private attempts: Map<string, { count: number; lastAttempt: number }> = new Map();
  private maxAttempts: number;
  private timeWindowMs: number;
  
  constructor(maxAttempts = 5, timeWindowMs = 60000) {
    this.maxAttempts = maxAttempts;
    this.timeWindowMs = timeWindowMs;
  }
  
  /**
   * Check if an action is allowed based on previous attempts
   * @param identifier Unique ID for the action (e.g. wallet address, IP, etc.)
   * @returns Boolean indicating if the action is allowed
   */
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const record = this.attempts.get(identifier);
    
    // First attempt
    if (!record) {
      this.attempts.set(identifier, { count: 1, lastAttempt: now });
      return true;
    }
    
    // Reset if outside time window
    if (now - record.lastAttempt > this.timeWindowMs) {
      this.attempts.set(identifier, { count: 1, lastAttempt: now });
      return true;
    }
    
    // Increment and check
    record.count += 1;
    record.lastAttempt = now;
    this.attempts.set(identifier, record);
    
    return record.count <= this.maxAttempts;
  }
  
  /**
   * Reset the count for a specific identifier
   * @param identifier The identifier to reset
   */
  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
}

/**
 * Security check for transaction parameters to prevent common attacks
 * @param transactionParams Parameters for the transaction
 * @returns Object with check status and error message if any
 */
export function securityCheckTransaction(transactionParams: any): { safe: boolean; message?: string } {
  // No empty transactions
  if (!transactionParams) {
    return { safe: false, message: 'Invalid transaction parameters' };
  }
  
  // Validate transaction has appropriate fields
  if (transactionParams.cdpId && !isValidSolanaAddress(transactionParams.cdpId)) {
    return { safe: false, message: 'Invalid CDP identifier' };
  }
  
  // Check for reasonable amounts (prevent absurdly large values that could be malicious)
  if (transactionParams.amount && 
    (Number.isNaN(transactionParams.amount) || 
     !isFinite(transactionParams.amount) || 
     transactionParams.amount <= 0 ||
     transactionParams.amount > 1000000000)) { // Set appropriate upper limit
    return { safe: false, message: 'Invalid transaction amount' };
  }
  
  return { safe: true };
}

/**
 * Generate a secure transaction ID with entropy
 * @returns A secure transaction ID
 */
export function generateSecureTransactionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  const entropy = new Uint8Array(8);
  crypto.getRandomValues(entropy);
  
  const entropyString = Array.from(entropy)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
  
  return `${timestamp}-${random}-${entropyString}`;
}

/**
 * Obfuscate sensitive data for logging or UI display
 * @param data Data to obfuscate
 * @param type Type of data being obfuscated
 * @returns Obfuscated string
 */
export function obfuscateSensitiveData(data: string, type: 'wallet' | 'key' | 'txn'): string {
  if (!data) return '';
  
  switch (type) {
    case 'wallet':
      // Show first 4 and last 4 characters of wallet address
      return data.length > 8 
        ? `${data.substring(0, 4)}...${data.substring(data.length - 4)}`
        : '****';
      
    case 'key':
      // Completely hide keys
      return '*'.repeat(data.length);
      
    case 'txn':
      // Show first 6 characters of transaction ID
      return data.length > 6
        ? `${data.substring(0, 6)}...`
        : '****';
        
    default:
      return '****';
  }
}

/**
 * Validate and clean numbers to prevent attacks via malformed inputs
 * @param value The number to validate
 * @param defaultValue Default value to return if invalid
 * @returns Sanitized number
 */
export function sanitizeNumber(value: any, defaultValue = 0): number {
  if (value === null || value === undefined) return defaultValue;
  
  const num = Number(value);
  
  if (isNaN(num) || !isFinite(num)) {
    return defaultValue;
  }
  
  // Prevent ridiculously large numbers that might cause issues
  if (num > Number.MAX_SAFE_INTEGER || num < Number.MIN_SAFE_INTEGER) {
    return defaultValue;
  }
  
  return num;
}

/**
 * Encrypt sensitive data before storing in local storage
 * @param data Data to encrypt
 * @param key Encryption key (unique to user session)
 * @returns Encrypted data
 */
export function encryptForStorage(data: string, key: string): string {
  // This is a simplified version - in production use a proper crypto library
  try {
    // Basic XOR encryption for demo purposes
    const encryptedChars = [];
    for (let i = 0; i < data.length; i++) {
      const dataChar = data.charCodeAt(i);
      const keyChar = key.charCodeAt(i % key.length);
      encryptedChars.push(dataChar ^ keyChar);
    }
    
    return btoa(encryptedChars.join(','));
  } catch (error) {
    console.error('Encryption failed:', error);
    return '';
  }
}

/**
 * Decrypt data from storage
 * @param encryptedData Encrypted data
 * @param key Encryption key
 * @returns Decrypted data
 */
export function decryptFromStorage(encryptedData: string, key: string): string {
  // This is a simplified version - in production use a proper crypto library
  try {
    const encryptedChars = atob(encryptedData).split(',').map(Number);
    const decryptedChars = [];
    
    for (let i = 0; i < encryptedChars.length; i++) {
      const encryptedChar = encryptedChars[i];
      const keyChar = key.charCodeAt(i % key.length);
      decryptedChars.push(String.fromCharCode(encryptedChar ^ keyChar));
    }
    
    return decryptedChars.join('');
  } catch (error) {
    console.error('Decryption failed:', error);
    return '';
  }
}
