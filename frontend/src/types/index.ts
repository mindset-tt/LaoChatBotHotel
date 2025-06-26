/**
 * Application Type Definitions
 * 
 * Centralized type definitions for the frontend application.
 * This file contains shared types used across multiple components.
 */

// User and Authentication Types
export interface User {
  id: string;
  username: string;
  email?: string;
  role: 'admin' | 'user' | 'guest';
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// API Response Types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

// Common Component Props
export interface LoadingProps {
  isLoading?: boolean;
  message?: string;
}

export interface ErrorProps {
  error?: Error | string;
  onRetry?: () => void;
}

// Form Types
export interface FormErrors {
  [key: string]: string | undefined;
}

export interface LoginFormData {
  username: string;
  password: string;
}

// Dashboard Types
export interface DashboardMetric {
  id: string;
  title: string;
  value: number | string;
  change?: number;
  icon?: React.ComponentType;
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'error';
  uptime: number;
  memory_usage: number;
  cpu_usage: number;
}

// Chat Types
export interface ChatMessage {
  id: string;
  content: string;
  timestamp: string;
  userId: string;
  sessionId: string;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  lastActivity: string;
  messageCount: number;
}

// Booking Types
export interface Booking {
  id: string;
  guestName: string;
  roomNumber: string;
  checkInDate: string;
  checkOutDate: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

// Room Types
export interface Room {
  id: string;
  number: string;
  type: string;
  status: 'available' | 'occupied' | 'maintenance';
  price: number;
}

// Navigation Types
export interface NavItem {
  label: string;
  path: string;
  icon?: React.ComponentType;
  requiredRole?: 'admin' | 'user';
}

// Utility Types
export type Status = 'idle' | 'loading' | 'success' | 'error';

export type Theme = 'light' | 'dark';

export type UserRole = 'admin' | 'user' | 'guest';
