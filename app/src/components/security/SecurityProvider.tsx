"use client";

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { clearExpiredSecureItems } from '@/hooks/useSecureStorage';

// This component provides security context and initializes security features
export default function SecurityProvider({ children }: { children: ReactNode }) {
  // Initialize security features
  useEffect(() => {
    // Clear expired secure items on load
    clearExpiredSecureItems();
    
    // Set up regular security checks
    const securityInterval = setInterval(() => {
      // Clear expired secure items periodically
      clearExpiredSecureItems();
      
      // Check for any browser tampering or suspicious extensions
      detectBrowserTampering();
      
    }, 5 * 60 * 1000); // Every 5 minutes
    
    return () => clearInterval(securityInterval);
  }, []);
  
  // Detect browser tampering or suspicious extensions
  const detectBrowserTampering = () => {
    if (typeof window === 'undefined') return;
    
    try {
      // Check if debugger is open
      const devtoolsOpen = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor)
        ? (window as any).Firebug && (window as any).Firebug.chrome && (window as any).Firebug.chrome.isInitialized
        : false;
      
      if (devtoolsOpen) {
        console.warn('Security notice: Developer tools are open. Be cautious about entering sensitive information.');
      }
      
      // Check for inconsistencies in browser environment
      if (typeof navigator.plugins !== 'undefined' && navigator.plugins.length === 0 && 
          navigator.userAgent.indexOf('Chrome') !== -1) {
        console.warn('Security notice: Potential browser tampering detected.');
      }
    } catch (error) {
      // Silent fail to avoid disrupting user experience
      console.error('Error in security check:', error);
    }
  };
  
  // Apply content security measures in-client (in addition to HTTP headers)
  useEffect(() => {
    if (typeof document !== 'undefined') {
      // Monitor for suspicious DOM modifications
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              // Check for suspicious script or iframe additions
              if (node.nodeName === 'SCRIPT' || node.nodeName === 'IFRAME') {
                const element = node as HTMLElement;
                const src = element.getAttribute('src');
                
                // Validate source against allowed domains if exists
                if (src && !isAllowedDomain(src)) {
                  console.warn('Security notice: Blocked suspicious resource:', src);
                  element.remove(); // Remove suspicious element
                }
              }
            });
          }
        });
      });
      
      // Start observing the document
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true
      });
      
      return () => observer.disconnect();
    }
  }, []);
  
  // Check if domain is allowed
  const isAllowedDomain = (url: string): boolean => {
    try {
      const domain = new URL(url).hostname;
      const allowedDomains = [
        'solana.com',
        'solanabeach.io',
        'solscan.io',
        'solanafm.com',
        'explorer.solana.com',
        'localhost',
        'solana-dai.com'
      ];
      
      return allowedDomains.some(allowed => domain.endsWith(allowed));
    } catch {
      return false;
    }
  };
  
  return <>{children}</>;
}
