import React from 'react';
import {
  Alert,
  Container,
  Box,
  Typography,
  Button,
  Paper
} from '@mui/material';
import {
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

export interface ErrorStateProps {
  error?: Error | string | null;
  onRetry?: () => void;
  severity?: 'error' | 'warning' | 'info';
  title?: string;
  fullPage?: boolean;
}

// Generic error display component
export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  onRetry,
  severity = 'error',
  title,
  fullPage = false
}) => {
  const errorMessage = typeof error === 'string' ? error : error?.message || 'An unexpected error occurred';
  
  const content = (
    <Alert 
      severity={severity}
      action={
        onRetry && (
          <Button 
            color="inherit" 
            size="small" 
            onClick={onRetry}
            startIcon={<RefreshIcon />}
          >
            Retry
          </Button>
        )
      }
    >
      {title && <Typography variant="h6" gutterBottom>{title}</Typography>}
      {errorMessage}
    </Alert>
  );

  if (fullPage) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box 
          display="flex" 
          flexDirection="column" 
          alignItems="center" 
          justifyContent="center" 
          minHeight="400px"
          gap={3}
        >
          <Paper sx={{ p: 4, textAlign: 'center', maxWidth: 600 }}>
            <ErrorIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              {title || 'Something went wrong'}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {errorMessage}
            </Typography>
            {onRetry && (
              <Button 
                variant="contained" 
                onClick={onRetry}
                startIcon={<RefreshIcon />}
              >
                Try Again
              </Button>
            )}
          </Paper>
        </Box>
      </Container>
    );
  }

  return content;
};

// Network error component
export const NetworkError: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <ErrorState
    error="Network connection failed. Please check your internet connection and try again."
    onRetry={onRetry}
    title="Connection Error"
    fullPage
  />
);

// Not found error component
export const NotFoundError: React.FC<{ message?: string }> = ({ 
  message = "The requested resource was not found." 
}) => (
  <ErrorState
    error={message}
    title="Not Found"
    severity="warning"
    fullPage
  />
);

// Permission error component
export const PermissionError: React.FC = () => (
  <ErrorState
    error="You don't have permission to access this resource."
    title="Access Denied"
    severity="warning"
    fullPage
  />
);
