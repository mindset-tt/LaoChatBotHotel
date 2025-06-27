/**
 * Authentication Configuration
 * Configure how tokens are stored and managed
 */

import { cookieTokenManager, localStorageTokenManager, hybridTokenManager } from './enhancedTokenManager';

// Storage method options
export type StorageMethod = 'localStorage' | 'cookies' | 'hybrid';

// Environment-based configuration
const getStorageMethod = (): StorageMethod => {
  // Check environment variable first
  const envMethod = process.env.REACT_APP_STORAGE_METHOD as StorageMethod;
  if (envMethod && ['localStorage', 'cookies', 'hybrid'].includes(envMethod)) {
    return envMethod;
  }

  // Default based on environment
  return process.env.NODE_ENV === 'production' ? 'cookies' : 'localStorage';
};

// Get the appropriate token manager based on configuration
export const getTokenManager = (method?: StorageMethod) => {
  const storageMethod = method || getStorageMethod();
  
  switch (storageMethod) {
    case 'cookies':
      return cookieTokenManager;
    case 'hybrid':
      return hybridTokenManager;
    case 'localStorage':
    default:
      return localStorageTokenManager;
  }
};

// Default token manager instance
export const tokenManager = getTokenManager();

// Configuration display for debugging
export const getAuthConfig = () => {
  const method = getStorageMethod();
  const config = tokenManager.getConfig();
  
  return {
    storageMethod: method,
    useLocalStorage: config.useLocalStorage,
    useCookies: config.useCookies,
    isProduction: process.env.NODE_ENV === 'production',
    isSecure: window.location.protocol === 'https:',
    cookieOptions: config.cookieOptions,
  };
};

// Helper to switch storage method at runtime (for testing)
export const switchStorageMethod = (method: StorageMethod) => {
  const newManager = getTokenManager(method);
  
  // Migrate existing tokens if possible
  const currentTokens = {
    accessToken: tokenManager.getAccessToken(),
    refreshToken: tokenManager.getRefreshToken(),
  };
  
  if (currentTokens.accessToken && currentTokens.refreshToken) {
    // Clear old storage
    tokenManager.clearTokens();
    
    // Store in new method
    newManager.storeTokens({
      accessToken: currentTokens.accessToken,
      refreshToken: currentTokens.refreshToken,
      expiresIn: 3600, // Default 1 hour
      tokenType: 'bearer',
    });
  }
  
  return newManager;
};

// Security recommendations based on environment
export const getSecurityRecommendations = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isSecure = window.location.protocol === 'https:';
  
  const recommendations: string[] = [];
  
  if (!isProduction) {
    recommendations.push('Consider using cookies for production deployment');
  }
  
  if (!isSecure && isProduction) {
    recommendations.push('Use HTTPS in production for secure cookies');
  }
  
  if (tokenManager.getConfig().useLocalStorage && isProduction) {
    recommendations.push('LocalStorage is less secure than httpOnly cookies');
  }
  
  return recommendations;
};
