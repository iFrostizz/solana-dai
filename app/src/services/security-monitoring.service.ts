"use client";

import { useState, useCallback, useEffect } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { BehaviorSubject } from 'rxjs';
import { obfuscateSensitiveData, isValidSolanaAddress } from '@/utils/securityUtils';

// Security events to monitor
export enum SecurityEventType {
  WALLET_CONNECTED = 'wallet_connected',
  TRANSACTION_INITIATED = 'transaction_initiated',
  TRANSACTION_SUCCEEDED = 'transaction_succeeded',
  TRANSACTION_FAILED = 'transaction_failed',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  SECURITY_ERROR = 'security_error',
  CDP_NEAR_LIQUIDATION = 'cdp_near_liquidation',
  UNKNOWN_DOMAIN_INTERACTION = 'unknown_domain_interaction',
  LARGE_TRANSACTION = 'large_transaction'
}

// Security threat levels
export enum ThreatLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Security event interface
export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  timestamp: number;
  data: any;
  walletAddress?: string;
  threatLevel: ThreatLevel;
  message: string;
}

// Security status interface
export interface SecurityStatus {
  status: 'secure' | 'warning' | 'alert';
  lastChecked: number;
  activeThreats: SecurityEvent[];
  securityScore: number; // 0-100
}

// Define security thresholds
const LARGE_TRANSACTION_THRESHOLD = 100; // In SOL or DAI
const MAX_TRANSACTIONS_PER_MINUTE = 10;
const MIN_SAFE_COLLATERAL_RATIO = 1.5; // 150%
const LIQUIDATION_WARNING_THRESHOLD = 0.2; // 20% above liquidation

// Subject for publishing security events throughout the application
const securityEvents$ = new BehaviorSubject<SecurityEvent[]>([]);
const securityStatus$ = new BehaviorSubject<SecurityStatus>({
  status: 'secure',
  lastChecked: Date.now(),
  activeThreats: [],
  securityScore: 100
});

// Record recent transactions to detect potential DoS attacks
const recentTransactions: { timestamp: number }[] = [];

// Allowed domains for external interactions
const ALLOWED_DOMAINS = [
  'solana.com',
  'solscan.io',
  'explorer.solana.com',
  'solanabeach.io',
  'app.solana-dai.com',
  'localhost'
];

/**
 * Generate a unique ID for security events
 */
