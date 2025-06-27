# Refresh Token Implementation Guide

This guide explains how to implement and use refresh tokens in your React frontend application for secure authentication.

## Overview

Refresh tokens provide a secure way to maintain user sessions without requiring frequent re-authentication. The implementation includes:

- **Access Tokens**: Short-lived tokens (1 hour) for API authentication
- **Refresh Tokens**: Long-lived tokens (7 days) for obtaining new access tokens
- **Automatic Token Refresh**: Seamless token renewal without user intervention
- **Secure Storage**: Tokens stored in localStorage with expiry tracking

## Architecture

### Backend Components

1. **Enhanced Auth Routes** (`backend/routes/auth_routes.py`)
   - `/auth/login/` - Login with refresh token support
   - `/auth/refresh/` - Refresh access token
   - `/auth/logout/` - Invalidate refresh token

2. **Updated Schemas** (`backend/models/schemas.py`)
   - `LoginResponse` - Includes access_token, refresh_token, expires_in
   - `RefreshTokenRequest` - For token refresh requests
   - `RefreshTokenResponse` - New token response

3. **Auth Service** (`backend/services/auth.py`)
   - Token creation and validation functions
   - User authentication with enhanced user data

### Frontend Components

1. **Token Manager** (`frontend/src/utils/tokenManager.ts`)
   - Centralized token storage and management
   - Automatic expiry checking
   - Token refresh logic

2. **Enhanced Auth Context** (`frontend/src/contexts/AuthContext.tsx`)
   - Supports refresh token flow
   - Automatic token validation on app load
   - Graceful logout on refresh failure

3. **API Client** (`frontend/src/utils/apiClient.ts`)
   - Automatic token injection
   - Intelligent retry with token refresh
   - Request queuing during refresh

## Implementation Details

### Token Storage

Tokens are stored in localStorage with the following keys:
```typescript
{
  auth_token: string,        // Access token
  refresh_token: string,     // Refresh token
  token_expiry: string,      // Expiry timestamp
  user_data: string          // JSON user data
}
```

### Authentication Flow

1. **Login**:
   ```typescript
   const result = await loginMutation.mutateAsync({ username, password });
   login(result); // Stores tokens and user data
   ```

2. **API Requests**:
   ```typescript
   // Automatic token handling
   const response = await apiClient.get('/api/protected-endpoint');
   ```

3. **Token Refresh**:
   ```typescript
   // Manual refresh
   const success = await refreshToken();
   
   // Automatic refresh (happens behind the scenes)
   const token = await getValidToken();
   ```

4. **Logout**:
   ```typescript
   await logout(); // Clears tokens and calls logout endpoint
   ```

## Usage Examples

### Basic API Call
```typescript
import { apiClient } from '../utils/apiClient';

const fetchData = async () => {
  try {
    // Token refresh handled automatically
    const response = await apiClient.get('/api/dashboard/summary');
    return response.data;
  } catch (error) {
    console.error('API call failed:', error);
  }
};
```

### Manual Token Management
```typescript
import { useAuth } from '../contexts/AuthContext';

const MyComponent = () => {
  const { getValidToken, refreshToken } = useAuth();

  const handleApiCall = async () => {
    const token = await getValidToken(); // Auto-refreshes if needed
    if (token) {
      // Make authenticated request
    }
  };

  const handleManualRefresh = async () => {
    const success = await refreshToken();
    console.log('Refresh successful:', success);
  };
};
```

### Token Status Monitoring
```typescript
import { tokenManager } from '../utils/tokenManager';

const checkTokenStatus = () => {
  console.log({
    hasToken: !!tokenManager.getAccessToken(),
    hasRefreshToken: tokenManager.hasRefreshToken(),
    isExpired: tokenManager.isTokenExpired()
  });
};
```

## How to Use Refresh Tokens

This section provides practical examples of how to use the refresh token functionality in your application.

### Basic Usage Patterns

#### 1. Automatic Token Refresh (Recommended)

The easiest way is to use the `apiClient` which handles everything automatically:

```typescript
import { apiClient } from '../utils/apiClient';

// This automatically handles token refresh if needed
const fetchUserData = async () => {
  try {
    const response = await apiClient.get('/api/user/profile');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch user data:', error);
    throw error;
  }
};

// Works with all HTTP methods
const updateProfile = async (profileData) => {
  const response = await apiClient.put('/api/user/profile', profileData);
  return response.data;
};
```

