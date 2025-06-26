import React, { useMemo } from 'react';
import {
  Container,
  Paper,
  Typography,
  Card,
  CardContent,
  Box,
  CircularProgress,
  Alert,
  Chip,
  Skeleton
} from '@mui/material';
import {
  TrendingUp,
  Assessment,
  Hotel,
  Chat,
  Memory,
  Storage
} from '@mui/icons-material';
import { useDashboardSummary, useSystemHealth } from '../../hooks/api';

// Memoized status color function
const getStatusColor = (status: string) => {
  switch (status) {
    case 'healthy': return 'success';
    case 'loaded': return 'success';
    case 'degraded': return 'warning';
    default: return 'error';
  }
};

// Memoized uptime formatter
const formatUptime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

// Memoized status card component
const StatusCard = React.memo(({ icon, title, status, color }: {
  icon: React.ReactNode;
  title: string;
  status: string;
  color: 'success' | 'warning' | 'error' | 'default';
}) => (
  <Card>
    <CardContent>
      <Box display="flex" alignItems="center" gap={1}>
        {icon}
        <Typography variant="h6">{title}</Typography>
      </Box>
      <Chip 
        label={status} 
        color={color} 
        sx={{ mt: 1 }}
      />
    </CardContent>
  </Card>
));

StatusCard.displayName = 'StatusCard';

// Memoized metric card component
const MetricCard = React.memo(({ icon, title, value }: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
}) => (
  <Card>
    <CardContent>
      <Box display="flex" alignItems="center" gap={1}>
        {icon}
        <Typography variant="h6">{title}</Typography>
      </Box>
      <Typography variant="h4" sx={{ mt: 1 }}>
        {value}
      </Typography>
    </CardContent>
  </Card>
));

MetricCard.displayName = 'MetricCard';

// Memoized activity item component
const ActivityItem = React.memo(({ item, type }: {
  item: any;
  type: 'booking' | 'chat';
}) => (
  <Box sx={{ p: 2, borderBottom: '1px solid #eee' }}>
    {type === 'booking' ? (
      <>
        <Typography variant="body2">
          <strong>Room {item.room_number}</strong> - {item.guest_name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {item.check_in_date} to {item.check_out_date}
        </Typography>
      </>
    ) : (
      <>
        <Typography variant="body2" noWrap>
          {item.content}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Session: {item.session_id?.substring(0, 8)}...
        </Typography>
      </>
    )}
  </Box>
));

ActivityItem.displayName = 'ActivityItem';

// Skeleton loader component
const DashboardSkeleton = React.memo(() => (
  <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
    <Skeleton variant="text" sx={{ fontSize: '2rem', mb: 4 }} />
    <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
      {[...Array(4)].map((_, index) => (
        <Box key={index} sx={{ flex: '1 1 300px', minWidth: '250px' }}>
          <Card>
            <CardContent>
              <Skeleton variant="text" sx={{ fontSize: '1.5rem' }} />
              <Skeleton variant="rectangular" width={80} height={32} sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Box>
      ))}
    </Box>
  </Container>
));

DashboardSkeleton.displayName = 'DashboardSkeleton';

export const Dashboard: React.FC = React.memo(() => {
  const { 
    data: dashboardData, 
    isLoading: dashboardLoading, 
    error: dashboardError 
  } = useDashboardSummary();
  
  const { 
    data: systemHealth, 
    isLoading: healthLoading, 
    error: healthError 
  } = useSystemHealth();

  // Memoize computed values
  const isLoading = useMemo(() => dashboardLoading || healthLoading, [dashboardLoading, healthLoading]);
  const error = useMemo(() => dashboardError || healthError, [dashboardError, healthError]);
  
  const statusCards = useMemo(() => {
    if (!systemHealth) return [];
    
    return [
      {
        icon: <Assessment color="primary" />,
        title: 'System Status',
        status: systemHealth.status || 'Unknown',
        color: getStatusColor(systemHealth.status || '')
      },
      {
        icon: <Storage color="primary" />,
        title: 'Database',
        status: systemHealth.database || 'Unknown',
        color: getStatusColor(systemHealth.database || '')
      },
      {
        icon: <Memory color="primary" />,
        title: 'AI Models',
        status: systemHealth.models || 'Unknown',
        color: getStatusColor(systemHealth.models || '')
      }
    ];
  }, [systemHealth]);

  const todayStats = useMemo(() => {
    if (!dashboardData?.today_stats) return null;
    
    return [
      {
        icon: <Chat color="primary" />,
        title: 'Total Messages',
        value: dashboardData.today_stats.total_messages || 0
      },
      {
        icon: <TrendingUp color="success" />,
        title: 'Active Sessions',
        value: dashboardData.today_stats.active_sessions || 0
      },
      {
        icon: <Hotel color="info" />,
        title: 'Occupancy Rate',
        value: dashboardData.current_occupancy?.occupancy_rate 
          ? `${Math.round(dashboardData.current_occupancy.occupancy_rate)}%` 
          : '0%'
      }
    ];
  }, [dashboardData]);

  const recentBookings = useMemo(() => 
    dashboardData?.recent_bookings?.slice(0, 5) || [], 
    [dashboardData?.recent_bookings]
  );

  const recentChats = useMemo(() => 
    dashboardData?.recent_chats?.slice(0, 5) || [], 
    [dashboardData?.recent_chats]
  );

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          Failed to load dashboard data. Please check your connection and try again.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        📊 System Dashboard
      </Typography>

      {/* System Health Overview */}
      <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
        {statusCards.map((card, index) => (
          <Box key={index} sx={{ flex: '1 1 300px', minWidth: '250px' }}>
            <StatusCard 
              icon={card.icon}
              title={card.title}
              status={card.status}
              color={card.color as 'success' | 'warning' | 'error' | 'default'}
            />
          </Box>
        ))}
        
        <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
          <MetricCard
            icon={<TrendingUp color="primary" />}
            title="Uptime"
            value={systemHealth ? formatUptime(systemHealth.uptime_seconds) : 'Unknown'}
          />
        </Box>
      </Box>

      {/* Recent Activity */}
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        <Box sx={{ flex: '1 1 400px', minWidth: '350px' }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              <Hotel sx={{ mr: 1, verticalAlign: 'middle' }} />
              Recent Bookings
            </Typography>
            {recentBookings.length ? (
              <Box>
                {recentBookings.map((booking, index) => (
                  <ActivityItem 
                    key={`booking-${index}`} 
                    item={booking} 
                    type="booking" 
                  />
                ))}
              </Box>
            ) : (
              <Typography color="text.secondary">No recent bookings</Typography>
            )}
          </Paper>
        </Box>

        <Box sx={{ flex: '1 1 400px', minWidth: '350px' }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              <Chat sx={{ mr: 1, verticalAlign: 'middle' }} />
              Recent Chats
            </Typography>
            {recentChats.length ? (
              <Box>
                {recentChats.map((chat, index) => (
                  <ActivityItem 
                    key={`chat-${index}`} 
                    item={chat} 
                    type="chat" 
                  />
                ))}
              </Box>
            ) : (
              <Typography color="text.secondary">No recent chats</Typography>
            )}
          </Paper>
        </Box>
      </Box>

      {/* Today's Statistics */}
      {todayStats && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            📈 Today's Statistics
          </Typography>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {todayStats.map((stat, index) => (
              <Box key={index} sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                <Box display="flex" alignItems="center" gap={1}>
                  {stat.icon}
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {stat.title}
                    </Typography>
                    <Typography variant="h4">{stat.value}</Typography>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        </Paper>
      )}
    </Container>
  );
});

Dashboard.displayName = 'Dashboard';
