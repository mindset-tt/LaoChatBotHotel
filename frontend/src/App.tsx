import { BrowserRouter } from "react-router-dom";
import { Suspense, memo } from "react";
import "./App.css";
import { RoutesManagement } from "./routes/Routes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Box, CircularProgress, Typography } from "@mui/material";
import ErrorBoundary from "./components/ErrorBoundary";

// Create QueryClient instance outside component to prevent recreation
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30 seconds
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Loading fallback component
const LoadingFallback = memo(() => (
  <Box 
    display="flex" 
    flexDirection="column" 
    alignItems="center" 
    justifyContent="center" 
    minHeight="100vh"
    gap={2}
  >
    <CircularProgress size={60} />
    <Typography variant="h6" color="textSecondary">
      Loading application...
    </Typography>
  </Box>
));

LoadingFallback.displayName = 'LoadingFallback';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <Suspense fallback={<LoadingFallback />}>
            <RoutesManagement />
          </Suspense>
          {process.env.NODE_ENV === 'development' && (
            <ReactQueryDevtools initialIsOpen={false} />
          )}
        </QueryClientProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default memo(App);
