import React, { useState, useEffect } from 'react';
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
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  LinearProgress,
  Snackbar
} from '@mui/material';
import axios from 'axios';
import {
  Memory,
  Storage,
  Computer,
  CleaningServices,
  Refresh,
  Assessment,
  Security,
  Backup,
  Notifications
} from '@mui/icons-material';
import {
  useSystemHealth,
  useSystemMetricsDetailed,
  useGpuStatus,
  useModelStatus,
  useModelConfig,
  useModelMemory,
  useSystemCleanup,
  useSystemRestart,
  useReloadModels,
  useModelCleanup,
  useNotifications,
  useBackupStatistics,
  useCreateBackup
} from '../../hooks/api';

interface ModelStatus {
  models_loaded: boolean;
  retriever_loaded: boolean;
  generator_loaded: boolean;
  tokenizer_loaded: boolean;
  rag_chunks_count: number;
  device: string;
}

interface SystemMetrics {
  cpu_percent: number;
  memory_usage: {
    percent: number;
    available_gb: number;
    total_gb: number;
  };
  disk_usage: {
    percent: number;
    free_gb: number;
    total_gb: number;
  };
  gpu_memory?: {
    allocated_gb: number;
    reserved_gb: number;
  };
}

interface SystemHealth {
  status: string;
  database: string;
  models: string;
  uptime_seconds: number;
}

