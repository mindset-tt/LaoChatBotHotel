import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Button,
  ButtonGroup
} from '@mui/material';
import {
  TrendingUp,
  Chat,
  Hotel,
  Assessment,
  Download,
  Timeline,
  BarChart,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import { useChatInsights, useBookingInsights } from '../../hooks/api';
import {
  PageContainer,
  MetricCard,
  InfoCard,
  PageLoading,
  ErrorState
} from '../../components/common';
import { 
  formatDuration, 
  formatNumber, 
  formatPercentage,
  formatCurrency
} from '../../utils';

interface ChatInsights {
  daily_stats: Array<{
    date: string;
    total_messages: number;
    user_messages: number;
    bot_messages: number;
  }>;
  avg_session_duration: number;
  total_sessions: number;
  avg_messages_per_session: number;
  peak_hours: Array<{
    hour: number;
    message_count: number;
  }>;
}

interface BookingInsights {
  occupancy_rate: number;
  revenue_trend: Array<{
    date: string;
    revenue: number;
    bookings: number;
  }>;
  popular_room_types: Array<{
    room_type: string;
    booking_count: number;
    revenue: number;
  }>;
  avg_booking_value: number;
  total_revenue: number;
}

// Chat analytics component
const ChatAnalyticsTab: React.FC<{ insights: ChatInsights; days: number }> = ({ insights, days }) => {
  const metrics = useMemo(() => [
    {
      icon: <Chat color="primary" />,
      title: 'Total Sessions',
      value: formatNumber(insights.total_sessions || 0),
      subtitle: `Last ${days} days`
    },
    {
      icon: <Timeline color="success" />,
      title: 'Avg Session Duration',
      value: formatDuration(Math.round(insights.avg_session_duration || 0) * 60), // Convert minutes to seconds
      subtitle: 'Per session'
    },
    {
      icon: <TrendingUp color="info" />,
      title: 'Messages per Session',
      value: formatNumber(Math.round(insights.avg_messages_per_session || 0)),
      subtitle: 'Average messages'
    },
    {
      icon: <BarChart color="warning" />,
      title: 'Total Messages',
      value: formatNumber(insights.daily_stats?.reduce((sum, day) => sum + day.total_messages, 0) || 0),
      subtitle: `Last ${days} days`
    }
  ], [insights, days]);

  const peakHour = useMemo(() => {
    if (!insights.peak_hours?.length) return null;
    return insights.peak_hours.reduce((max, hour) => 
      hour.message_count > max.message_count ? hour : max
    );
  }, [insights.peak_hours]);
  return (
    <Box>
      {/* Metrics Cards */}
      <Box sx={{ display: 'grid', gap: 3, mb: 4, gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </Box>

      {/* Additional Insights */}
      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
        <InfoCard title="Message Distribution" icon={<Chat color="primary" />}>
          {insights.daily_stats?.slice(-7).map((day, index) => (
            <Box key={index} sx={{ mb: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">{new Date(day.date).toLocaleDateString()}</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {formatNumber(day.total_messages)} messages
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                <Box 
                  sx={{ 
                    flex: day.user_messages / day.total_messages, 
                    height: 4, 
                    backgroundColor: 'primary.main', 
                    borderRadius: 1 
                  }} 
                />
                <Box 
                  sx={{ 
                    flex: day.bot_messages / day.total_messages, 
                    height: 4, 
                    backgroundColor: 'secondary.main', 
                    borderRadius: 1 
                  }} 
                />
              </Box>
              <Box display="flex" gap={2} mt={0.5}>
                <Typography variant="caption" color="primary.main">
                  User: {day.user_messages}
                </Typography>
                <Typography variant="caption" color="secondary.main">
                  Bot: {day.bot_messages}
                </Typography>
              </Box>
            </Box>
          ))}
        </InfoCard>

        <InfoCard title="Peak Activity" icon={<TrendingUp color="primary" />}>
          {peakHour && (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h3" color="primary.main">
                {peakHour.hour}:00
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                Peak Hour
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatNumber(peakHour.message_count)} messages during peak hour
              </Typography>
            </Box>
          )}
          
          {insights.peak_hours?.slice(0, 5).map((hour, index) => (
            <Box key={index} sx={{ mb: 1 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">{hour.hour}:00 - {hour.hour + 1}:00</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {formatNumber(hour.message_count)}
                </Typography>
              </Box>
            </Box>
          ))}
        </InfoCard>
      </Box>
    </Box>
  );
};

// Booking analytics component
const BookingAnalyticsTab: React.FC<{ insights: BookingInsights; days: number }> = ({ insights, days }) => {
  const metrics = useMemo(() => [
    {
      icon: <Hotel color="primary" />,
      title: 'Occupancy Rate',
      value: formatPercentage(insights.occupancy_rate || 0),
      subtitle: 'Current occupancy'
    },
    {
      icon: <TrendingUp color="success" />,
      title: 'Total Revenue',
      value: formatCurrency(insights.total_revenue || 0),
      subtitle: `Last ${days} days`
    },
    {
      icon: <BarChart color="info" />,
      title: 'Avg Booking Value',
      value: formatCurrency(insights.avg_booking_value || 0),
      subtitle: 'Per booking'
    },
    {
      icon: <Assessment color="warning" />,
      title: 'Total Bookings',
      value: formatNumber(insights.revenue_trend?.reduce((sum, day) => sum + day.bookings, 0) || 0),
      subtitle: `Last ${days} days`
    }
  ], [insights, days]);
  return (
    <Box>
      {/* Metrics Cards */}
      <Box sx={{ display: 'grid', gap: 3, mb: 4, gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </Box>

      {/* Additional Insights */}
      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
        <InfoCard title="Revenue Trend" icon={<TrendingUp color="primary" />}>
          {insights.revenue_trend?.slice(-7).map((day, index) => (
            <Box key={index} sx={{ mb: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">{new Date(day.date).toLocaleDateString()}</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {formatCurrency(day.revenue)}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {day.bookings} booking{day.bookings !== 1 ? 's' : ''}
              </Typography>
            </Box>
          ))}
        </InfoCard>

        <InfoCard title="Popular Room Types" icon={<Hotel color="primary" />}>
          {insights.popular_room_types?.slice(0, 5).map((room, index) => (
            <Box key={index} sx={{ mb: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" fontWeight="medium">
                  {room.room_type}
                </Typography>
                <Typography variant="body2">
                  {formatCurrency(room.revenue)}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {room.booking_count} booking{room.booking_count !== 1 ? 's' : ''}
              </Typography>
            </Box>
          ))}
        </InfoCard>
      </Box>
    </Box>
  );
};

export const AnalyticsModern: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [days, setDays] = useState(30);  const { 
    data: chatInsights, 
    isLoading: chatLoading, 
    error: chatError 
  } = useChatInsights(days);
  
  const { 
    data: bookingInsights, 
    isLoading: bookingLoading, 
    error: bookingError 
  } = useBookingInsights();

  const isLoading = chatLoading || bookingLoading;
  const error = chatError || bookingError;

  const exportData = async (type: 'chat' | 'booking', format: 'csv' | 'json') => {
    try {
      // Implementation would depend on your API
      console.log(`Exporting ${type} data as ${format}`);
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  if (isLoading) {
    return <PageLoading message="Loading analytics data..." />;
  }

  if (error) {
    return (
      <PageContainer>
        <ErrorState
          error={error}
          title="Analytics Error"
          fullPage
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="xl">
      {/* Page Title */}
      <Box sx={{ mb: 4 }}>
        <Box display="flex" alignItems="center" gap={2} mb={1}>
          <AnalyticsIcon sx={{ fontSize: '2rem', color: 'primary.main' }} />
          <Typography variant="h4" component="h1" fontWeight="bold">
            Analytics & Insights
          </Typography>
        </Box>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
          Monitor performance metrics and business intelligence
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          <ButtonGroup variant="outlined" size="small">
            {[7, 30, 90].map((period) => (
              <Button
                key={period}
                variant={days === period ? 'contained' : 'outlined'}
                onClick={() => setDays(period)}
              >
                {period} days
              </Button>
            ))}
          </ButtonGroup>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={() => exportData(activeTab === 0 ? 'chat' : 'booking', 'csv')}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* Navigation Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab 
            label="Chat Analytics" 
            icon={<Chat />} 
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
          <Tab 
            label="Booking Analytics" 
            icon={<Hotel />} 
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === 0 && chatInsights && (
        <ChatAnalyticsTab insights={chatInsights} days={days} />
      )}

      {activeTab === 1 && bookingInsights && (
        <BookingAnalyticsTab insights={bookingInsights} days={days} />
      )}
    </PageContainer>
  );
};

AnalyticsModern.displayName = 'AnalyticsModern';