#### 2. Using Auth Context Methods

```typescript
import { useAuth } from '../contexts/AuthContext';

const MyComponent = () => {
  const { getValidToken, refreshToken, logout } = useAuth();

  // Get a valid token (auto-refreshes if expired)
  const handleApiCall = async () => {
    try {
      const token = await getValidToken();
      if (!token) {
        console.log('No valid token, user needs to login');
        return;
      }

      // Use the token for custom API calls
      const response = await fetch('/api/custom-endpoint', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('API call successful:', data);
      }
    } catch (error) {
      console.error('API call failed:', error);
    }
  };

  // Manual token refresh
  const handleRefresh = async () => {
    try {
      const success = await refreshToken();
      if (success) {
        console.log('Token refreshed successfully');
      } else {
        console.log('Token refresh failed, user logged out');
      }
    } catch (error) {
      console.error('Refresh error:', error);
    }
  };

  return (
    <div>
      <button onClick={handleApiCall}>Make API Call</button>
      <button onClick={handleRefresh}>Refresh Token</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};
```

#### 3. Component with Automatic Refresh Monitoring

```typescript
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { tokenManager } from '../utils/tokenManager';

const Dashboard = () => {
  const { user, getValidToken, logout } = useAuth();
  const [tokenStatus, setTokenStatus] = useState({
    hasToken: false,
    isExpired: false,
    timeToExpiry: 0,
  });

  // Monitor token status
  useEffect(() => {
    if (!user) return;

    const checkTokenStatus = () => {
      const hasToken = !!tokenManager.getAccessToken();
      const isExpired = tokenManager.isTokenExpired();
      
      // Calculate time to expiry
      const expiryTime = localStorage.getItem('token_expiry');
      const timeToExpiry = expiryTime ? 
        Math.max(0, parseInt(expiryTime) - Date.now()) : 0;

      setTokenStatus({ hasToken, isExpired, timeToExpiry });
    };

    // Check immediately
    checkTokenStatus();

    // Check every 30 seconds
    const interval = setInterval(checkTokenStatus, 30000);

    return () => clearInterval(interval);
  }, [user]);

  // Auto-refresh when token is about to expire (5 minutes before)
  useEffect(() => {
    if (!user || tokenStatus.timeToExpiry <= 0) return;

    const fiveMinutes = 5 * 60 * 1000;
    if (tokenStatus.timeToExpiry <= fiveMinutes) {
      console.log('Token expiring soon, refreshing...');
      getValidToken(); // This will trigger refresh if needed
    }
  }, [tokenStatus.timeToExpiry, user, getValidToken]);

  if (!user) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {user.username}!</p>
      
      <div style={{ marginTop: '20px', padding: '10px', background: '#f5f5f5' }}>
        <h3>Token Status</h3>
        <p>Has Token: {tokenStatus.hasToken ? '✅' : '❌'}</p>
        <p>Is Expired: {tokenStatus.isExpired ? '❌' : '✅'}</p>
        <p>Time to Expiry: {Math.floor(tokenStatus.timeToExpiry / 1000 / 60)} minutes</p>
      </div>
    </div>
  );
};
```

### Advanced Usage Patterns

#### 4. Custom Hook for API Calls with Refresh

```typescript
import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../utils/apiClient';

export const useApiCall = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { logout } = useAuth();

  const makeApiCall = useCallback(async (config) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient(config);
      return response.data;
    } catch (err) {
      setError(err.message);
      
      // If it's a 401 that wasn't handled by interceptor, logout
      if (err.response?.status === 401) {
        logout();
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [logout]);

  return { makeApiCall, loading, error };
};

// Usage in component
const MyComponent = () => {
  const { makeApiCall, loading, error } = useApiCall();

  const fetchData = async () => {
    try {
      const data = await makeApiCall({
        method: 'GET',
        url: '/api/data'
      });
      console.log('Data:', data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  return (
    <div>
      <button onClick={fetchData} disabled={loading}>
        {loading ? 'Loading...' : 'Fetch Data'}
      </button>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
    </div>
  );
};
```

