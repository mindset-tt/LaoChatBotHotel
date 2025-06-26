import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Alert, AlertTitle } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing.
 * 
 * This is a class component because error boundaries must be class components
 * in React (hooks don't support error boundaries yet).
 */

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  /**
   * Static method called when an error is thrown
   * Used to update state to trigger the error UI
   */
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  /**
   * Called when an error has been thrown by a descendant component
   * Used for logging and updating state with error details
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  /**
   * Handler to reload the page - simple recovery mechanism
   */
  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="100vh"
          padding={3}
          maxWidth={600}
          margin="0 auto"
        >
          <Alert severity="error" sx={{ width: '100%', mb: 3 }}>
            <AlertTitle>Application Error</AlertTitle>
            Something went wrong. Please try refreshing the page.
          </Alert>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={this.handleReload}
            size="large"
          >
            Reload Application
          </Button>

          {import.meta.env.DEV && this.state.error && (
            <Box mt={3} width="100%">
              <Typography variant="h6" gutterBottom>
                Error Details (Development Mode):
              </Typography>
              <Box
                component="pre"
                sx={{
                  bgcolor: 'grey.100',
                  p: 2,
                  borderRadius: 1,
                  overflow: 'auto',
                  fontSize: '0.875rem',
                  maxHeight: 300,
                }}
              >
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </Box>
            </Box>
          )}
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
