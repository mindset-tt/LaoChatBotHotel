/**
 * Token Management Utility
 * Handles token storage, refresh, and validation
 */

import { STORAGE_KEYS, API_CONFIG } from '../constants';

export interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export class TokenManager {
  private static instance: TokenManager;
  private refreshPromise: Promise<TokenData> | null = null;

  private constructor() {}

  public static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  /**
   * Store tokens in localStorage
   */
  public storeTokens(tokens: TokenData): void {
    const expiryTime = Date.now() + (tokens.expiresIn * 1000);
    
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, tokens.accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
    localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString());
  }

  /**
   * Get stored access token
   */
  public getAccessToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  /**
   * Get stored refresh token
   */
  public getRefreshToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  /**
   * Check if access token is expired
   */
  public isTokenExpired(): boolean {
    const expiryTime = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
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
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
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
}

export const tokenManager = TokenManager.getInstance();