#### 5. Background Token Refresh Service

```typescript
// utils/tokenRefreshService.ts
import { tokenManager } from './tokenManager';

export class TokenRefreshService {
  private static instance: TokenRefreshService;
  private refreshInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  private constructor() {}

  public static getInstance(): TokenRefreshService {
    if (!TokenRefreshService.instance) {
      TokenRefreshService.instance = new TokenRefreshService();
    }
    return TokenRefreshService.instance;
  }

  public start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log('Token refresh service started');

    // Check every minute
    this.refreshInterval = setInterval(() => {
      this.checkAndRefresh();
    }, 60000);

    // Check immediately
    this.checkAndRefresh();
  }

  public stop(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    this.isRunning = false;
    console.log('Token refresh service stopped');
  }

  private async checkAndRefresh(): Promise<void> {
    try {
      const hasToken = !!tokenManager.getAccessToken();
      const hasRefreshToken = tokenManager.hasRefreshToken();
      
      if (!hasToken || !hasRefreshToken) return;

      // Get expiry time
      const expiryTime = localStorage.getItem('token_expiry');
      if (!expiryTime) return;

      const timeToExpiry = parseInt(expiryTime) - Date.now();
      const fiveMinutes = 5 * 60 * 1000;

      // Refresh if expiring in next 5 minutes
      if (timeToExpiry <= fiveMinutes && timeToExpiry > 0) {
        console.log('Auto-refreshing token...');
        await tokenManager.refreshAccessToken();
        console.log('Token auto-refreshed successfully');
      }
    } catch (error) {
      console.error('Auto-refresh failed:', error);
    }
  }
}

// Start the service when app loads
export const tokenRefreshService = TokenRefreshService.getInstance();
```

#### 6. Using with React Query

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../utils/apiClient';
import { useAuth } from '../contexts/AuthContext';

// Custom hook for authenticated queries
export const useAuthenticatedQuery = (key, queryFn, options = {}) => {
  const { logout } = useAuth();

  return useQuery({
    queryKey: key,
    queryFn: async () => {
      try {
        return await queryFn();
      } catch (error) {
        if (error.response?.status === 401) {
          logout();
        }
        throw error;
      }
    },
    ...options,
  });
};

// Usage in component
const ProfileComponent = () => {
  const { data: profile, isLoading, error } = useAuthenticatedQuery(
    ['profile'],
    () => apiClient.get('/api/user/profile').then(res => res.data)
  );

  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (profileData) => 
      apiClient.put('/api/user/profile', profileData).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries(['profile']);
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>Profile</h2>
      <p>Name: {profile?.name}</p>
      <button 
        onClick={() => updateMutation.mutate({ name: 'New Name' })}
        disabled={updateMutation.isLoading}
      >
        {updateMutation.isLoading ? 'Updating...' : 'Update Profile'}
      </button>
    </div>
  );
};
```

### Real-World Implementation Examples

#### 7. Complete Login Flow with Refresh

```typescript
// pages/Login.tsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLogin } from '../hooks/api';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const { login } = useAuth();
  const loginMutation = useLogin();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    try {
      // This returns the full login response with access_token, refresh_token, etc.
      const result = await loginMutation.mutateAsync(credentials);
      
      // Pass the entire result to login - it handles token storage
      login(result);
      
      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="text"
        placeholder="Username"
        value={credentials.username}
        onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))
        }
      />
      <input
        type="password"
        placeholder="Password"
        value={credentials.password}
        onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))
        }
      />
      <button type="submit" disabled={loginMutation.isLoading}>
        {loginMutation.isLoading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
};
```

#### 8. Protected Route with Auto-Refresh

```typescript
// components/ProtectedRoute.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const { user, isLoading, getValidToken } = useAuth();
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    const validateToken = async () => {
      if (isLoading) return;
      
      try {
        // This will refresh the token if needed
        const token = await getValidToken();
        if (!token) {
          console.log('No valid token available');
        }
      } catch (error) {
        console.error('Token validation failed:', error);
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [isLoading, getValidToken]);

  if (isLoading || isValidating) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Usage in router
import { Routes, Route } from 'react-router-dom';

const App = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route 
      path="/dashboard" 
      element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } 
    />
  </Routes>
);
```

### Error Handling Best Practices

#### 9. Comprehensive Error Handling

```typescript
// utils/errorHandler.ts
import { tokenManager } from './tokenManager';

