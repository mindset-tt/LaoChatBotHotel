import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Alert,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper
} from '@mui/material';
import {
  Api,
  CheckCircle,
  Error,
  Warning,
  Refresh,
  ExpandMore,
  Code,
  Speed
} from '@mui/icons-material';
import {
  useDashboardSummary,
  useBookings,
  useRooms,
  useChatHistory,
  useSystemHealth,
  useNotifications
} from '../../hooks/api';
import {
  PageContainer,
  PageHeader,
  StatusCard,
  InfoCard,
  LoadingSpinner
} from '../../components/common';
import { MOCK_DATA_ENABLED } from '../../hooks/mockData';

interface ApiEndpointStatus {
  name: string;
  endpoint: string;
  data: any;
  loading: boolean;
  error: any;
  status: 'success' | 'error' | 'loading';
  responseTime?: number;
}

// API endpoint row component
const ApiEndpointRow: React.FC<{ 
  endpoint: ApiEndpointStatus;
  onRetry: () => void;
}> = ({ endpoint, onRetry }) => {
  const getStatusIcon = () => {
    switch (endpoint.status) {
      case 'success':
        return <CheckCircle color="success" />;
      case 'error':
        return <Error color="error" />;
      case 'loading':
        return <LoadingSpinner size={20} />;
      default:
        return <Warning color="warning" />;
    }
  };

  const getStatusColor = (): 'success' | 'error' | 'warning' | 'default' => {
    switch (endpoint.status) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'loading':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <TableRow>
      <TableCell>
        <Box display="flex" alignItems="center" gap={1}>
          {getStatusIcon()}
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {endpoint.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" fontFamily="monospace">
              {endpoint.endpoint}
            </Typography>
          </Box>
        </Box>
      </TableCell>
      <TableCell>
        <Chip
          label={endpoint.status}
          color={getStatusColor()}
          size="small"
          variant="filled"
        />
      </TableCell>
      <TableCell>
        {endpoint.responseTime ? `${endpoint.responseTime}ms` : '-'}
      </TableCell>
      <TableCell>
        {endpoint.error ? (
          <Typography variant="caption" color="error">
            {endpoint.error.message || 'Unknown error'}
          </Typography>
        ) : endpoint.data ? (
          <Typography variant="caption" color="success.main">
            Data loaded successfully
          </Typography>
        ) : (
          <Typography variant="caption" color="text.secondary">
            No data
          </Typography>
        )}
      </TableCell>
      <TableCell>
        <Button
          size="small"
          startIcon={<Refresh />}
          onClick={onRetry}
          disabled={endpoint.loading}
        >
          Retry
        </Button>
      </TableCell>
    </TableRow>
  );
};

// Response data viewer component
const ResponseDataViewer: React.FC<{ 
  title: string;
  data: any;
  error: any;
  loading: boolean;
}> = ({ title, data, error, loading }) => (
  <Accordion>
    <AccordionSummary expandIcon={<ExpandMore />}>
      <Box display="flex" alignItems="center" gap={1}>
        <Code color="primary" />
        <Typography variant="subtitle2">{title}</Typography>
        {loading && <LoadingSpinner size={16} />}
        {error && <Error color="error" fontSize="small" />}
        {data && !error && !loading && <CheckCircle color="success" fontSize="small" />}
      </Box>
    </AccordionSummary>
    <AccordionDetails>
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <Alert severity="error">
          <Typography variant="body2">
            <strong>Error:</strong> {error.message || 'Unknown error'}
          </Typography>
          {error.stack && (
            <Typography variant="caption" component="pre" sx={{ mt: 1, fontSize: '0.75rem' }}>
              {error.stack}
            </Typography>
          )}
        </Alert>
      ) : data ? (
        <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
          <Typography variant="caption" component="pre" sx={{ fontSize: '0.75rem', overflow: 'auto' }}>
            {JSON.stringify(data, null, 2)}
          </Typography>
        </Paper>
      ) : (
        <Typography variant="body2" color="text.secondary">
          No data available
        </Typography>
      )}
    </AccordionDetails>
  </Accordion>
);