export const SystemManagement: React.FC = () => {
  const [modelStatus, setModelStatus] = useState<ModelStatus | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const API_BASE_URL = 'http://localhost:8000';

  useEffect(() => {
    fetchSystemData();
    const interval = setInterval(fetchSystemData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchSystemData = async () => {
    try {
      setLoading(true);
      const [modelResponse, metricsResponse, healthResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/models/status/`),
        axios.get(`${API_BASE_URL}/system/metrics/`),
        axios.get(`${API_BASE_URL}/system/health/`)
      ]);

      setModelStatus(modelResponse.data);
      setSystemMetrics(metricsResponse.data);
      setSystemHealth(healthResponse.data);
      setError(null);
    } catch (err) {
      setError('Failed to load system data');
      console.error('System data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCleanupMemory = async () => {
    try {
      setActionLoading('cleanup');
      await axios.post(`${API_BASE_URL}/models/cleanup/`);
      await fetchSystemData();
    } catch (err) {
      setError('Failed to cleanup GPU memory');
      console.error('Cleanup error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReloadModels = async () => {
    if (window.confirm('Reloading models will take several minutes. Continue?')) {
      try {
        setActionLoading('reload');
        await axios.post(`${API_BASE_URL}/models/reload/`);
        await fetchSystemData();
      } catch (err) {
        setError('Failed to reload models');
        console.error('Reload error:', err);
      } finally {
        setActionLoading(null);
      }
    }
  };

  const getStatusColor = (status: string | boolean) => {
    if (typeof status === 'boolean') {
      return status ? 'success' : 'error';
    }
    switch (status) {
      case 'healthy':
      case 'loaded':
        return 'success';
      case 'degraded':
        return 'warning';
      default:
        return 'error';
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getProgressColor = (percent: number) => {
    if (percent < 70) return 'success';
    if (percent < 90) return 'warning';
    return 'error';
  };

  if (loading && !systemHealth) {
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
      <Typography variant="h4" gutterBottom>
        🖥️ System Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}

      <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="System Health" icon={<Assessment />} />
        <Tab label="AI Models" icon={<Memory />} />
        <Tab label="Performance" icon={<Computer />} />
      </Tabs>

      {/* System Health Tab */}
      {activeTab === 0 && systemHealth && (
        <Box>
          <Box 
            display="flex" 
            flexWrap="wrap" 
            gap={3} 
            mb={4}
          >
            <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(25% - 12px)' } }}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Assessment color="primary" />
                    <Typography variant="h6">Overall Status</Typography>
                  </Box>
                  <Chip 
                    label={systemHealth.status} 
                    color={getStatusColor(systemHealth.status)}
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(25% - 12px)' } }}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Storage color="primary" />
                    <Typography variant="h6">Database</Typography>
                  </Box>
                  <Chip 
                    label={systemHealth.database} 
                    color={getStatusColor(systemHealth.database === 'healthy')}
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(25% - 12px)' } }}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Memory color="primary" />
                    <Typography variant="h6">AI Models</Typography>
                  </Box>
                  <Chip 
                    label={systemHealth.models} 
                    color={getStatusColor(systemHealth.models === 'loaded')}
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(25% - 12px)' } }}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Computer color="primary" />
                    <Typography variant="h6">Uptime</Typography>
                  </Box>
                  <Typography variant="h6" sx={{ mt: 1 }}>
                    {formatUptime(systemHealth.uptime_seconds)}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </Box>
      )}

      {/* AI Models Tab */}
      {activeTab === 1 && modelStatus && (
        <Box>
          <Box 
            display="flex" 
            flexWrap="wrap" 
            gap={3} 
            mb={4}
          >
            <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(16.67% - 12px)' } }}>
              <Card>
                <CardContent>
                  <Typography variant="h6">Models Loaded</Typography>
                  <Chip 
                    label={modelStatus.models_loaded ? 'Yes' : 'No'} 
                    color={getStatusColor(modelStatus.models_loaded)}
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(16.67% - 12px)' } }}>
              <Card>
                <CardContent>
                  <Typography variant="h6">Retriever</Typography>
                  <Chip 
                    label={modelStatus.retriever_loaded ? 'Loaded' : 'Not Loaded'} 
                    color={getStatusColor(modelStatus.retriever_loaded)}
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(16.67% - 12px)' } }}>
              <Card>
                <CardContent>
                  <Typography variant="h6">Generator</Typography>
                  <Chip 
                    label={modelStatus.generator_loaded ? 'Loaded' : 'Not Loaded'} 
                    color={getStatusColor(modelStatus.generator_loaded)}
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(16.67% - 12px)' } }}>
              <Card>
                <CardContent>
                  <Typography variant="h6">Tokenizer</Typography>
                  <Chip 
                    label={modelStatus.tokenizer_loaded ? 'Loaded' : 'Not Loaded'} 
                    color={getStatusColor(modelStatus.tokenizer_loaded)}
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(16.67% - 12px)' } }}>
              <Card>
                <CardContent>
                  <Typography variant="h6">RAG Chunks</Typography>
                  <Typography variant="h4" sx={{ mt: 1 }}>
                    {modelStatus.rag_chunks_count}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(16.67% - 12px)' } }}>
              <Card>
                <CardContent>
                  <Typography variant="h6">Device</Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {modelStatus.device || 'Unknown'}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Model Actions</Typography>
            <Box display="flex" gap={2}>
              <Button
                variant="contained"
                startIcon={<CleaningServices />}
                onClick={handleCleanupMemory}
                disabled={actionLoading === 'cleanup'}
              >
                {actionLoading === 'cleanup' ? 'Cleaning...' : 'Cleanup GPU Memory'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={handleReloadModels}
                disabled={actionLoading === 'reload'}
              >
                {actionLoading === 'reload' ? 'Reloading...' : 'Reload Models'}
              </Button>
            </Box>
          </Paper>
        </Box>
      )}

      {/* Performance Tab */}
      {activeTab === 2 && systemMetrics && (
        <Box>
          <Box 
            display="flex" 
            flexWrap="wrap" 
            gap={3} 
            mb={4}
          >
            <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(33.33% - 12px)' } }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>CPU Usage</Typography>
                  <Box display="flex" alignItems="center" gap={2}>
                    <LinearProgress 
                      variant="determinate" 
                      value={systemMetrics.cpu_percent}
                      color={getProgressColor(systemMetrics.cpu_percent)}
                      sx={{ flexGrow: 1, height: 8 }}
                    />
                    <Typography>{systemMetrics.cpu_percent.toFixed(1)}%</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(33.33% - 12px)' } }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Memory Usage</Typography>
                  <Box display="flex" alignItems="center" gap={2}>
                    <LinearProgress 
                      variant="determinate" 
                      value={systemMetrics.memory_usage.percent}
                      color={getProgressColor(systemMetrics.memory_usage.percent)}
                      sx={{ flexGrow: 1, height: 8 }}
                    />
                    <Typography>{systemMetrics.memory_usage.percent.toFixed(1)}%</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {systemMetrics.memory_usage.available_gb.toFixed(1)}GB / {systemMetrics.memory_usage.total_gb.toFixed(1)}GB
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(33.33% - 12px)' } }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Disk Usage</Typography>
                  <Box display="flex" alignItems="center" gap={2}>
                    <LinearProgress 
                      variant="determinate" 
                      value={systemMetrics.disk_usage.percent}
                      color={getProgressColor(systemMetrics.disk_usage.percent)}
                      sx={{ flexGrow: 1, height: 8 }}
                    />
                    <Typography>{systemMetrics.disk_usage.percent.toFixed(1)}%</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {systemMetrics.disk_usage.free_gb.toFixed(1)}GB free / {systemMetrics.disk_usage.total_gb.toFixed(1)}GB total
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>

          {systemMetrics.gpu_memory && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>GPU Memory</Typography>
              <Box 
                display="flex" 
                flexWrap="wrap" 
                gap={3}
              >
                <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(50% - 12px)' } }}>
                  <Typography variant="body2" color="text.secondary">Allocated</Typography>
                  <Typography variant="h4">
                    {systemMetrics.gpu_memory.allocated_gb.toFixed(2)}GB
                  </Typography>
                </Box>
                <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(50% - 12px)' } }}>
                  <Typography variant="body2" color="text.secondary">Reserved</Typography>
                  <Typography variant="h4">
                    {systemMetrics.gpu_memory.reserved_gb.toFixed(2)}GB
                  </Typography>
                </Box>
              </Box>
            </Paper>
          )}
        </Box>
      )}
    </Container>
  );
};