export const handleApiError = async (error, logout) => {
  if (error.response?.status === 401) {
    // Try to refresh token
    try {
      if (tokenManager.hasRefreshToken()) {
        await tokenManager.refreshAccessToken();
        return 'TOKEN_REFRESHED';
      }
    } catch (refreshError) {
      console.error('Token refresh failed:', refreshError);
    }
    
    // If refresh fails or no refresh token, logout
    logout();
    return 'LOGOUT_REQUIRED';
  }
  
  return 'OTHER_ERROR';
};

// Usage in component
const DataComponent = () => {
  const { logout } = useAuth();

  const fetchData = async () => {
    try {
      const response = await apiClient.get('/api/data');
      return response.data;
    } catch (error) {
      const errorType = await handleApiError(error, logout);
      
      switch (errorType) {
        case 'TOKEN_REFRESHED':
          // Retry the request
          return fetchData();
        case 'LOGOUT_REQUIRED':
          // User will be redirected to login
          break;
        case 'OTHER_ERROR':
          // Handle other errors
          throw error;
      }
    }
  };
};
```

### Key Points to Remember

1. **Use `apiClient` for most cases** - it handles token refresh automatically
2. **Use `getValidToken()` for custom API calls** - it ensures you have a valid token
3. **Monitor token expiry** for proactive refresh
4. **Handle refresh failures gracefully** by logging out the user
5. **Test with expired tokens** to ensure your error handling works
6. **Use background refresh service** for long-running applications

The refresh token system is designed to work seamlessly in the background, so in most cases, you'll just use the `apiClient` and everything will work automatically!

## Security Considerations

### Current Implementation
- Tokens stored in localStorage
- 1-hour access token expiry
- 7-day refresh token expiry
- Automatic token cleanup on logout

### Production Recommendations
1. **Use httpOnly Cookies**: Store refresh tokens in httpOnly cookies
2. **CSRF Protection**: Implement CSRF tokens for cookie-based auth
3. **Token Rotation**: Rotate refresh tokens on each use
4. **Rate Limiting**: Implement refresh attempt rate limiting
5. **Secure Transport**: Always use HTTPS
6. **Token Blacklisting**: Maintain server-side token blacklist

## Migration from Simple Tokens

To migrate from the previous simple token implementation:

1. **Update Login Calls**:
   ```typescript
   // Old way
   login(result.access_token, userData);
   
   // New way
   login(result); // Pass entire login response
   ```

2. **Update API Calls**:
   ```typescript
   // Old way
   const token = localStorage.getItem('auth_token');
   const response = await fetch('/api/endpoint', {
     headers: { Authorization: `Bearer ${token}` }
   });
   
   // New way
   const response = await apiClient.get('/api/endpoint');
   ```

3. **Update Protected Routes**:
   The `useAuth` hook automatically handles token validation, no changes needed.

## Configuration

Update your constants to include the new storage keys:

```typescript
// constants/appConfig.ts
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  TOKEN_EXPIRY: 'token_expiry',
  USER_DATA: 'user_data',
  // ... other keys
} as const;
```

## Testing

### Mock Data Support
The implementation maintains compatibility with mock data:

```typescript
// Mock login responses include refresh tokens
{
  access_token: 'mock_access_token',
  refresh_token: 'mock_refresh_token',
  token_type: 'bearer',
  expires_in: 3600,
  username: 'testuser',
  user_id: '1',
  role: 'admin'
}
```

### Development Tools
Use the `RefreshToken` component to test functionality:

```typescript
import RefreshToken from './components/RefreshToken';

