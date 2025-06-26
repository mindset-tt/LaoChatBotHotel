import React from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Alert,
  Switch,
  FormControlLabel,
  Chip,
  Card,
  CardContent
} from '@mui/material';
import {
  useDashboardSummary,
  useBookings,
  useRooms,
  useChatHistory,
  useSystemHealth,
  useNotifications
} from '../../hooks/api';
import { MOCK_DATA_ENABLED } from '../../hooks/mockData';

export const ApiTestPage = () => {
  // Test all major API endpoints
  const { data: dashboard, isLoading: dashboardLoading, error: dashboardError } = useDashboardSummary();
  const { data: bookings, isLoading: bookingsLoading, error: bookingsError } = useBookings();
  const { data: rooms, isLoading: roomsLoading, error: roomsError } = useRooms();
  const { data: chatHistory, isLoading: chatLoading, error: chatError } = useChatHistory();
  const { data: systemHealth, isLoading: healthLoading, error: healthError } = useSystemHealth();
  const { data: notifications, isLoading: notificationsLoading, error: notificationsError } = useNotifications();

  const apis = [
    { name: 'Dashboard', data: dashboard, loading: dashboardLoading, error: dashboardError },
    { name: 'Bookings', data: bookings, loading: bookingsLoading, error: bookingsError },
    { name: 'Rooms', data: rooms, loading: roomsLoading, error: roomsError },
    { name: 'Chat History', data: chatHistory, loading: chatLoading, error: chatError },
    { name: 'System Health', data: systemHealth, loading: healthLoading, error: healthError },
    { name: 'Notifications', data: notifications, loading: notificationsLoading, error: notificationsError },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom fontWeight={600}>
        API Test Dashboard
      </Typography>

      <Alert 
        severity={MOCK_DATA_ENABLED ? "info" : "success"} 
        sx={{ mb: 3 }}
        action={
          <Chip 
            label={MOCK_DATA_ENABLED ? "Mock Mode" : "Live Mode"} 
            color={MOCK_DATA_ENABLED ? "default" : "success"}
            size="small"
          />
        }
      >
        {MOCK_DATA_ENABLED 
          ? "🎭 Mock data is enabled. All API calls will return dummy data if the backend is unavailable."
          : "🌐 Live mode is enabled. API calls will attempt to reach the real backend."
        }
      </Alert>

      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
        API Endpoint Status
      </Typography>

      <Box 
        display="flex" 
        flexWrap="wrap" 
        gap={2}
      >
        {apis.map((api) => (
          <Box key={api.name} sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(33.33% - 8px)' } }}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">{api.name}</Typography>
                  <Chip 
                    label={
                      api.loading ? "Loading..." : 
                      api.error ? "Error" : 
                      api.data ? "Success" : "No Data"
                    }
                    color={
                      api.loading ? "default" : 
                      api.error ? "error" : 
                      api.data ? "success" : "warning"
                    }
                    size="small"
                  />
                </Box>
                
                {api.error && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    API failed, using mock data fallback
                  </Alert>
                )}
                
                <Typography variant="body2" color="textSecondary">
                  {api.loading ? (
                    "Loading data..."
                  ) : api.data ? (
                    `✓ Data loaded successfully ${MOCK_DATA_ENABLED ? "(Mock)" : "(Live)"}`
                  ) : (
                    "No data available"
                  )}
                </Typography>
                
                {api.data && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="textSecondary">
                      Sample data preview:
                    </Typography>
                    <Paper 
                      sx={{ 
                        p: 1, 
                        mt: 1, 
                        backgroundColor: 'grey.50', 
                        maxHeight: 100, 
                        overflow: 'auto',
                        fontSize: '0.75rem'
                      }}
                    >
                      <Box 
                        component="pre" 
                        sx={{ 
                          margin: 0, 
                          whiteSpace: 'pre-wrap',
                          fontFamily: 'monospace'
                        }}
                      >
                        {JSON.stringify(api.data, null, 2).substring(0, 200)}
                        {JSON.stringify(api.data, null, 2).length > 200 ? '...' : ''}
                      </Box>
                    </Paper>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          How to Toggle Mock Data
        </Typography>
        <Typography variant="body2" paragraph>
          To switch between mock data and live API calls, modify the <code>VITE_MOCK_DATA_ENABLED</code> 
          environment variable in your <code>.env.development</code> file.
        </Typography>
        <Typography variant="body2" paragraph>
          • Set <code>VITE_MOCK_DATA_ENABLED=true</code> to use mock data (useful for development when backend is down)
        </Typography>
        <Typography variant="body2" paragraph>
          • Set <code>VITE_MOCK_DATA_ENABLED=false</code> to use live API calls (default for production)
        </Typography>
        <Typography variant="body2">
          The frontend will automatically fall back to mock data if any API call fails, ensuring the UI remains functional.
        </Typography>
      </Paper>
    </Container>
  );
};

export default ApiTestPage;
