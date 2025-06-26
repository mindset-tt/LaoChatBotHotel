import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Paper
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
import {
  PageContainer,
  MetricCard,
  StatusCard,
  InfoCard,
  PageLoading,
  ErrorState
} from '../../components/common';
import { formatUptime, getStatusColor, formatRelativeTime } from '../../utils';

// Activity item component
const ActivityItem = React.memo(({ item, type }: {
  item: any;
  type: 'booking' | 'chat';
}) => (
  <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', '&:last-child': { borderBottom: 'none' } }}>
    {type === 'booking' ? (
      <>
        <Typography variant="body2" fontWeight="medium">
          <strong>Room {item.room_number}</strong> - {item.guest_name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {item.check_in_date} to {item.check_out_date}
        </Typography>
      </>
    ) : (
      <>
        <Typography variant="body2" noWrap sx={{ mb: 0.5 }}>
          {item.content}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Session: {item.session_id?.substring(0, 8)}... • {formatRelativeTime(item.created_at)}
        </Typography>
      </>
    )}
  </Box>
));

ActivityItem.displayName = 'ActivityItem';

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
        color: getStatusColor(systemHealth.status || ''),
        description: `System is ${systemHealth.status || 'unknown'}`
      },
      {
        icon: <Storage color="primary" />,
        title: 'Database',
        status: systemHealth.database || 'Unknown',
        color: getStatusColor(systemHealth.database || ''),
        description: 'Database connection status'
      },
      {
        icon: <Memory color="primary" />,
        title: 'AI Models',
        status: systemHealth.models || 'Unknown',
        color: getStatusColor(systemHealth.models || ''),
        description: 'Machine learning models status'
      }
    ];
  }, [systemHealth]);

  const todayStats = useMemo(() => {
    if (!dashboardData?.today_stats) return [];
    
    return [
      {
        icon: <Chat color="primary" />,
        title: 'Total Messages',
        value: dashboardData.today_stats.total_messages || 0,
        subtitle: 'Messages today'
      },
      {
        icon: <TrendingUp color="success" />,
        title: 'Active Sessions',
        value: dashboardData.today_stats.active_sessions || 0,
        subtitle: 'Currently active'
      },
      {
        icon: <Hotel color="info" />,
        title: 'Occupancy Rate',
        value: dashboardData.current_occupancy?.occupancy_rate 
          ? `${Math.round(dashboardData.current_occupancy.occupancy_rate)}%` 
          : '0%',
        subtitle: 'Current occupancy'
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
    return <PageLoading message="Loading dashboard data..." />;
  }

  if (error) {
    return (
      <PageContainer>
        <ErrorState
          error={error}
          title="Dashboard Error"
          fullPage
        />
      </PageContainer>
    );
  }
  return (
    <PageContainer maxWidth="xl">
      {/* System Health Overview */}
      <Box sx={{ display: 'grid', gap: 3, mb: 4, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        {statusCards.map((card, index) => (
          <StatusCard
            key={index}
            icon={card.icon}
            title={card.title}
            status={card.status}
            color={card.color}
            description={card.description}
          />
        ))}
        
        <MetricCard
          icon={<TrendingUp color="primary" />}
          title="System Uptime"
          value={systemHealth ? formatUptime(systemHealth.uptime_seconds) : 'Unknown'}
          subtitle="Since last restart"
        />
      </Box>

      {/* Today's Statistics */}
      {todayStats.length > 0 && (
        <InfoCard
          title="Today's Statistics"
          icon={<Assessment color="primary" />}
          elevated
        >
          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
            {todayStats.map((stat, index) => (
              <Box key={index} display="flex" alignItems="center" gap={2}>
                {stat.icon}
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stat.subtitle}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </InfoCard>
      )}

      {/* Recent Activity */}
      <Box sx={{ display: 'grid', gap: 3, mt: 4, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
        <InfoCard
          title="Recent Bookings"
          icon={<Hotel color="primary" />}
        >
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
            <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
              No recent bookings
            </Typography>
          )}
        </InfoCard>

        <InfoCard
          title="Recent Chats"
          icon={<Chat color="primary" />}
        >
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
            <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
              No recent chats
            </Typography>
          )}
        </InfoCard>
      </Box>
    </PageContainer>
  );
});

Dashboard.displayName = 'Dashboard';