// Add to your router or test page
<RefreshToken />
```

## Troubleshooting

### Common Issues

1. **Tokens Not Refreshing**:
   - Check network connectivity
   - Verify refresh token validity
   - Check backend refresh endpoint

2. **Infinite Refresh Loop**:
   - Ensure proper error handling in interceptors
   - Check token expiry calculation

3. **User Logged Out Unexpectedly**:
   - Check refresh token expiry
   - Verify backend token validation

### Debug Information

Enable debug logging:
```typescript
// Add to tokenManager for debugging
console.log('Token refresh attempt:', { 
  hasRefreshToken: this.hasRefreshToken(),
  isExpired: this.isTokenExpired() 
});
```

## Best Practices

1. **Always use the API client** for authenticated requests
2. **Monitor token expiry** and refresh proactively
3. **Handle refresh failures** gracefully
4. **Clear tokens on logout** to prevent security issues
5. **Use HTTPS** in production
6. **Implement proper error boundaries** for auth failures

## Files Modified

### Backend
- `routes/auth_routes.py` - Enhanced with refresh endpoints
- `models/schemas.py` - Added refresh token schemas
- `services/auth.py` - Added token management functions

### Frontend
- `contexts/AuthContext.tsx` - Enhanced with refresh logic
- `utils/tokenManager.ts` - New token management utility
- `utils/apiClient.ts` - New API client with auto-refresh
- `constants/appConfig.ts` - Added token storage keys
- `hooks/api.ts` - Updated login hook
- `pages/login/LoginModern.tsx` - Updated to use new flow

This implementation provides a robust, secure, and user-friendly authentication system with automatic token refresh capabilities.

## Cookie-Based Storage (Recommended for Production)

For enhanced security, you can use cookies instead of localStorage, especially for refresh tokens. Here's how to implement cookie-based storage:

### Cookie Storage Utility

Create a cookie management utility:

```typescript
// frontend/src/utils/cookieManager.ts
export interface CookieOptions {
  expires?: Date;
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  httpOnly?: boolean; // Note: httpOnly cookies can only be set by server
}

export class CookieManager {
  /**
   * Set a cookie
   */
  static setCookie(name: string, value: string, options: CookieOptions = {}): void {
    let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

    if (options.expires) {
      cookieString += `; expires=${options.expires.toUTCString()}`;
    }

    if (options.path) {
      cookieString += `; path=${options.path}`;
    }

    if (options.domain) {
      cookieString += `; domain=${options.domain}`;
    }

    if (options.secure) {
      cookieString += `; secure`;
    }

    if (options.sameSite) {
      cookieString += `; samesite=${options.sameSite}`;
    }

    document.cookie = cookieString;
  }

  /**
   * Get a cookie value
   */
  static getCookie(name: string): string | null {
    const nameEQ = `${encodeURIComponent(name)}=`;
    const cookies = document.cookie.split(';');

    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.indexOf(nameEQ) === 0) {
        return decodeURIComponent(cookie.substring(nameEQ.length));
      }
    }

    return null;
  }

  /**
   * Delete a cookie
   */
  static deleteCookie(name: string, path: string = '/', domain?: string): void {
    const options: CookieOptions = {
      expires: new Date(0),
      path,
    };

    if (domain) {
      options.domain = domain;
    }

    this.setCookie(name, '', options);
  }

  /**
   * Check if a cookie exists
   */
  static hasCookie(name: string): boolean {
    return this.getCookie(name) !== null;
  }
}
```

### Enhanced Token Manager with Cookie Support

Update the token manager to support both localStorage and cookies:

```typescript
// frontend/src/utils/tokenManager.ts (Enhanced Version)
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

export class TokenManager {
  private static instance: TokenManager;
  private refreshPromise: Promise<TokenData> | null = null;
  private config: StorageConfig;

  private constructor(config: StorageConfig = { useLocalStorage: true, useCookies: false }) {
    this.config = config;
  }