export const ApiTestPageModern: React.FC = () => {
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Test all major API endpoints
  const dashboardQuery = useDashboardSummary();
  const bookingsQuery = useBookings();
  const roomsQuery = useRooms();
  const chatHistoryQuery = useChatHistory();
  const systemHealthQuery = useSystemHealth();
  const notificationsQuery = useNotifications();

  // Create API endpoints status array
  const apiEndpoints: ApiEndpointStatus[] = [
    {
      name: 'Dashboard Summary',
      endpoint: '/api/dashboard/summary',
      data: dashboardQuery.data,
      loading: dashboardQuery.isLoading,
      error: dashboardQuery.error,
      status: dashboardQuery.isLoading ? 'loading' : dashboardQuery.error ? 'error' : 'success'
    },
    {
      name: 'Bookings',
      endpoint: '/api/bookings',
      data: bookingsQuery.data,
      loading: bookingsQuery.isLoading,
      error: bookingsQuery.error,
      status: bookingsQuery.isLoading ? 'loading' : bookingsQuery.error ? 'error' : 'success'
    },
    {
      name: 'Rooms',
      endpoint: '/api/rooms',
      data: roomsQuery.data,
      loading: roomsQuery.isLoading,
      error: roomsQuery.error,
      status: roomsQuery.isLoading ? 'loading' : roomsQuery.error ? 'error' : 'success'
    },
    {
      name: 'Chat History',
      endpoint: '/api/chat/history',
      data: chatHistoryQuery.data,
      loading: chatHistoryQuery.isLoading,
      error: chatHistoryQuery.error,
      status: chatHistoryQuery.isLoading ? 'loading' : chatHistoryQuery.error ? 'error' : 'success'
    },
    {
      name: 'System Health',
      endpoint: '/api/system/health',
      data: systemHealthQuery.data,
      loading: systemHealthQuery.isLoading,
      error: systemHealthQuery.error,
      status: systemHealthQuery.isLoading ? 'loading' : systemHealthQuery.error ? 'error' : 'success'
    },
    {
      name: 'Notifications',
      endpoint: '/api/notifications',
      data: notificationsQuery.data,
      loading: notificationsQuery.isLoading,
      error: notificationsQuery.error,
      status: notificationsQuery.isLoading ? 'loading' : notificationsQuery.error ? 'error' : 'success'
    }
  ];

  // Calculate statistics
  const successCount = apiEndpoints.filter(api => api.status === 'success').length;
  const errorCount = apiEndpoints.filter(api => api.status === 'error').length;
  const loadingCount = apiEndpoints.filter(api => api.status === 'loading').length;

  const handleRetryAll = () => {
    dashboardQuery.refetch();
    bookingsQuery.refetch();
    roomsQuery.refetch();
    chatHistoryQuery.refetch();
    systemHealthQuery.refetch();
    notificationsQuery.refetch();
  };

  const handleRetryEndpoint = (endpoint: ApiEndpointStatus) => {
    switch (endpoint.name) {
      case 'Dashboard Summary':
        dashboardQuery.refetch();
        break;
      case 'Bookings':
        bookingsQuery.refetch();
        break;
      case 'Rooms':
        roomsQuery.refetch();
        break;
      case 'Chat History':
        chatHistoryQuery.refetch();
        break;
      case 'System Health':
        systemHealthQuery.refetch();
        break;
      case 'Notifications':
        notificationsQuery.refetch();
        break;
    }
  };

  return (
    <PageContainer maxWidth="xl">
      <PageHeader
        title="API Test Dashboard"
        subtitle="Monitor and test API endpoints connectivity and responses"
        icon={<Api sx={{ fontSize: '2rem', color: 'primary.main' }} />}
        actions={
          <Box display="flex" gap={2} alignItems="center">
            <FormControlLabel
              control={
                <Switch
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                />
              }
              label="Auto Refresh"
            />
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={handleRetryAll}
            >
              Refresh All
            </Button>
          </Box>
        }
      />

      {/* Mock Data Status */}
      <Alert 
        severity={MOCK_DATA_ENABLED ? "info" : "success"} 
        sx={{ mb: 3 }}
      >
        {MOCK_DATA_ENABLED 
          ? "🔧 Mock data mode is enabled. API calls are simulated with mock responses."
          : "✅ Live API mode is active. All endpoints are connecting to real backend services."
        }
      </Alert>

      {/* API Status Overview */}
      <Box sx={{ display: 'grid', gap: 3, mb: 4, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <StatusCard
          icon={<CheckCircle color="success" />}
          title="Successful"
          status={`${successCount} endpoints`}
          color="success"
          description="Working correctly"
        />
        <StatusCard
          icon={<Error color="error" />}
          title="Failed"
          status={`${errorCount} endpoints`}
          color="error"
          description="Need attention"
        />
        <StatusCard
          icon={<Speed color="info" />}
          title="Loading"
          status={`${loadingCount} endpoints`}
          color="warning"
          description="Currently testing"
        />
        <StatusCard
          icon={<Api color="primary" />}
          title="Total Endpoints"
          status={`${apiEndpoints.length} endpoints`}
          color="default"
          description="Being monitored"
        />
      </Box>

      {/* API Endpoints Table */}
      <InfoCard title="API Endpoints Status" icon={<Api color="primary" />}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Endpoint</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Response Time</strong></TableCell>
                <TableCell><strong>Details</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {apiEndpoints.map((endpoint, index) => (
                <ApiEndpointRow
                  key={index}
                  endpoint={endpoint}
                  onRetry={() => handleRetryEndpoint(endpoint)}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </InfoCard>

      {/* Response Data Viewers */}
      <InfoCard title="API Response Data" icon={<Code color="primary" />} elevated>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {apiEndpoints.map((endpoint, index) => (
            <ResponseDataViewer
              key={index}
              title={endpoint.name}
              data={endpoint.data}
              error={endpoint.error}
              loading={endpoint.loading}
            />
          ))}
        </Box>
      </InfoCard>
    </PageContainer>
  );
};

ApiTestPageModern.displayName = 'ApiTestPageModern';
