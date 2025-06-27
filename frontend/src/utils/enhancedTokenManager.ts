/**
 * Enhanced Token Manager with Cookie Support
 * Supports both localStorage and secure cookie storage for tokens
 */

import { STORAGE_KEYS, API_CONFIG } from '../constants';
import { CookieManager } from './cookieManager';

export interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface StorageConfig {
  useLocalStorage: boolean;
  useCookies: boolean;
  cookieOptions?: {
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
    domain?: string;
  };
}

export class EnhancedTokenManager {
  private static instance: EnhancedTokenManager;
  private refreshPromise: Promise<TokenData> | null = null;
  private config: StorageConfig;

  private constructor(config: StorageConfig = { useLocalStorage: true, useCookies: false }) {
    this.config = config;
  }

  public static getInstance(config?: StorageConfig): EnhancedTokenManager {
    if (!EnhancedTokenManager.instance) {
      EnhancedTokenManager.instance = new EnhancedTokenManager(config);
    }
    return EnhancedTokenManager.instance;
  }

  /**
   * Store tokens using configured storage method
   */
  public storeTokens(tokens: TokenData): void {
    const expiryTime = Date.now() + (tokens.expiresIn * 1000);
    const refreshExpiryTime = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)); // 7 days

    if (this.config.useLocalStorage) {
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, tokens.accessToken);
      localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString());
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
    }

    if (this.config.useCookies) {
      const isProduction = window.location.protocol === 'https:';
      const cookieOptions = {
        secure: this.config.cookieOptions?.secure ?? isProduction,
        sameSite: this.config.cookieOptions?.sameSite ?? 'lax' as const,
        domain: this.config.cookieOptions?.domain,
      };

      // Store access token in cookie (shorter expiry)
      CookieManager.setCookie(STORAGE_KEYS.AUTH_TOKEN, tokens.accessToken, {
        expires: new Date(expiryTime),
        path: '/',
        ...cookieOptions,
      });

      // Store refresh token in more secure cookie (longer expiry)
      CookieManager.setCookie(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken, {
        expires: refreshExpiryTime,
        path: '/',
        secure: true, // Always secure for refresh tokens
        sameSite: 'strict', // Stricter for refresh tokens
        domain: cookieOptions.domain,
      });

      // Store expiry time
      CookieManager.setCookie(STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString(), {
        expires: refreshExpiryTime,
        path: '/',
        ...cookieOptions,
      });
    }
  }

  /**
   * Get stored access token
   */
  public getAccessToken(): string | null {
    if (this.config.useCookies) {
      const token = CookieManager.getCookie(STORAGE_KEYS.AUTH_TOKEN);
      if (token) return token;
    }
    
    if (this.config.useLocalStorage) {
      return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    }
    
    return null;
  }

  /**
   * Get stored refresh token
   */
  public getRefreshToken(): string | null {
    if (this.config.useCookies) {
      const token = CookieManager.getCookie(STORAGE_KEYS.REFRESH_TOKEN);
      if (token) return token;
    }
    
    if (this.config.useLocalStorage) {
      return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    }
    
    return null;
  }

  /**
   * Check if access token is expired
   */
  public isTokenExpired(): boolean {
    let expiryTime: string | null = null;
    
    if (this.config.useCookies) {
      expiryTime = CookieManager.getCookie(STORAGE_KEYS.TOKEN_EXPIRY);
    }
    
    if (!expiryTime && this.config.useLocalStorage) {
      expiryTime = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
    }

    if (!expiryTime) return true;
    
    const now = Date.now();
    const expiry = parseInt(expiryTime, 10);
    
    // Consider token expired 5 minutes before actual expiry
    return now >= (expiry - 5 * 60 * 1000);
  }

  /**
   * Check if refresh token exists
   */
  public hasRefreshToken(): boolean {
    return !!this.getRefreshToken();
  }

  /**
   * Clear all tokens
   */
  public clearTokens(): void {
    if (this.config.useLocalStorage) {
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
    }

    if (this.config.useCookies) {
      CookieManager.deleteCookie(STORAGE_KEYS.AUTH_TOKEN);
      CookieManager.deleteCookie(STORAGE_KEYS.REFRESH_TOKEN);
      CookieManager.deleteCookie(STORAGE_KEYS.TOKEN_EXPIRY);
    }

    this.refreshPromise = null;
  }

  /**
   * Refresh access token using refresh token
   */
  public async refreshAccessToken(): Promise<TokenData> {
    // If a refresh is already in progress, return that promise
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    this.refreshPromise = this.performTokenRefresh(refreshToken);
    
    try {
      const result = await this.refreshPromise;
      this.refreshPromise = null;
      return result;
    } catch (error) {
      this.refreshPromise = null;
      throw error;
    }
  }

  /**
   * Perform the actual token refresh API call
   */
  private async performTokenRefresh(refreshToken: string): Promise<TokenData> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: this.config.useCookies ? 'include' : 'omit', // Include cookies if using cookie storage
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      
      const tokenData: TokenData = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
        tokenType: data.token_type,
      };

      this.storeTokens(tokenData);
      return tokenData;
    } catch (error) {
      // Clear tokens on refresh failure
      this.clearTokens();
      throw error;
    }
  }

  /**
   * Get valid access token (refresh if needed)
   */
  public async getValidAccessToken(): Promise<string | null> {
    const accessToken = this.getAccessToken();
    
    if (!accessToken) {
      return null;
    }

    if (this.isTokenExpired()) {
      if (this.hasRefreshToken()) {
        try {
          const newTokens = await this.refreshAccessToken();
          return newTokens.accessToken;
        } catch (error) {
          console.error('Token refresh failed:', error);
          return null;
        }
      } else {
        return null;
      }
    }

    return accessToken;
  }

  /**
   * Get storage configuration
   */
  public getConfig(): StorageConfig {
    return { ...this.config };
  }

  /**
   * Update storage configuration
   */
  public updateConfig(newConfig: Partial<StorageConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Create different instances for different storage strategies

// Cookie-based storage (recommended for production)
export const cookieTokenManager = EnhancedTokenManager.getInstance({
  useLocalStorage: false,
  useCookies: true,
  cookieOptions: {
    secure: window.location.protocol === 'https:',
    sameSite: 'lax',
  }
});

// localStorage-based storage (for development/backward compatibility)
export const localStorageTokenManager = EnhancedTokenManager.getInstance({
  useLocalStorage: true,
  useCookies: false,
});

// Hybrid storage (cookies for refresh tokens, localStorage for access tokens)
export const hybridTokenManager = EnhancedTokenManager.getInstance({
  useLocalStorage: true,
  useCookies: true,
  cookieOptions: {
    secure: window.location.protocol === 'https:',
    sameSite: 'lax',
  }
});

// Default export (can be switched based on environment)
export const tokenManager = process.env.NODE_ENV === 'production' 
  ? cookieTokenManager 
  : localStorageTokenManager;
