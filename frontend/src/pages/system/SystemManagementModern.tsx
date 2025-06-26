import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Alert,
  Paper
} from '@mui/material';
import {
  Memory,
  Storage,
  Computer,
  CleaningServices,
  Refresh,
  Assessment,
  Security,
  Backup,
  Settings as SettingsIcon,
  Build,
  Speed
} from '@mui/icons-material';
import {
  useSystemHealth,
  useSystemMetricsDetailed,
  useModelStatus,
  useSystemCleanup,
  useSystemRestart,
  useReloadModels,
  useModelCleanup,
  useNotifications,
  useBackupStatistics,
  useCreateBackup
} from '../../hooks/api';
import {
  PageContainer,
  MetricCard,
  StatusCard,
  InfoCard,
  PageLoading,
  ErrorState
} from '../../components/common';
import { 
  formatUptime, 
  formatBytes, 
  formatPercentage,
  getStatusColor
} from '../../utils';

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

// System overview tab
const SystemOverviewTab: React.FC<{
  health: any;
  metrics: SystemMetrics | null;
}> = ({ health, metrics }) => {
  const systemCards = [
    {
      icon: <Assessment color="primary" />,
      title: 'System Status',
      status: health?.status || 'Unknown',
      color: getStatusColor(health?.status || ''),
      description: `Uptime: ${health ? formatUptime(health.uptime_seconds) : 'Unknown'}`
    },
    {
      icon: <Storage color="primary" />,
      title: 'Database',
      status: health?.database || 'Unknown',
      color: getStatusColor(health?.database || ''),
      description: 'Database connection status'
    },
    {
      icon: <Memory color="primary" />,
      title: 'AI Models',
      status: health?.models || 'Unknown',
      color: getStatusColor(health?.models || ''),
      description: 'Machine learning models status'
    }
  ];
  const performanceMetrics = metrics ? [
    {
      icon: <Computer color="primary" />,
      title: 'CPU Usage',
      value: formatPercentage(metrics?.cpu_percent),
      subtitle: 'Current utilization'
    },
    {
      icon: <Memory color="info" />,
      title: 'Memory Usage',
      value: formatPercentage(metrics?.memory_usage?.percent),
      subtitle: `${formatBytes((metrics?.memory_usage?.available_gb || 0) * 1024 * 1024 * 1024)} available`
    },
    {
      icon: <Storage color="warning" />,
      title: 'Disk Usage',
      value: formatPercentage(metrics?.disk_usage?.percent),
      subtitle: `${formatBytes((metrics?.disk_usage?.free_gb || 0) * 1024 * 1024 * 1024)} free`
    }
  ] : [];

  return (
    <Box>
      {/* System Status */}
      <Box sx={{ display: 'grid', gap: 3, mb: 4, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        {systemCards.map((card, index) => (
          <StatusCard
            key={index}
            {...card}
          />
        ))}
      </Box>

      {/* Performance Metrics */}
      {metrics && (
        <InfoCard title="Performance Metrics" icon={<Speed color="primary" />}>
          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            {performanceMetrics.map((metric, index) => (
              <Box key={index} display="flex" alignItems="center" gap={2}>
                {metric.icon}
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {metric.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {metric.subtitle}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
            {/* Progress bars for better visualization */}
          <Box sx={{ mt: 3 }}>
            <Box sx={{ mb: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="body2">CPU Usage</Typography>
                <Typography variant="body2">{formatPercentage(metrics?.cpu_percent)}</Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={metrics?.cpu_percent || 0} 
                color={(metrics?.cpu_percent || 0) > 80 ? 'error' : (metrics?.cpu_percent || 0) > 60 ? 'warning' : 'primary'}
              />
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="body2">Memory Usage</Typography>
                <Typography variant="body2">{formatPercentage(metrics?.memory_usage?.percent)}</Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={metrics?.memory_usage?.percent || 0} 
                color={(metrics?.memory_usage?.percent || 0) > 80 ? 'error' : (metrics?.memory_usage?.percent || 0) > 60 ? 'warning' : 'success'}
              />
            </Box>
            
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="body2">Disk Usage</Typography>
                <Typography variant="body2">{formatPercentage(metrics?.disk_usage?.percent)}</Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={metrics?.disk_usage?.percent || 0} 
                color={(metrics?.disk_usage?.percent || 0) > 80 ? 'error' : (metrics?.disk_usage?.percent || 0) > 60 ? 'warning' : 'info'}
              />
            </Box>
          </Box>
        </InfoCard>
      )}
    </Box>
  );
};

// AI Models tab
const AIModelsTab: React.FC<{
  modelStatus: ModelStatus | null;
  onReloadModels: () => void;
  onModelCleanup: () => void;
  isLoading: boolean;
}> = ({ modelStatus, onReloadModels, onModelCleanup, isLoading }) => {
  const modelComponents = modelStatus ? [
    { name: 'Models System', status: modelStatus.models_loaded, description: 'Overall model system status' },
    { name: 'Retriever Model', status: modelStatus.retriever_loaded, description: 'Document retrieval model' },
    { name: 'Generator Model', status: modelStatus.generator_loaded, description: 'Text generation model' },
    { name: 'Tokenizer', status: modelStatus.tokenizer_loaded, description: 'Text tokenization system' }
  ] : [];

  return (
    <Box>
      <Box display="flex" gap={2} mb={3}>
        <Button
          variant="contained"
          startIcon={<Refresh />}
          onClick={onReloadModels}
          disabled={isLoading}
        >
          Reload Models
        </Button>
        <Button
          variant="outlined"
          startIcon={<CleaningServices />}
          onClick={onModelCleanup}
          disabled={isLoading}
        >
          Clean Memory
        </Button>
      </Box>

      {modelStatus && (
        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
          <InfoCard title="Model Components" icon={<Memory color="primary" />}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Component</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {modelComponents.map((component, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {component.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {component.description}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={component.status ? 'Loaded' : 'Not Loaded'}
                          color={component.status ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </InfoCard>

          <InfoCard title="Model Information" icon={<Assessment color="primary" />}>
            <Box sx={{ py: 2 }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h4" color="primary.main">
                  {modelStatus.rag_chunks_count?.toLocaleString() || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Knowledge base chunks
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight="medium">
                  Compute Device
                </Typography>
                <Chip 
                  label={modelStatus.device || 'Unknown'} 
                  color="info" 
                  size="small"
                  sx={{ mt: 0.5 }}
                />
              </Box>
            </Box>
          </InfoCard>
        </Box>
      )}
    </Box>
  );
};

// System actions tab
const SystemActionsTab: React.FC<{
  onSystemRestart: () => void;
  onSystemCleanup: () => void;
  onCreateBackup: () => void;
  isLoading: boolean;
}> = ({ onSystemRestart, onSystemCleanup, onCreateBackup, isLoading }) => {
  return (
    <Box>
      <Alert severity="warning" sx={{ mb: 3 }}>
        System actions may temporarily affect service availability. Use with caution.
      </Alert>

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' } }}>
        <InfoCard title="System Maintenance" icon={<Build color="primary" />}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Perform system cleanup and restart operations
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<CleaningServices />}
              onClick={onSystemCleanup}
              disabled={isLoading}
              fullWidth
            >
              System Cleanup
            </Button>
            <Button
              variant="outlined"
              color="warning"
              startIcon={<Refresh />}
              onClick={onSystemRestart}
              disabled={isLoading}
              fullWidth
            >
              Restart System
            </Button>
          </Box>
        </InfoCard>

        <InfoCard title="Data Management" icon={<Backup color="primary" />}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Create backups and manage system data
          </Typography>
          <Button
            variant="contained"
            startIcon={<Backup />}
            onClick={onCreateBackup}
            disabled={isLoading}
            fullWidth
          >
            Create Backup
          </Button>
        </InfoCard>

        <InfoCard title="Security" icon={<Security color="primary" />}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Security and access management
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Security />}
            disabled
            fullWidth
          >
            Security Settings
          </Button>
        </InfoCard>
      </Box>
    </Box>
  );
};

export const SystemManagementModern: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // API hooks
  const { data: systemHealth, isLoading: healthLoading } = useSystemHealth();
  const { data: systemMetrics, isLoading: metricsLoading } = useSystemMetricsDetailed();
  const { data: modelStatus, isLoading: modelLoading } = useModelStatus();
  
  const systemCleanupMutation = useSystemCleanup();
  const systemRestartMutation = useSystemRestart();
  const reloadModelsMutation = useReloadModels();
  const modelCleanupMutation = useModelCleanup();
  const createBackupMutation = useCreateBackup();

  const isLoading = healthLoading || metricsLoading || modelLoading;
  const isActionLoading = Boolean(actionLoading);

  const handleAction = async (action: string, mutation: any) => {
    setActionLoading(action);
    try {
      await mutation.mutateAsync();
    } catch (error) {
      console.error(`${action} failed:`, error);
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return <PageLoading message="Loading system information..." />;
  }

  return (
    <PageContainer maxWidth="xl">
      {/* Page Title */}
      <Box sx={{ mb: 4 }}>
        <Box display="flex" alignItems="center" gap={2} mb={1}>
          <SettingsIcon sx={{ fontSize: '2rem', color: 'primary.main' }} />
          <Typography variant="h4" component="h1" fontWeight="bold">
            System Management
          </Typography>
        </Box>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
          Monitor and manage system health, performance, and operations
        </Typography>
      </Box>

      {/* Navigation Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab 
            label="System Overview" 
            icon={<Assessment />} 
            iconPosition="start"
          />
          <Tab 
            label="AI Models" 
            icon={<Memory />} 
            iconPosition="start"
          />
          <Tab 
            label="System Actions" 
            icon={<Build />} 
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && (
        <SystemOverviewTab 
          health={systemHealth} 
          metrics={systemMetrics} 
        />
      )}

      {activeTab === 1 && (
        <AIModelsTab
          modelStatus={modelStatus}
          onReloadModels={() => handleAction('reload models', reloadModelsMutation)}
          onModelCleanup={() => handleAction('model cleanup', modelCleanupMutation)}
          isLoading={isActionLoading}
        />
      )}

      {activeTab === 2 && (
        <SystemActionsTab
          onSystemRestart={() => handleAction('system restart', systemRestartMutation)}
          onSystemCleanup={() => handleAction('system cleanup', systemCleanupMutation)}
          onCreateBackup={() => handleAction('create backup', createBackupMutation)}
          isLoading={isActionLoading}
        />
      )}
    </PageContainer>
  );
};

SystemManagementModern.displayName = 'SystemManagementModern';