function generateEventId(): string {
  return `sec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Log a security event
 */
export function logSecurityEvent(
  type: SecurityEventType,
  data: any,
  threatLevel: ThreatLevel = ThreatLevel.LOW,
  message = '',
  walletAddress?: string
): void {
  const event: SecurityEvent = {
    id: generateEventId(),
    type,
    timestamp: Date.now(),
    data,
    walletAddress: walletAddress ? obfuscateSensitiveData(walletAddress, 'wallet') : undefined,
    threatLevel,
    message
  };
  
  const currentEvents = securityEvents$.getValue();
  securityEvents$.next([...currentEvents, event]);
  
  // Update security status based on new event
  updateSecurityStatus(event);
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.info(`[SECURITY ${threatLevel.toUpperCase()}] ${type}: ${message}`);
  }
  
  // For high and critical threats, consider additional actions
  if (threatLevel === ThreatLevel.HIGH || threatLevel === ThreatLevel.CRITICAL) {
    notifyUserOfThreat(event);
  }
}

/**
 * Update security status based on new events
 */
function updateSecurityStatus(newEvent: SecurityEvent): void {
  const currentStatus = securityStatus$.getValue();
  const now = Date.now();
  
  // Add new threat if medium or higher
  let activeThreats = [...currentStatus.activeThreats];
  if (newEvent.threatLevel !== ThreatLevel.LOW) {
    activeThreats.push(newEvent);
  }
  
  // Remove threats older than 1 hour
  activeThreats = activeThreats.filter(
    threat => now - threat.timestamp < 60 * 60 * 1000
  );
  
  // Calculate security score (0-100)
  // Factors: number of active threats, highest threat level
  let securityScore = 100;
  
  // Deduct points for active threats
  securityScore -= activeThreats.length * 10;
  
  // Deduct based on highest threat level
  if (activeThreats.some(t => t.threatLevel === ThreatLevel.CRITICAL)) {
    securityScore -= 60;
  } else if (activeThreats.some(t => t.threatLevel === ThreatLevel.HIGH)) {
    securityScore -= 30;
  } else if (activeThreats.some(t => t.threatLevel === ThreatLevel.MEDIUM)) {
    securityScore -= 15;
  }
  
  // Ensure score stays within 0-100
  securityScore = Math.max(0, Math.min(100, securityScore));
  
  // Determine overall status
  let status: 'secure' | 'warning' | 'alert' = 'secure';
  if (securityScore < 50) {
    status = 'alert';
  } else if (securityScore < 80) {
    status = 'warning';
  }
  
  // Update the status
  securityStatus$.next({
    status,
    lastChecked: now,
    activeThreats,
    securityScore
  });
}

/**
 * Notify user of high-priority security threats
 */
function notifyUserOfThreat(event: SecurityEvent): void {
  // Display notification using the browser API if available
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      new Notification('Solana DAI Security Alert', {
        body: event.message,
        icon: '/favicon.ico'
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }
  
  // You could also send to a monitoring service in production
}

/**
 * Check if a transaction might be suspicious
 */
export function checkTransactionSecurity(transaction: any): { safe: boolean; threatLevel: ThreatLevel; message: string } {
  const now = Date.now();
  
  // Add transaction to recent list
  recentTransactions.push({ timestamp: now });
  
  // Clean up old transactions (older than 1 minute)
  const oneMinuteAgo = now - 60000;
  const recentCount = recentTransactions.filter(tx => tx.timestamp > oneMinuteAgo).length;
  
  // Remove transactions older than 5 minutes to save memory
  const fiveMinutesAgo = now - 300000;
  while (recentTransactions.length > 0 && recentTransactions[0].timestamp < fiveMinutesAgo) {
    recentTransactions.shift();
  }
  
  // Check for rate limiting (DoS protection)
  if (recentCount > MAX_TRANSACTIONS_PER_MINUTE) {
    return {
      safe: false,
      threatLevel: ThreatLevel.HIGH,
      message: `Too many transactions (${recentCount}) in the last minute. Potential DoS attack.`
    };
  }
  
  // Check for large value transactions
  const transactionValue = parseFloat(transaction.amount || '0');
  if (transactionValue > LARGE_TRANSACTION_THRESHOLD) {
    return {
      safe: true, // Still allow it, but flag as a potential concern
      threatLevel: ThreatLevel.MEDIUM,
      message: `Large transaction detected (${transactionValue}). Please verify this is intentional.`
    };
  }
  
  // All checks passed
  return {
    safe: true,
    threatLevel: ThreatLevel.LOW,
    message: 'Transaction appears secure'
  };
}

/**
 * Check if a CDP is at risk of liquidation
 */
export function checkCDPLiquidationRisk(
  collateralValue: number,
  debtValue: number,
  liquidationRatio: number
): { safe: boolean; threatLevel: ThreatLevel; message: string } {
  // Calculate current ratio
  const currentRatio = collateralValue / debtValue;
  
  // Calculate how close we are to liquidation
  const liquidationThreshold = liquidationRatio;
  const percentageAboveLiquidation = (currentRatio - liquidationThreshold) / liquidationThreshold;
  
  // Check various risk levels
  if (currentRatio <= liquidationThreshold) {
    // Already at or below liquidation threshold!
    return {
      safe: false,
      threatLevel: ThreatLevel.CRITICAL,
      message: `CDP at imminent risk of liquidation! Current ratio: ${(currentRatio * 100).toFixed(2)}%, Liquidation threshold: ${(liquidationThreshold * 100).toFixed(2)}%`
    };
  } else if (percentageAboveLiquidation < LIQUIDATION_WARNING_THRESHOLD) {
    // Getting close to liquidation
    return {
      safe: false,
      threatLevel: ThreatLevel.HIGH,
      message: `CDP at high risk of liquidation. Only ${(percentageAboveLiquidation * 100).toFixed(2)}% above threshold.`
    };
  } else if (currentRatio < MIN_SAFE_COLLATERAL_RATIO) {
    // Below recommended safety level
    return {
      safe: true,
      threatLevel: ThreatLevel.MEDIUM,
      message: `CDP below recommended safety ratio of ${(MIN_SAFE_COLLATERAL_RATIO * 100).toFixed(2)}%. Consider adding collateral.`
    };
  }
  
  // Safe
  return {
    safe: true,
    threatLevel: ThreatLevel.LOW,
    message: 'CDP has a safe collateral ratio'
  };
}

/**
 * Verify external domain is safe for interaction
 */
export function verifyExternalDomain(url: string): { safe: boolean; threatLevel: ThreatLevel; message: string } {
  try {
    const domain = new URL(url).hostname;
    
    // Check against allowed domains
    if (ALLOWED_DOMAINS.some(allowedDomain => domain.endsWith(allowedDomain))) {
      return {
        safe: true,
        threatLevel: ThreatLevel.LOW,
        message: 'Domain verified as safe'
      };
    }
    
    // Unknown domain
    return {
      safe: false,
      threatLevel: ThreatLevel.MEDIUM,
      message: `Interacting with unknown domain: ${domain}. Proceed with caution.`
    };
  } catch (error) {
    // Invalid URL
    return {
      safe: false,
      threatLevel: ThreatLevel.HIGH,
      message: 'Invalid URL provided. Potential phishing attempt.'
    };
  }
}

/**
 * Check wallet for potential security issues
 */
export function checkWalletSecurity(publicKey?: PublicKey | null): { safe: boolean; threatLevel: ThreatLevel; message: string } {
  if (!publicKey) {
    return {
      safe: false,
      threatLevel: ThreatLevel.MEDIUM,
      message: 'No wallet connected. Connect a wallet to proceed securely.'
    };
  }
  
  // Check wallet address format
  if (!isValidSolanaAddress(publicKey.toString())) {
    return {
      safe: false,
      threatLevel: ThreatLevel.CRITICAL,
      message: 'Invalid wallet address format detected!'
    };
  }
  
  // All checks passed
  return {
    safe: true,
    threatLevel: ThreatLevel.LOW,
    message: 'Wallet security checks passed'
  };
}

/**
 * React hook to monitor security status and events
 */
export function useSecurityMonitoring() {
  const { connection } = useConnection();
  const { publicKey, wallet } = useWallet();
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus>(securityStatus$.getValue());
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  
  // Subscribe to security events and status
  useEffect(() => {
    const statusSubscription = securityStatus$.subscribe(setSecurityStatus);
    const eventsSubscription = securityEvents$.subscribe(setSecurityEvents);
    
    return () => {
      statusSubscription.unsubscribe();
      eventsSubscription.unsubscribe();
    };
  }, []);
  
  // Check wallet security when wallet changes
  useEffect(() => {
    if (wallet) {
      const walletCheck = checkWalletSecurity(publicKey);
      
      if (!walletCheck.safe) {
        logSecurityEvent(
          SecurityEventType.SECURITY_ERROR,
          { wallet: wallet.adapter.name },
          walletCheck.threatLevel,
          walletCheck.message,
          publicKey?.toString()
        );
      } else {
        logSecurityEvent(
          SecurityEventType.WALLET_CONNECTED,
          { wallet: wallet.adapter.name },
          ThreatLevel.LOW,
          'Wallet connected securely',
          publicKey?.toString()
        );
      }
    }
  }, [wallet, publicKey]);
  
  // Run regular security checks
  useEffect(() => {
    const securityInterval = setInterval(() => {
      // Update last checked timestamp
      const currentStatus = securityStatus$.getValue();
      securityStatus$.next({
        ...currentStatus,
        lastChecked: Date.now()
      });
      
      // Additional periodic checks could be added here
      
    }, 60000); // Check every minute
    
    return () => clearInterval(securityInterval);
  }, []);
  
  // Log transaction initiation
  const logTransaction = useCallback((txData: any, threatLevel: ThreatLevel = ThreatLevel.LOW, message = 'Transaction initiated') => {
    logSecurityEvent(
      SecurityEventType.TRANSACTION_INITIATED,
      txData,
      threatLevel,
      message,
      publicKey?.toString()
    );
  }, [publicKey]);
  
  // Check CDP liquidation risk
  const checkCDPRisk = useCallback((collateralValue: number, debtValue: number, liquidationRatio: number) => {
    const riskCheck = checkCDPLiquidationRisk(collateralValue, debtValue, liquidationRatio);
    
    if (riskCheck.threatLevel !== ThreatLevel.LOW) {
      logSecurityEvent(
        SecurityEventType.CDP_NEAR_LIQUIDATION,
        { collateralValue, debtValue, liquidationRatio },
        riskCheck.threatLevel,
        riskCheck.message,
        publicKey?.toString()
      );
    }
    
    return riskCheck;
  }, [publicKey]);
  
  // Reset security status
  const resetSecurityStatus = useCallback(() => {
    securityStatus$.next({
      status: 'secure',
      lastChecked: Date.now(),
      activeThreats: [],
      securityScore: 100
    });
    
    // Clear all but the most recent events
    const currentEvents = securityEvents$.getValue();
    securityEvents$.next(currentEvents.slice(-5));
  }, []);
  
  return {
    securityStatus,
    securityEvents,
    logTransaction,
    checkCDPRisk,
    resetSecurityStatus,
    checkTransactionSecurity,
    verifyExternalDomain
  };
}
