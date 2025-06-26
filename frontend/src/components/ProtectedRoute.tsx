import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, CircularProgress, Typography } from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredRole?: 'admin' | 'user';
  fallbackTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requiredRole,
  fallbackTo = '/chats'
}) => {
  const { isAuthenticated, hasPermission, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <Box 
        display="flex" 
        flexDirection="column" 
        alignItems="center" 
        justifyContent="center" 
        minHeight="50vh"
        gap={2}
      >
        <CircularProgress size={40} />
        <Typography variant="body2" color="textSecondary">
          Checking authentication...
        </Typography>
      </Box>
    );
  }

  // If route requires authentication but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    // Save the attempted location for redirect after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If route has role requirements
  if (requiredRole && !hasPermission(requiredRole)) {
    return <Navigate to={fallbackTo} replace />;
  }

  return <>{children}</>;
};
