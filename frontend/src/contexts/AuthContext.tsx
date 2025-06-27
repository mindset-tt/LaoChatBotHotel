import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { STORAGE_KEYS, USER_ROLES, ROLE_HIERARCHY, API_CONFIG } from '../constants';
import { tokenManager, TokenData } from '../utils/tokenManager';

/**
 * Authentication Context
 * 
 * Provides authentication state and methods throughout the application.
 * Handles user login/logout, permission checking, token refresh, and persists auth state.
 */

// Type definitions for better type safety
interface User {
  id: string;
  username: string;
  email?: string;
  role: 'admin' | 'user' | 'guest';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (loginResponse: LoginResponse) => void;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  getValidToken: () => Promise<string | null>;
  hasPermission: (requiredRole: 'admin' | 'user') => boolean;
}

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  username: string;
  user_id: string;
  role: string;
}

// Create context with undefined default to enforce provider usage
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Custom hook to use auth context
 * Throws error if used outside AuthProvider to prevent misuse
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Auth Provider Component
 * 
 * Manages authentication state and provides auth methods to children.
 * Automatically restores auth state from localStorage on app load.
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    /**
     * Initialize authentication state from localStorage
     * This runs once when the app loads
     */
    const initializeAuth = async () => {
      const storedUserData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
      
      if (storedUserData && tokenManager.hasRefreshToken()) {
        try {
          const userData = JSON.parse(storedUserData);
          
          // Check if we have a valid token or can refresh
          const validToken = await tokenManager.getValidAccessToken();
          if (validToken) {
            setUser(userData);
          } else {
            // Clear invalid data
            localStorage.removeItem(STORAGE_KEYS.USER_DATA);
            tokenManager.clearTokens();
          }
        } catch (error) {
          console.error('Error initializing auth:', error);
          // Clear corrupted data
          localStorage.removeItem(STORAGE_KEYS.USER_DATA);
          tokenManager.clearTokens();
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  /**
   * Login method - stores tokens and user data
   */
  const login = useCallback((loginResponse: LoginResponse) => {
    const tokenData: TokenData = {
      accessToken: loginResponse.access_token,
      refreshToken: loginResponse.refresh_token,
      expiresIn: loginResponse.expires_in,
      tokenType: loginResponse.token_type,
    };
    
    tokenManager.storeTokens(tokenData);
    
    const userData: User = {
      id: loginResponse.user_id,
      username: loginResponse.username,
      role: loginResponse.role as 'admin' | 'user' | 'guest',
    };
    
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
    setUser(userData);
  }, []);

  /**
   * Logout method - clears all stored auth data
   */
  const logout = useCallback(async () => {
    try {
      // Call logout endpoint to invalidate refresh token on server
      const refreshToken = tokenManager.getRefreshToken();
      if (refreshToken) {
        await fetch(`${API_CONFIG.BASE_URL}/auth/logout/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Clear local storage regardless of API call success
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
      localStorage.removeItem(STORAGE_KEYS.USERNAME);
      tokenManager.clearTokens();
      setUser(null);
    }
  }, []);

  /**
   * Refresh token method
   */
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      await tokenManager.refreshAccessToken();
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      return false;
    }
  }, [logout]);

  /**
   * Get valid token method - returns token or refreshes if needed
   */
  const getValidToken = useCallback(async (): Promise<string | null> => {
    try {
      return await tokenManager.getValidAccessToken();
    } catch (error) {
      console.error('Error getting valid token:', error);
      logout();
      return null;
    }
  }, [logout]);

  /**
   * Permission checker based on role hierarchy
   * @param requiredRole - Minimum role required
   * @returns boolean indicating if user has sufficient permissions
   */
  const hasPermission = (requiredRole: 'admin' | 'user'): boolean => {
    if (!user) return false;
    
    const roleHierarchy = { guest: 0, user: 1, admin: 2 };
    const userLevel = roleHierarchy[user.role];
    const requiredLevel = roleHierarchy[requiredRole];
    
    return userLevel >= requiredLevel;
  };

  // Computed authentication status
  const isAuthenticated = !!user;

  // Context value object
  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshToken,
    getValidToken,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
