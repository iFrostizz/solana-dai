"use client";

import React, { useState } from 'react';
import { Transaction, VersionedTransaction, PublicKey } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { useSecurityMonitoring, ThreatLevel } from '@/services/security-monitoring.service';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { obfuscateSensitiveData, isValidSolanaAddress } from '@/utils/securityUtils';

interface TransactionSignerProps {
  transaction: Transaction | VersionedTransaction;
  title?: string;
  description?: string;
  onSuccess: (signature: string) => void;
  onError: (error: Error) => void;
  onCancel: () => void;
  transactionDetails?: {
    type: string;
    amount?: number;
    asset?: string;
    destination?: string;
    fee?: number;
    [key: string]: any;
  };
}

export default function TransactionSigner({
  transaction,
  title = 'Confirm Transaction',
  description = 'Please review the transaction details before signing.',
  onSuccess,
  onError,
  onCancel,
  transactionDetails
}: TransactionSignerProps) {
  const { signTransaction, publicKey } = useWallet();
  const { logTransaction, checkTransactionSecurity } = useSecurityMonitoring();
  const [isSigningInProgress, setIsSigningInProgress] = useState(false);
  const [securityWarnings, setSecurityWarnings] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Perform security checks on transaction
  const runSecurityChecks = () => {
    if (!transactionDetails) return true;
    
    const warnings: string[] = [];
    
    // Check transaction security
    const securityCheck = checkTransactionSecurity(transactionDetails);
    if (securityCheck.threatLevel !== ThreatLevel.LOW) {
      warnings.push(securityCheck.message);
    }
    
    // Destination address check
    if (transactionDetails.destination && !isValidSolanaAddress(transactionDetails.destination)) {
      warnings.push('Invalid destination address format');
    }
    
    // High-value transaction check
    if (transactionDetails.amount && transactionDetails.amount > 100) {
      warnings.push(`Large transaction amount: ${transactionDetails.amount} ${transactionDetails.asset || 'tokens'}`);
    }
    
    // Update the warnings
    setSecurityWarnings(warnings);
    
    // Return if transaction is safe to proceed
    return securityCheck.safe;
  };
  
  // Handle Sign button click
  const handleSign = async () => {
    if (!signTransaction) {
      onError(new Error('Wallet does not support transaction signing'));
      return;
    }
    
    // Run security checks
    runSecurityChecks();
    
    // If there are warnings, they're already displayed, but we allow the user to proceed
    setIsSigningInProgress(true);
    
    try {
      // Log the transaction attempt
      logTransaction(
        transactionDetails || { transactionType: 'unknown' },
        securityWarnings.length > 0 ? ThreatLevel.MEDIUM : ThreatLevel.LOW,
        `Signing ${transactionDetails?.type || 'transaction'}`
      );
      
      // Sign the transaction
      const signedTransaction = await signTransaction(transaction);
      
      // Get signature (depends on transaction type)
      let signature = '';
      if ('signatures' in signedTransaction) {
        // For legacy transactions
        signature = signedTransaction.signatures[0]?.toString() || '';
      } else if ('signature' in signedTransaction) {
        // For versioned transactions
        const versionedTx = signedTransaction as unknown as { signature: Uint8Array | null };
        signature = versionedTx.signature?.toString() || '';
      }
      
      // Return the signature
      onSuccess(signature);
    } catch (error) {
      if (error instanceof Error) {
        onError(error);
      } else {
        onError(new Error('Unknown error occurred during signing'));
      }
    } finally {
      setIsSigningInProgress(false);
    }
  };
  
  // Format details for display
  const getFormattedDetails = () => {
    if (!transactionDetails) return [];
    
    const details = [];
    
    if (transactionDetails.type) {
      details.push({ label: 'Transaction Type', value: transactionDetails.type });
    }
    
    if (transactionDetails.amount !== undefined) {
      details.push({ 
        label: 'Amount', 
        value: `${transactionDetails.amount} ${transactionDetails.asset || 'tokens'}` 
      });
    }
    
    if (transactionDetails.destination) {
      details.push({ 
        label: 'Destination', 
        value: obfuscateSensitiveData(transactionDetails.destination, 'wallet')
      });
    }
    
    if (transactionDetails.fee !== undefined) {
      details.push({ label: 'Network Fee', value: `${transactionDetails.fee} SOL` });
    }
    
    // Add any other details
    Object.entries(transactionDetails).forEach(([key, value]) => {
      if (!['type', 'amount', 'asset', 'destination', 'fee'].includes(key) && value !== undefined) {
        details.push({ label: key.charAt(0).toUpperCase() + key.slice(1), value: String(value) });
      }
    });
    
    return details;
  };
  
  // Render transaction signer UI
  return (
    <Card className="w-full max-w-md mx-auto">
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <p className="text-muted-foreground mb-6">{description}</p>
        
        {/* Wallet Info */}
        <div className="mb-4 p-3 bg-muted rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Wallet</span>
            <span className="font-medium">
              {publicKey ? obfuscateSensitiveData(publicKey.toString(), 'wallet') : 'Not connected'}
            </span>
          </div>
        </div>
        
        {/* Transaction Details */}
        <div className="mb-6">
          <h3 className="text-md font-semibold mb-2">Transaction Details</h3>
          <div className="space-y-2">
            {getFormattedDetails().map((detail, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{detail.label}</span>
                <span className="font-medium">{detail.value}</span>
              </div>
            ))}
          </div>
          
          {/* Advanced Details Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-accent text-xs mt-3 flex items-center"
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced Details
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-3 w-3 ml-1 transition-transform ${showAdvanced ? 'transform rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {/* Advanced Details */}
          {showAdvanced && (
            <div className="mt-2 p-2 bg-muted rounded text-xs font-mono overflow-x-auto">
              <pre>{JSON.stringify(transaction, null, 2)}</pre>
            </div>
          )}
        </div>
        
        {/* Security Warnings */}
        {securityWarnings.length > 0 && (
          <div className="mb-6 p-3 border border-orange-300 bg-orange-50 dark:bg-orange-900/10 rounded">
            <h3 className="text-sm font-semibold text-orange-700 dark:text-orange-400 mb-2">Security Warnings</h3>
            <ul className="list-disc pl-5 text-sm text-orange-600 dark:text-orange-300 space-y-1">
              {securityWarnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Security Notice */}
        <div className="mb-6 text-xs text-muted-foreground p-3 border border-border rounded bg-muted">
          <p>
            Always verify transaction details before signing. This transaction will be signed with your 
            connected wallet and broadcast to the Solana network.
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex space-x-3">
          <Button
            variant="secondary"
            onClick={onCancel}
            className="flex-1"
            disabled={isSigningInProgress}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSign}
            className="flex-1"
            disabled={isSigningInProgress || !signTransaction}
          >
            {isSigningInProgress ? 'Signing...' : 'Sign Transaction'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