  public static getInstance(config?: StorageConfig): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager(config);
    }
    return TokenManager.instance;
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
    }

    if (this.config.useCookies) {
      const cookieOptions = {
        path: '/',
        secure: this.config.cookieOptions?.secure ?? window.location.protocol === 'https:',
        sameSite: this.config.cookieOptions?.sameSite ?? 'lax' as const,
        domain: this.config.cookieOptions?.domain,
      };

      // Store access token in cookie (shorter expiry)
      CookieManager.setCookie(STORAGE_KEYS.AUTH_TOKEN, tokens.accessToken, {
        ...cookieOptions,
        expires: new Date(expiryTime),
      });

      // Store refresh token in more secure cookie (longer expiry)
      CookieManager.setCookie(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken, {
        ...cookieOptions,
        expires: refreshExpiryTime,
        secure: true, // Always secure for refresh tokens
        sameSite: 'strict', // Stricter for refresh tokens
      });

      // Store expiry time
      CookieManager.setCookie(STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString(), {
        ...cookieOptions,
        expires: refreshExpiryTime,
      });
    } else if (this.config.useLocalStorage) {
      // Fallback to localStorage for refresh token if cookies not used
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
    }
  }

  /**
   * Get stored access token
   */
  public getAccessToken(): string | null {
    if (this.config.useCookies) {
      return CookieManager.getCookie(STORAGE_KEYS.AUTH_TOKEN);
    }
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  /**
   * Get stored refresh token
   */
  public getRefreshToken(): string | null {
    if (this.config.useCookies) {
      return CookieManager.getCookie(STORAGE_KEYS.REFRESH_TOKEN);
    }
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  /**
   * Check if access token is expired
   */
  public isTokenExpired(): boolean {
    let expiryTime: string | null;
    
    if (this.config.useCookies) {
      expiryTime = CookieManager.getCookie(STORAGE_KEYS.TOKEN_EXPIRY);
    } else {
      expiryTime = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
    }

    if (!expiryTime) return true;
    
    const now = Date.now();
    const expiry = parseInt(expiryTime, 10);
    
    // Consider token expired 5 minutes before actual expiry
    return now >= (expiry - 5 * 60 * 1000);
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

  // ... rest of the methods remain the same
  public hasRefreshToken(): boolean {
    return !!this.getRefreshToken();
  }

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
      this.clearTokens();
      throw error;
    }
  }

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

// Configure for cookie-based storage
export const tokenManager = TokenManager.getInstance({
  useLocalStorage: false,  // Set to false for cookie-only mode
  useCookies: true,
  cookieOptions: {
    secure: true,     // Use secure cookies in production
    sameSite: 'lax',  // Adjust based on your needs
    // domain: '.yourdomain.com'  // Set domain for subdomain sharing
  }
});

// For development with localStorage (backward compatibility)
export const tokenManagerLocalStorage = TokenManager.getInstance({
  useLocalStorage: true,
  useCookies: false,
});
```

### Backend Support for Cookie-Based Refresh

Update your backend to handle cookies properly:

```python
# backend/routes/auth_routes.py (Enhanced for cookies)
from fastapi import APIRouter, HTTPException, Depends, Response, Request

@router.post("/login/", response_model=LoginResponse)
async def login(login_request: LoginRequest, response: Response):
    """User login endpoint with cookie support"""
    user = authenticate_user(login_request.username, login_request.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # Generate access and refresh tokens
    access_token = secrets.token_urlsafe(32)
    refresh_token = secrets.token_urlsafe(32)
    
    # Store refresh token with expiration (7 days)
    expires_at = datetime.utcnow() + timedelta(days=7)
    refresh_tokens_store[refresh_token] = {
        "user_id": user["user_id"],
        "username": user["username"],
        "role": user["role"],
        "expires_at": expires_at
    }
    
    # Set refresh token as httpOnly cookie (most secure)
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        max_age=7 * 24 * 60 * 60,  # 7 days
        httponly=True,             # Cannot be accessed by JavaScript
        secure=True,               # Only over HTTPS
        samesite="lax"            # CSRF protection
    )
    
    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,  # Also return in response for client-side storage
        token_type="bearer",
        expires_in=3600,
        username=user["username"],
        user_id=user["user_id"],
        role=user["role"]
    )

@router.post("/refresh/", response_model=RefreshTokenResponse)
async def refresh_token_endpoint(request: Request, refresh_request: RefreshTokenRequest = None):
    """Refresh access token using refresh token from cookie or body"""
    
    # Try to get refresh token from httpOnly cookie first (most secure)
    refresh_token = request.cookies.get("refresh_token")
    
    # Fallback to request body for backward compatibility
    if not refresh_token and refresh_request:
        refresh_token = refresh_request.refresh_token
    
    if not refresh_token:
        raise HTTPException(status_code=401, detail="No refresh token provided")
    
    # ... rest of refresh logic remains the same
    
