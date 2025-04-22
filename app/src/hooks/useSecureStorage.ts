"use client";

import { useState, useEffect } from 'react';
import { encryptForStorage, decryptFromStorage } from '@/utils/securityUtils';

/**
 * A secure wrapper for localStorage that encrypts sensitive data
 * Uses a session-specific key for encryption to prevent data leaks
 * 
 * @param key Storage key
 * @param initialValue Initial value (optional)
 * @returns [value, setValue, removeValue] tuple
 */
export function useSecureStorage<T>(
  key: string,
  initialValue?: T
): [T | undefined, (value: T) => void, () => void] {
  // Generate a session-specific encryption key if needed
  const getEncryptionKey = (): string => {
    let encKey = sessionStorage.getItem('solana_dai_enc_key');
    if (!encKey) {
      // Generate a random encryption key for this session
      const randomBytes = new Uint8Array(32);
      crypto.getRandomValues(randomBytes);
      encKey = Array.from(randomBytes)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
      sessionStorage.setItem('solana_dai_enc_key', encKey);
    }
    return encKey;
  };

  // State to store our value
  const [storedValue, setStoredValue] = useState<T | undefined>(initialValue);
  
  // Load the value from localStorage on mount
  useEffect(() => {
    try {
      const encKey = getEncryptionKey();
      const item = localStorage.getItem(`secure_${key}`);
      
      if (item) {
        const decryptedValue = decryptFromStorage(item, encKey);
        setStoredValue(JSON.parse(decryptedValue));
      } else if (initialValue !== undefined) {
        // If no stored value exists but we have an initial value, store it
        const valueToStore = typeof initialValue === 'function' 
          ? (initialValue as () => T)() 
          : initialValue;
          
        const encryptedValue = encryptForStorage(
          JSON.stringify(valueToStore), 
          encKey
        );
        
        localStorage.setItem(`secure_${key}`, encryptedValue);
        setStoredValue(valueToStore);
      }
    } catch (error) {
      console.error('Error reading from secure storage:', error);
      // If there's an error, don't use potentially corrupted data
      localStorage.removeItem(`secure_${key}`);
    }
  }, [key, initialValue]);
  
  // Return a wrapped version of useState's setter function that persists the new value
  const setValue = (value: T) => {
    try {
      const encKey = getEncryptionKey();
      const valueToStore = typeof value === 'function' 
        ? (value as () => T)() 
        : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to localStorage with encryption
      const encryptedValue = encryptForStorage(
        JSON.stringify(valueToStore), 
        encKey
      );
      
      localStorage.setItem(`secure_${key}`, encryptedValue);
      
      // Set a timestamp for automatic expiration
      localStorage.setItem(`secure_${key}_timestamp`, Date.now().toString());
    } catch (error) {
      console.error('Error saving to secure storage:', error);
    }
  };
  
  // Remove the item from storage
  const removeValue = () => {
    try {
      localStorage.removeItem(`secure_${key}`);
      localStorage.removeItem(`secure_${key}_timestamp`);
      setStoredValue(undefined);
    } catch (error) {
      console.error('Error removing from secure storage:', error);
    }
  };
  
  return [storedValue, setValue, removeValue];
}

/**
 * Clear all expired secure storage items (older than maxAge)
 * @param maxAgeMs Maximum age in milliseconds (default: 24 hours)
 */
export function clearExpiredSecureItems(maxAgeMs = 24 * 60 * 60 * 1000): void {
  try {
    const now = Date.now();
    const keysToRemove: string[] = [];
    
    // Find all secure storage items with timestamps
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.endsWith('_timestamp')) {
        const baseKey = key.replace('_timestamp', '');
        const timestamp = parseInt(localStorage.getItem(key) || '0');
        
        // Check if item has expired
        if (now - timestamp > maxAgeMs) {
          keysToRemove.push(baseKey);
          keysToRemove.push(key);
        }
      }
    }
    
    // Remove expired items
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    console.info(`Cleared ${keysToRemove.length / 2} expired secure storage items`);
  } catch (error) {
    console.error('Error clearing expired secure items:', error);
  }
}
