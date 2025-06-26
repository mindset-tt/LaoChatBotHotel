import { BrowserRouter } from "react-router-dom";
import { Suspense, memo } from "react";
import "./App.css";
import { RoutesManagement } from "./routes/Routes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider, CssBaseline } from "@mui/material";
import ErrorBoundary from "./components/ErrorBoundary";
import { AuthProvider } from "./contexts/AuthContext";
import { createAppTheme } from "./theme/theme";
import { AppLoadingFallback } from "./components/common/LoadingStates";
import { QUERY_CONFIG, FEATURES } from "./constants";

/**
 * Application Root Component
 * 
 * This component sets up the core application structure including:
 * - Theme provider for consistent styling
 * - Error boundary for graceful error handling
 * - Authentication context for user management
 * - Router for navigation
 * - React Query for API state management
 */

// Create QueryClient instance outside component to prevent recreation on re-renders
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: QUERY_CONFIG.STALE_TIME,
      retry: QUERY_CONFIG.RETRY_ATTEMPTS,
      refetchOnWindowFocus: QUERY_CONFIG.REFETCH_ON_WINDOW_FOCUS,
      refetchOnReconnect: QUERY_CONFIG.REFETCH_ON_RECONNECT,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Create theme instance - could be dynamic based on user preference in the future
const theme = createAppTheme('light');

/**
 * Main App Component
 * 
 * Renders the application with all necessary providers and wrappers.
 * Uses a layered approach for clean separation of concerns:
 * 1. Theme provider (styling)
 * 2. Error boundary (error handling)
 * 3. Auth provider (authentication state)
 * 4. Router (navigation)
 * 5. Query client (API state)
 */
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <AuthProvider>
          <BrowserRouter>
            <QueryClientProvider client={queryClient}>
              <div className="app-container">
                <Suspense fallback={<AppLoadingFallback />}>
                  <RoutesManagement />
                </Suspense>
              </div>
              {/* Show React Query devtools only in development */}
              {import.meta.env.DEV && FEATURES.REACT_QUERY_DEVTOOLS && (
                <ReactQueryDevtools initialIsOpen={false} />
              )}
            </QueryClientProvider>
          </BrowserRouter>
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default memo(App);
