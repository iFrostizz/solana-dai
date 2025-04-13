"use client";

import React, { useState, useEffect } from 'react';
import { useSecurityMonitoring, ThreatLevel, SecurityEvent } from '@/services/security-monitoring.service';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from '@/components/ui/Button';

interface SecurityGuardProps {
  mode?: 'silent' | 'subtle' | 'prominent';
  onlyShowProblems?: boolean;
}

export default function SecurityGuard({ 
  mode = 'subtle',
  onlyShowProblems = false,
}: SecurityGuardProps) {
  const { securityStatus, securityEvents, resetSecurityStatus } = useSecurityMonitoring();
  const { connected, publicKey } = useWallet();
  const [expanded, setExpanded] = useState(false);
  
  // Determine security icon and color
  const getSecurityStatusIcon = () => {
    const { status, securityScore } = securityStatus;
    
    switch (status) {
      case 'alert':
        return {
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ),
          colorClass: 'text-red-500 bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800',
          label: 'Security Alert'
        };
      case 'warning':
        return {
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ),
          colorClass: 'text-amber-500 bg-amber-100 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
          label: 'Security Warning'
        };
      default:
        return {
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ),
          colorClass: 'text-green-500 bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800',
          label: 'Security Verified'
        };
    }
  };
  
  // Get threat level display
  const getThreatLevelDisplay = (threatLevel: ThreatLevel) => {
    switch (threatLevel) {
      case ThreatLevel.CRITICAL:
        return {
          label: 'Critical',
          colorClass: 'text-red-600 bg-red-100 dark:bg-red-900/20',
        };
      case ThreatLevel.HIGH:
        return {
          label: 'High',
          colorClass: 'text-orange-500 bg-orange-100 dark:bg-orange-900/20',
        };
      case ThreatLevel.MEDIUM:
        return {
          label: 'Medium',
          colorClass: 'text-amber-500 bg-amber-100 dark:bg-amber-900/20',
        };
      default:
        return {
          label: 'Low',
          colorClass: 'text-green-500 bg-green-100 dark:bg-green-900/20',
        };
    }
  };
  
  // Format date for display
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };
  
  // Show notification when security status changes
  useEffect(() => {
    if (securityStatus.status !== 'secure' && !expanded) {
      setExpanded(true);
      
      // Auto-hide after 10 seconds if not critical
      if (securityStatus.status === 'warning') {
        const timer = setTimeout(() => {
          setExpanded(false);
        }, 10000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [securityStatus.status]);
  
  // If user not connected and onlyShowProblems is true, don't show anything
  if (!connected && onlyShowProblems) {
    return null;
  }
  
  // For silent mode, only show if there's a problem
  if (mode === 'silent' && securityStatus.status === 'secure') {
    return null;
  }
  
  // For subtle mode with no problems and onlyShowProblems true, don't show
  if (mode === 'subtle' && securityStatus.status === 'secure' && onlyShowProblems) {
    return null;
  }
  
  const statusDisplay = getSecurityStatusIcon();
  
  // Render the component based on mode
  return (
    <div className="mb-4">
      {/* Main security status indicator */}
      <div 
        className={`border rounded-lg shadow-sm p-3 ${statusDisplay.colorClass} cursor-pointer transition-all duration-300`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {statusDisplay.icon}
            <span className="ml-2 font-medium">{statusDisplay.label}</span>
            {securityStatus.status !== 'secure' && (
              <span className="ml-2 text-sm">
                ({securityStatus.activeThreats.length} issue{securityStatus.activeThreats.length !== 1 ? 's' : ''})
              </span>
            )}
          </div>
          
          <div className="flex items-center">
            <div className="mr-2 text-sm">
              Score: {securityStatus.securityScore}/100
            </div>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-4 w-4 transition-transform ${expanded ? 'transform rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Expanded security details */}
      {expanded && (
        <div className="mt-2 border rounded-lg p-4 bg-card shadow-sm">
          <div className="mb-4 flex justify-between items-center">
            <h3 className="font-medium">Security Status</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={resetSecurityStatus}
              className="text-xs"
            >
              Reset Status
            </Button>
          </div>
          
          {/* Active threats */}
          {securityStatus.activeThreats.length > 0 ? (
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Active Security Issues:</h4>
              <ul className="space-y-2">
                {securityStatus.activeThreats.map((threat) => {
                  const threatDisplay = getThreatLevelDisplay(threat.threatLevel);
                  return (
                    <li 
                      key={threat.id} 
                      className="border rounded p-2 text-sm flex justify-between items-center"
                    >
                      <div>
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium mr-2 ${threatDisplay.colorClass}`}>
                          {threatDisplay.label}
                        </span>
                        {threat.message}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(threat.timestamp)}
                      </div>
                    </li>
                  );
                })}
              </ul>
              
              {securityStatus.status === 'alert' && (
                <div className="mt-3 p-3 border border-red-300 bg-red-50 dark:bg-red-900/10 rounded text-sm">
                  <p className="font-medium text-red-700 dark:text-red-400">
                    Security Alert: Critical issues detected!
                  </p>
                  <p className="mt-1 text-red-600 dark:text-red-300">
                    We recommend caution when performing transactions until these issues are resolved.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="py-3 text-center text-green-600 bg-green-50 dark:bg-green-900/10 rounded">
              No active security issues detected
            </div>
          )}
          
          {/* Recent security events */}
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Recent Security Activity:</h4>
            {securityEvents.length > 0 ? (
              <div className="max-h-40 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground">
                    <tr>
                      <th className="text-left pb-2">Time</th>
                      <th className="text-left pb-2">Event</th>
                      <th className="text-left pb-2">Threat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {securityEvents.slice(-5).reverse().map((event: SecurityEvent) => {
                      const threatDisplay = getThreatLevelDisplay(event.threatLevel);
                      return (
                        <tr key={event.id} className="border-t">
                          <td className="py-2 pr-2">{formatDate(event.timestamp)}</td>
                          <td className="py-2 pr-2">
                            {event.type.split('_').map(word => 
                              word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ')}
                          </td>
                          <td className="py-2">
                            <span className={`inline-block px-2 py-0.5 rounded text-xs ${threatDisplay.colorClass}`}>
                              {threatDisplay.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-3 text-center text-muted-foreground bg-muted rounded">
                No security events recorded
              </div>
            )}
          </div>
          
          {/* Security recommendations */}
          <div className="mt-4 p-3 border rounded bg-blue-50 dark:bg-blue-900/10 text-sm">
            <h4 className="font-medium text-blue-700 dark:text-blue-400 mb-1">Security Recommendations:</h4>
            <ul className="list-disc pl-5 space-y-1 text-blue-600 dark:text-blue-300">
              <li>Keep your wallet software updated</li>
              <li>Never share your private keys or seed phrase</li>
              <li>Verify transaction details before signing</li>
              <li>Maintain safe collateral ratios (at least 200%)</li>
              <li>Be cautious of phishing attempts</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
