/**
 * Authentication API Hooks
 * 
 * Custom hooks for authentication-related API calls
 * Separated from the main api.ts file for better organization
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import type { User, LoginFormData, ApiResponse } from '../types';

// API client for auth endpoints
const authApi = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/auth`,
  timeout: 10000,
});

// Login API call
const loginUser = async (credentials: LoginFormData): Promise<ApiResponse<{ token: string; user: User }>> => {
  const response = await authApi.post('/login', credentials);
  return response.data;
};

// Logout API call
const logoutUser = async (): Promise<ApiResponse> => {
  const response = await authApi.post('/logout');
  return response.data;
};

/**
 * Login mutation hook
 * Handles user login with automatic auth context update
 */
export const useLogin = () => {
  const { login } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      // Update auth context
      login(data.data.token, data.data.user);
      
      // Clear any cached queries that might need fresh data
      queryClient.invalidateQueries();
    },
    onError: (error) => {
      console.error('Login failed:', error);
    },
  });
};

/**
 * Logout mutation hook
 * Handles user logout with cleanup
 */
export const useLogout = () => {
  const { logout } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      // Update auth context
      logout();
      
      // Clear all cached data
      queryClient.clear();
    },
    onError: (error) => {
      console.error('Logout failed:', error);
      // Even if logout API fails, clear local state
      logout();
      queryClient.clear();
    },
  });
};
