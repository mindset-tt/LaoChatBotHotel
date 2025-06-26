import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Card,
  CardContent,
  Box,
  CircularProgress,
  Alert,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  LinearProgress,
  Grid
} from '@mui/material';
import {
  TrendingUp,
  Chat,
  Hotel,
  Assessment,
  Download,
  Timeline
} from '@mui/icons-material';
import { useChatInsights, useBookingInsights } from '../../hooks/api';

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
  revenue_trends: Array<{
    date: string;
    revenue: number;
    bookings: number;
  }>;
  popular_room_types: Array<{
    room_type: string;
    booking_count: number;
  }>;
  avg_stay_duration: number;
}

export const Analytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [days, setDays] = useState(7);

  const { 
    data: chatInsights, 
    isLoading: chatLoading, 
    error: chatError 
  } = useChatInsights(days);

  const { 
    data: bookingInsights, 
    isLoading: bookingLoading, 
    error: bookingError 
  } = useBookingInsights();

  const loading = chatLoading || bookingLoading;
  const error = chatError || bookingError;

  const exportData = async (type: 'chat' | 'bookings', format: 'json' | 'csv') => {
    try {
      const API_BASE_URL = 'http://localhost:8000';
      const endpoint = type === 'chat' 
        ? `/backup/chat-history/export/?format=${format}`
        : `/backup/bookings/export/?format=${format}`;
      
      // For demo purposes, we'll create a mock export
      const data = type === 'chat' ? chatInsights : bookingInsights;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}_export_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4">
          📊 Analytics & Insights
        </Typography>
        <Box display="flex" gap={1}>
          {[7, 30, 90].map((period) => (
            <Button
              key={period}
              variant={days === period ? 'contained' : 'outlined'}
              onClick={() => setDays(period)}
              size="small"
            >
              {period} days
            </Button>
          ))}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error.message || 'Failed to load analytics data'}</Alert>
      )}

      <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="Chat Analytics" icon={<Chat />} />
        <Tab label="Booking Analytics" icon={<Hotel />} />
        <Tab label="System Performance" icon={<Assessment />} />
      </Tabs>

      {/* Chat Analytics Tab */}
      {activeTab === 0 && chatInsights && (
        <Box>
          <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
            <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Chat color="primary" />
                    <Typography variant="h6">Total Sessions</Typography>
                  </Box>
                  <Typography variant="h3">{chatInsights?.total_sessions || 0}</Typography>
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Timeline color="success" />
                    <Typography variant="h6">Avg Session Duration</Typography>
                  </Box>
                  <Typography variant="h3">
                    {Math.round(chatInsights?.avg_session_duration || 0)}m
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1}>
                    <TrendingUp color="info" />
                    <Typography variant="h6">Avg Messages/Session</Typography>
                  </Box>
                  <Typography variant="h3">
                    {Math.round(chatInsights?.avg_messages_per_session || 0)}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Download color="warning" />
                    <Typography variant="h6">Export Data</Typography>
                  </Box>
                  <Box display="flex" gap={1} mt={1}>
                    <Button size="small" onClick={() => exportData('chat', 'csv')}>
                      CSV
                    </Button>
                    <Button size="small" onClick={() => exportData('chat', 'json')}>
                      JSON
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Box>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Daily Message Activity</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Total Messages</TableCell>
                    <TableCell align="right">User Messages</TableCell>
                    <TableCell align="right">Bot Messages</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(chatInsights?.daily_stats || []).map((stat) => (
                    <TableRow key={stat.date}>
                      <TableCell>{stat.date}</TableCell>
                      <TableCell align="right">{stat.total_messages}</TableCell>
                      <TableCell align="right">{stat.user_messages}</TableCell>
                      <TableCell align="right">{stat.bot_messages}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Peak Hours</Typography>
            <Box>
              {(chatInsights?.peak_hours || []).map((hour) => {
                const maxMessages = Math.max(...(chatInsights?.peak_hours || []).map(h => h.message_count), 1);
                return (
                  <Box key={hour.hour} display="flex" alignItems="center" gap={2} mb={1}>
                    <Typography sx={{ minWidth: 60 }}>
                      {hour.hour}:00
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={(hour.message_count / maxMessages) * 100}
                      sx={{ flexGrow: 1, height: 8 }}
                    />
                    <Typography sx={{ minWidth: 40 }}>
                      {hour.message_count}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Paper>
        </Box>
      )}

      {/* Booking Analytics Tab */}
      {activeTab === 1 && bookingInsights && (
        <Box>
          <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
            <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Hotel color="primary" />
                    <Typography variant="h6">Occupancy Rate</Typography>
                  </Box>
                  <Typography variant="h3">
                    {Math.round(bookingInsights?.occupancy_rate || 0)}%
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Timeline color="success" />
                    <Typography variant="h6">Avg Stay Duration</Typography>
                  </Box>
                  <Typography variant="h3">
                    {Math.round(bookingInsights?.avg_stay_duration || 0)} days
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1}>
                    <TrendingUp color="info" />
                    <Typography variant="h6">Total Revenue</Typography>
                  </Box>
                  <Typography variant="h3">
                    ${(bookingInsights?.revenue_trends || []).reduce((sum, r) => sum + r.revenue, 0).toFixed(0)}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Download color="warning" />
                    <Typography variant="h6">Export Data</Typography>
                  </Box>
                  <Box display="flex" gap={1} mt={1}>
                    <Button size="small" onClick={() => exportData('bookings', 'csv')}>
                      CSV
                    </Button>
                    <Button size="small" onClick={() => exportData('bookings', 'json')}>
                      JSON
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Box>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Revenue Trends</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                    <TableCell align="right">Bookings</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(bookingInsights?.revenue_trends || []).map((trend) => (
                    <TableRow key={trend.date}>
                      <TableCell>{trend.date}</TableCell>
                      <TableCell align="right">${trend.revenue}</TableCell>
                      <TableCell align="right">{trend.bookings}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Popular Room Types</Typography>
            <Box>
              {(bookingInsights?.popular_room_types || []).map((room) => {
                const maxBookings = Math.max(...(bookingInsights?.popular_room_types || []).map(r => r.booking_count), 1);
                return (
                  <Box key={room.room_type} display="flex" alignItems="center" gap={2} mb={1}>
                    <Typography sx={{ minWidth: 120 }}>
                      {room.room_type}
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={(room.booking_count / maxBookings) * 100}
                      sx={{ flexGrow: 1, height: 8 }}
                    />
                    <Typography sx={{ minWidth: 40 }}>
                      {room.booking_count}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Paper>
        </Box>
      )}

      {/* System Performance Tab */}
      {activeTab === 2 && (
        <Box>
          <Alert severity="info" sx={{ mb: 3 }}>
            System performance metrics can be viewed in the main dashboard or through system health endpoints.
          </Alert>
          
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <Box sx={{ flex: '1 1 400px', minWidth: '350px' }}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Quick Actions</Typography>
                <Box display="flex" flexDirection="column" gap={2}>
                  <Button variant="outlined" onClick={() => window.open('http://localhost:8000/system/health/', '_blank')}>
                    View System Health
                  </Button>
                  <Button variant="outlined" onClick={() => window.open('http://localhost:8000/system/metrics/', '_blank')}>
                    View System Metrics
                  </Button>
                  <Button variant="outlined" onClick={() => window.open('http://localhost:8000/models/status/', '_blank')}>
                    View Model Status
                  </Button>
                </Box>
              </Paper>
            </Box>
            
            <Box sx={{ flex: '1 1 400px', minWidth: '350px' }}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>API Documentation</Typography>
                <Box display="flex" flexDirection="column" gap={2}>
                  <Button variant="outlined" onClick={() => window.open('http://localhost:8000/docs', '_blank')}>
                    Open API Docs (Swagger)
                  </Button>
                  <Button variant="outlined" onClick={() => window.open('http://localhost:8000/redoc', '_blank')}>
                    Open ReDoc
                  </Button>
                </Box>
              </Paper>
            </Box>
          </Box>
        </Box>
      )}
    </Container>
  );
};
