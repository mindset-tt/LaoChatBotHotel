/**
 * Refresh Token Example Component
 * 
 * Demonstrates how to use the refresh token functionality
 * in your React application for secure authentication.
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../utils/apiClient';
import { tokenManager } from '../utils/tokenManager';

export const RefreshToken: React.FC = () => {
  const { user, getValidToken, refreshToken, logout } = useAuth();
  const [tokenStatus, setTokenStatus] = useState({
    hasToken: false,
    hasRefreshToken: false,
    isExpired: false,
    timeToExpiry: 0,
  });
  const [apiResult, setApiResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Monitor token status
  useEffect(() => {
    const updateTokenStatus = () => {
      const hasToken = !!tokenManager.getAccessToken();
      const hasRefreshToken = tokenManager.hasRefreshToken();
      const isExpired = tokenManager.isTokenExpired();
      
      // Calculate time to expiry
      const expiryTime = localStorage.getItem('token_expiry');
      const timeToExpiry = expiryTime ? 
        Math.max(0, parseInt(expiryTime) - Date.now()) : 0;

      setTokenStatus({ hasToken, hasRefreshToken, isExpired, timeToExpiry });
    };

    // Update immediately
    updateTokenStatus();

    // Update every 5 seconds
    const interval = setInterval(updateTokenStatus, 5000);

    return () => clearInterval(interval);
  }, [user]);

  /**
   * Example 1: Using the auth context's getValidToken method
   * This automatically handles token refresh if needed
   */
  const makeAuthenticatedRequest = async () => {
    setLoading(true);
    setApiResult('');
    
    try {
      // This will automatically refresh the token if expired
      const token = await getValidToken();
      
      if (!token) {
        setApiResult('❌ No valid token available, user needs to login');
        return;
      }

      // Make your API request with the valid token
      const response = await apiClient.get('/api/dashboard/summary');
      setApiResult('✅ Protected API call successful: ' + JSON.stringify(response.data, null, 2));
    } catch (error: any) {
      setApiResult('❌ API request failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Example 2: Manual token refresh
   * You can manually trigger a token refresh
   */
  const handleManualRefresh = async () => {
    setLoading(true);
    setApiResult('');
    
    try {
      const success = await refreshToken();
      if (success) {
        setApiResult('✅ Token refreshed successfully');
      } else {
        setApiResult('❌ Token refresh failed, user logged out');
      }
    } catch (error: any) {
      setApiResult('❌ Manual refresh failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Example 3: Using the tokenManager directly
   * For lower-level token management
   */
  const checkTokenStatus = () => {
    const hasToken = tokenManager.getAccessToken();
    const hasRefreshToken = tokenManager.hasRefreshToken();
    const isExpired = tokenManager.isTokenExpired();

    setApiResult(`📊 Token Status:
- Has Access Token: ${!!hasToken}
- Has Refresh Token: ${hasRefreshToken}
- Is Expired: ${isExpired}
- Time to Expiry: ${Math.floor(tokenStatus.timeToExpiry / 1000 / 60)} minutes`);
  };

  /**
   * Example 4: The API client automatically handles token refresh
   * You can use it normally and it will refresh tokens when needed
   */
  const fetchProtectedData = async () => {
    setLoading(true);
    setApiResult('');
    
    try {
      // This will automatically refresh the token if it's expired
      const response = await apiClient.get('/api/user/profile');
      setApiResult('✅ Profile data fetched: ' + JSON.stringify(response.data, null, 2));
    } catch (error: any) {
      setApiResult('❌ Failed to fetch profile data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const buttonStyle: React.CSSProperties = {
    margin: '8px',
    padding: '12px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  };

  const disabledButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#6c757d',
    cursor: 'not-allowed',
  };

  const logoutButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#dc3545',
  };

  const containerStyle: React.CSSProperties = {
    padding: '24px',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    maxWidth: '1000px',
    margin: '0 auto',
    lineHeight: '1.6',
  };

  const statusBoxStyle: React.CSSProperties = {
    marginTop: '24px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #e9ecef',
  };

  const infoBoxStyle: React.CSSProperties = {
    marginTop: '24px',
    padding: '20px',
    backgroundColor: '#e8f4fd',
    borderRadius: '8px',
    border: '1px solid #bee5eb',
  };

  const resultBoxStyle: React.CSSProperties = {
    marginTop: '16px',
    padding: '16px',
    backgroundColor: '#f1f3f4',
    borderRadius: '6px',
    border: '1px solid #dadce0',
    fontFamily: 'Monaco, "Lucida Console", monospace',
    fontSize: '13px',
    whiteSpace: 'pre-wrap',
    maxHeight: '200px',
    overflow: 'auto',
  };

  return (
    <div style={containerStyle}>
      <h1 style={{ color: '#1a73e8', marginBottom: '8px' }}>🔄 Refresh Token Implementation</h1>
      <p style={{ color: '#5f6368', marginBottom: '32px' }}>
        This page demonstrates how to use refresh tokens for secure authentication in React.
      </p>
      
      {user ? (
        <div>
          <div style={{ padding: '16px', backgroundColor: '#e8f5e8', borderRadius: '8px', marginBottom: '24px' }}>
            <p style={{ margin: 0, fontWeight: '500' }}>
              ✅ <strong>Logged in as:</strong> {user.username} ({user.role})
            </p>
          </div>
          
          <div>
            <h3 style={{ marginBottom: '16px' }}>Try These Examples:</h3>
            
            <button 
              onClick={makeAuthenticatedRequest}
              disabled={loading}
              style={loading ? disabledButtonStyle : buttonStyle}
              onMouseOver={(e) => !loading && (e.currentTarget.style.backgroundColor = '#0056b3')}
              onMouseOut={(e) => !loading && (e.currentTarget.style.backgroundColor = '#007bff')}
            >
              {loading ? '⏳ Loading...' : '🔒 Make Authenticated Request'}
            </button>
            
            <button 
              onClick={handleManualRefresh}
              disabled={loading}
              style={loading ? disabledButtonStyle : buttonStyle}
              onMouseOver={(e) => !loading && (e.currentTarget.style.backgroundColor = '#0056b3')}
              onMouseOut={(e) => !loading && (e.currentTarget.style.backgroundColor = '#007bff')}
            >
              {loading ? '⏳ Loading...' : '🔄 Manual Token Refresh'}
            </button>
            
            <button 
              onClick={checkTokenStatus}
              disabled={loading}
              style={loading ? disabledButtonStyle : buttonStyle}
              onMouseOver={(e) => !loading && (e.currentTarget.style.backgroundColor = '#0056b3')}
              onMouseOut={(e) => !loading && (e.currentTarget.style.backgroundColor = '#007bff')}
            >
              📊 Check Token Status
            </button>
            
            <button 
              onClick={fetchProtectedData}
              disabled={loading}
              style={loading ? disabledButtonStyle : buttonStyle}
              onMouseOver={(e) => !loading && (e.currentTarget.style.backgroundColor = '#0056b3')}
              onMouseOut={(e) => !loading && (e.currentTarget.style.backgroundColor = '#007bff')}
            >
              {loading ? '⏳ Loading...' : '👤 Fetch Protected Data'}
            </button>
            
            <button 
              onClick={logout}
              style={logoutButtonStyle}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#c82333')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#dc3545')}
            >
              🚪 Logout
            </button>

            {apiResult && (
              <div style={resultBoxStyle}>
                {apiResult}
              </div>
            )}
          </div>

          <div style={statusBoxStyle}>
            <h3 style={{ marginTop: 0, color: '#495057' }}>📈 Live Token Status</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <strong>Access Token:</strong> {tokenStatus.hasToken ? '✅ Present' : '❌ Missing'}
              </div>
              <div>
                <strong>Refresh Token:</strong> {tokenStatus.hasRefreshToken ? '✅ Present' : '❌ Missing'}
              </div>
              <div>
                <strong>Token Status:</strong> {tokenStatus.isExpired ? '⚠️ Expired' : '✅ Valid'}
              </div>
              <div>
                <strong>Time to Expiry:</strong> {Math.floor(tokenStatus.timeToExpiry / 1000 / 60)} minutes
              </div>
            </div>
          </div>

          <div style={infoBoxStyle}>
            <h3 style={{ marginTop: 0, color: '#0c5460' }}>🔧 How It Works</h3>
            <ul style={{ paddingLeft: '20px' }}>
              <li><strong>Automatic Token Refresh:</strong> The API client automatically refreshes tokens when they expire</li>
              <li><strong>Token Storage:</strong> Access tokens, refresh tokens, and expiry times are stored securely</li>
              <li><strong>Background Refresh:</strong> Tokens are refreshed in the background without user intervention</li>
              <li><strong>Fallback to Login:</strong> If refresh fails, the user is automatically logged out</li>
              <li><strong>Queue Management:</strong> Multiple API calls during refresh are queued and processed after refresh completes</li>
            </ul>
          </div>

          <div style={{ ...infoBoxStyle, backgroundColor: '#fff3cd', borderColor: '#ffeaa7' }}>
            <h3 style={{ marginTop: 0, color: '#856404' }}>💡 Best Practices</h3>
            <ul style={{ paddingLeft: '20px' }}>
              <li>Always use the <code>apiClient</code> for API calls - it handles everything automatically</li>
              <li>Use the <code>getValidToken()</code> method for manual token access</li>
              <li>Monitor token expiration and refresh proactively</li>
              <li>Handle refresh failures gracefully by logging out the user</li>
              <li>Store refresh tokens securely (consider httpOnly cookies for production)</li>
            </ul>
          </div>
        </div>
      ) : (
        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#fff3cd', borderRadius: '8px' }}>
          <h3 style={{ color: '#856404' }}>🔐 Please log in to see the refresh token examples in action.</h3>
          <p style={{ color: '#856404' }}>
            Once logged in, you'll be able to test all the refresh token functionality.
          </p>
        </div>
      )}
    </div>
  );
};

export default RefreshToken;