@router.post("/logout/")
async def logout(request: Request, response: Response, refresh_request: RefreshTokenRequest = None):
    """Logout endpoint to invalidate refresh token"""
    
    # Get refresh token from cookie or body
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token and refresh_request:
        refresh_token = refresh_request.refresh_token
    
    if refresh_token and refresh_token in refresh_tokens_store:
        del refresh_tokens_store[refresh_token]
    
    # Clear the httpOnly cookie
    response.delete_cookie(
        key="refresh_token",
        httponly=True,
        secure=True,
        samesite="lax"
    )
    
    return {"message": "Successfully logged out"}
```

### Security Benefits of Cookie-Based Storage

#### Advantages:

1. **HttpOnly Cookies**: Cannot be accessed by JavaScript, preventing XSS attacks
2. **Secure Flag**: Only transmitted over HTTPS
3. **SameSite Protection**: Helps prevent CSRF attacks
4. **Automatic Handling**: Browser automatically includes cookies in requests
5. **Domain Control**: Can be shared across subdomains

#### Configuration Options:

```typescript
// Different cookie configurations for different security levels

// Maximum Security (Production)
const maxSecurityConfig = {
  useLocalStorage: false,
  useCookies: true,
  cookieOptions: {
    secure: true,      // HTTPS only
    sameSite: 'strict', // Strict CSRF protection
    domain: '.yourdomain.com' // Domain-specific
  }
};

// Balanced Security (Most common)
const balancedSecurityConfig = {
  useLocalStorage: false,
  useCookies: true,
  cookieOptions: {
    secure: true,
    sameSite: 'lax',   // Some cross-site flexibility
  }
};

// Development Mode
const developmentConfig = {
  useLocalStorage: true,  // Easier debugging
  useCookies: false,
};
```

### Migration from localStorage to Cookies

To migrate from localStorage to cookies:

1. **Update Token Manager Configuration**:
   ```typescript
   // Change from localStorage to cookies
   export const tokenManager = TokenManager.getInstance({
     useLocalStorage: false,
     useCookies: true,
     cookieOptions: {
       secure: true,
       sameSite: 'lax'
     }
   });
   ```

2. **Update Backend to Set Cookies**:
   - Add cookie setting in login endpoint
   - Read refresh tokens from cookies in refresh endpoint
   - Clear cookies in logout endpoint

3. **Handle CORS for Cookies**:
   ```python
   # backend/main.py
   from fastapi.middleware.cors import CORSMiddleware
   
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["http://localhost:3000"],  # Your frontend URL
       allow_credentials=True,  # Required for cookies
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

4. **Update Frontend Fetch Configuration**:
   ```typescript
   // Include credentials in requests
   fetch('/api/endpoint', {
     credentials: 'include'  // Include cookies
   });
   ```

### Quick Start: Cookie Implementation

To quickly switch to cookie-based storage, follow these steps:

#### 1. Environment Configuration

Add to your `.env` file:
```bash
# Use cookies for token storage
REACT_APP_STORAGE_METHOD=cookies

# Or use hybrid approach (cookies for refresh, localStorage for access)
REACT_APP_STORAGE_METHOD=hybrid
```

#### 2. Update Your Token Manager Import

Replace your existing token manager import:

```typescript
// Before
import { tokenManager } from '../utils/tokenManager';

// After (automatic based on environment)
import { tokenManager } from '../utils/authConfig';

// Or explicitly choose
import { cookieTokenManager as tokenManager } from '../utils/enhancedTokenManager';
```

#### 3. Backend CORS Configuration

Update your backend to support cookies:

```python
# backend/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Your frontend URL
    allow_credentials=True,  # Required for cookies
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### 4. Frontend Fetch Configuration

For any custom fetch calls, include credentials:

```typescript
// Custom API calls
fetch('/api/endpoint', {
  credentials: 'include',  // Include cookies
  headers: {
    'Content-Type': 'application/json',
  },
});
```

#### 5. Verify Configuration

Use the auth config helper to verify your setup:

```typescript
import { getAuthConfig, getSecurityRecommendations } from '../utils/authConfig';

console.log('Auth Config:', getAuthConfig());
console.log('Security Recommendations:', getSecurityRecommendations());
```

That's it! Your application will now use secure cookie-based token storage.

This cookie-based approach provides significantly better security than localStorage, especially for refresh tokens, while maintaining the same ease of use.
