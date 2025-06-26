/**
 * Application Configuration Constants
 * Centralized configuration for the frontend application
 */

// API Configuration
export const API_CONFIG = {
  BASE_URL: 'http://localhost:8000',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 2,
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  USERNAME: 'username',
  THEME_PREFERENCE: 'theme_preference',
} as const;

// React Query Configuration
export const QUERY_CONFIG = {
  STALE_TIME: 30000, // 30 seconds
  RETRY_ATTEMPTS: 2,
  REFETCH_ON_WINDOW_FOCUS: false,
  REFETCH_ON_RECONNECT: true,
} as const;

// Application Routes
export const ROUTES = {
  // Public routes
  LOGIN: '/login',
  
  // Main routes
  HOME: '/',
  CHATS: '/chats',
  CHAT_DETAIL: '/chats/:id',
  
  // Protected routes
  DASHBOARD: '/dashboard',
  ROOMS: '/rooms',
  BOOKINGS: '/bookings',
  ANALYTICS: '/analytics',
  SYSTEM: '/system',
  CHAT_DETAILS: '/chat-details/:id',
} as const;

// User Roles and Permissions
export const USER_ROLES = {
  GUEST: 'guest',
  USER: 'user',
  ADMIN: 'admin',
} as const;

export const ROLE_HIERARCHY = {
  [USER_ROLES.GUEST]: 0,
  [USER_ROLES.USER]: 1,
  [USER_ROLES.ADMIN]: 2,
} as const;

// UI Configuration
export const UI_CONFIG = {
  PAGE_LOADER_MIN_HEIGHT: '400px',
  APP_LOADER_MIN_HEIGHT: '100vh',
  DRAWER_WIDTH: 240,
  HEADER_HEIGHT: 64,
} as const;

// Feature Flags
export const FEATURES = {
  MOCK_DATA_ENABLED: import.meta.env.VITE_MOCK_DATA_ENABLED === 'true' || import.meta.env.DEV,
  REACT_QUERY_DEVTOOLS: true,
  DARK_MODE_ENABLED: true,
} as const;
