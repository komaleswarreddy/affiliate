import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Helper functions and utility methods for the application
 */

// Check if the application is running in development mode
export const isDevelopment = process.env.NODE_ENV === 'development' || 
  (typeof window !== 'undefined' && window.location.hostname === 'localhost');

// Log messages to console in development mode only
export function logDebug(...args: any[]) {
  if (isDevelopment) {
    console.log('[Debug]', ...args);
  }
}

// Format a date to a human-readable string
export const formatDate = (date: Date | string): string => {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Format currency
export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

// Generate a random ID
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

// Truncate text with ellipsis
export const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

// Deep clone an object
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

// Debounce function for handling rapid events
export const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<F>): Promise<ReturnType<F>> => {
    if (timeout !== null) {
      clearTimeout(timeout);
    }

    return new Promise(resolve => {
      timeout = setTimeout(() => resolve(func(...args)), waitFor);
    });
  };
};

/**
 * Enable mock API mode in development
 * This is useful for testing without a backend or when the backend is having issues
 */
export function enableMockApiMode() {
  if (isDevelopment && typeof localStorage !== 'undefined') {
    localStorage.setItem('useMockApi', 'true');
    logDebug('Mock API mode enabled');
    
    // Reload the page to apply the changes
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }
}

/**
 * Disable mock API mode in development
 */
export function disableMockApiMode() {
  if (isDevelopment && typeof localStorage !== 'undefined') {
    localStorage.removeItem('useMockApi');
    logDebug('Mock API mode disabled');
    
    // Reload the page to apply the changes
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }
}

/**
 * Check if mock API mode is enabled
 */
export function isMockApiModeEnabled(): boolean {
  return isDevelopment && 
    typeof localStorage !== 'undefined' && 
    localStorage.getItem('useMockApi') === 'true';
}
