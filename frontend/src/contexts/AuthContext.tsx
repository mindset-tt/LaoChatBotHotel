import React, { createContext, useContext, useEffect, useState } from 'react';
import { STORAGE_KEYS, USER_ROLES, ROLE_HIERARCHY } from '../constants';

/**
 * Authentication Context
 * 
 * Provides authentication state and methods throughout the application.
 * Handles user login/logout, permission checking, and persists auth state.
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
  login: (token: string, userData: User) => void;
  logout: () => void;
  hasPermission: (requiredRole: 'admin' | 'user') => boolean;
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
    const initializeAuth = () => {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const storedUserData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
      
      if (token && storedUserData) {
        try {
          const userData = JSON.parse(storedUserData);
          setUser(userData);
        } catch (error) {
          console.error('Error parsing stored user data:', error);
          // Clear corrupted data
          localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER_DATA);        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  /**
   * Login method - stores token and user data
   */
  const login = (token: string, userData: User) => {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
    setUser(userData);
  };

  /**
   * Logout method - clears all stored auth data
   */
  const logout = () => {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    localStorage.removeItem(STORAGE_KEYS.USERNAME);
    setUser(null);
  };

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
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
