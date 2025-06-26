import React, { memo } from 'react';
import {
  Box,
  CircularProgress,
  Skeleton,
  Container,
  Card,
  CardContent,
  Typography
} from '@mui/material';
import { UI_CONFIG } from '../../constants';

/**
 * Loading Components
 * Centralized loading states for consistent user experience
 */

// App-level loading fallback (used in App.tsx Suspense)
export const AppLoadingFallback = memo(() => (
  <Box 
    display="flex" 
    flexDirection="column" 
    alignItems="center" 
    justifyContent="center" 
    minHeight={UI_CONFIG.APP_LOADER_MIN_HEIGHT}
    gap={2}
    className="app-loading-container"
  >
    <CircularProgress size={60} color="primary" />
    <Typography variant="h6" color="text.secondary">
      Loading application...
    </Typography>
  </Box>
));

AppLoadingFallback.displayName = 'AppLoadingFallback';

// Page-level loading fallback (used in route Suspense)
export const PageLoadingFallback = memo(() => (
  <Box 
    display="flex" 
    justifyContent="center" 
    alignItems="center" 
    minHeight={UI_CONFIG.PAGE_LOADER_MIN_HEIGHT}
  >
    <CircularProgress color="primary" />
  </Box>
));

PageLoadingFallback.displayName = 'PageLoadingFallback';

// Loading spinner component (configurable size)
export const LoadingSpinner: React.FC<{ 
  size?: number; 
  color?: 'primary' | 'secondary' | 'inherit';
  message?: string;
}> = ({ 
  size = 40, 
  color = 'primary',
  message 
}) => (
  <Box 
    display="flex" 
    flexDirection="column"
    alignItems="center" 
    justifyContent="center"
    gap={message ? 1 : 0}
  >
    <CircularProgress size={size} color={color} />
    {message && (
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    )}
  </Box>
);

// Page-level loading state
export const PageLoading: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
    <Box 
      display="flex" 
      flexDirection="column" 
      alignItems="center" 
      justifyContent="center" 
      minHeight="400px"
      gap={2}
    >
      <CircularProgress size={60} />
      <Typography variant="h6" color="text.secondary">
        {message}
      </Typography>
    </Box>
  </Container>
);

// Skeleton loader for cards
export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
    {[...Array(count)].map((_, index) => (
      <Box key={index} sx={{ flex: '1 1 300px', minWidth: '250px' }}>
        <Card>
          <CardContent>
            <Skeleton variant="text" sx={{ fontSize: '1.5rem' }} />
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="rectangular" height={60} sx={{ mt: 1 }} />
          </CardContent>
        </Card>
      </Box>
    ))}
  </Box>
);

// Table skeleton loader
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ 
  rows = 5, 
  columns = 4 
}) => (
  <Box>
    {[...Array(rows)].map((_, rowIndex) => (
      <Box key={rowIndex} sx={{ display: 'flex', gap: 2, mb: 1 }}>
        {[...Array(columns)].map((_, colIndex) => (
          <Skeleton 
            key={colIndex} 
            variant="text" 
            sx={{ flex: 1, height: 40 }} 
          />
        ))}
      </Box>
    ))}
  </Box>
);

// Generic content skeleton
export const ContentSkeleton: React.FC<{ 
  lines?: number; 
  title?: boolean;
  image?: boolean;
}> = ({ 
  lines = 3, 
  title = true,
  image = false 
}) => (
  <Box>
    {title && <Skeleton variant="text" sx={{ fontSize: '2rem', mb: 2 }} />}
    {image && <Skeleton variant="rectangular" height={200} sx={{ mb: 2 }} />}
    {[...Array(lines)].map((_, index) => (
      <Skeleton 
        key={index} 
        variant="text" 
        width={index === lines - 1 ? '60%' : '100%'}
        sx={{ mb: 1 }}
      />
    ))}
  </Box>
);
