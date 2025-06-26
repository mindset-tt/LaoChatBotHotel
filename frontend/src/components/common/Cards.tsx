import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  IconButton,
  CardActions,
  Tooltip
} from '@mui/material';
import { MoreVert as MoreVertIcon } from '@mui/icons-material';

export interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  status?: 'success' | 'warning' | 'error' | 'default';
  onClick?: () => void;
  actions?: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  icon,
  title,
  value,
  subtitle,
  trend,
  status,
  onClick,
  actions
}) => (
  <Card 
    sx={{ 
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.2s ease-in-out',
      '&:hover': onClick ? {
        transform: 'translateY(-2px)',
        boxShadow: 4
      } : {}
    }}
    onClick={onClick}
  >
    <CardContent>
      <Box display="flex" alignItems="flex-start" justifyContent="space-between">
        <Box display="flex" alignItems="center" gap={1}>
          {icon}
          <Typography variant="h6" color="text.secondary">
            {title}
          </Typography>
        </Box>
        {actions && (
          <IconButton size="small">
            <MoreVertIcon />
          </IconButton>
        )}
      </Box>
      
      <Box sx={{ mt: 2 }}>
        <Typography variant="h4" fontWeight="bold">
          {value}
        </Typography>
        
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
        
        {trend && (
          <Box display="flex" alignItems="center" gap={1} sx={{ mt: 1 }}>
            <Chip
              label={`${trend.isPositive ? '+' : ''}${trend.value}%`}
              color={trend.isPositive ? 'success' : 'error'}
              size="small"
            />
            <Typography variant="caption" color="text.secondary">
              vs last period
            </Typography>
          </Box>
        )}
        
        {status && (
          <Chip
            label={status}
            color={status as 'success' | 'warning' | 'error' | 'default'}
            size="small"
            sx={{ mt: 1 }}
          />
        )}
      </Box>
    </CardContent>
    
    {actions && (
      <CardActions>
        {actions}
      </CardActions>
    )}
  </Card>
);

export interface StatusCardProps {
  icon: React.ReactNode;
  title: string;
  status: string;
  color: 'success' | 'warning' | 'error' | 'default';
  description?: string;
  lastUpdated?: string;
}

export const StatusCard: React.FC<StatusCardProps> = ({
  icon,
  title,
  status,
  color,
  description,
  lastUpdated
}) => (
  <Card>
    <CardContent>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        {icon}
        <Typography variant="h6">{title}</Typography>
      </Box>
      
      <Chip 
        label={status} 
        color={color} 
        sx={{ mb: 1 }}
      />
      
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {description}
        </Typography>
      )}
      
      {lastUpdated && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Last updated: {lastUpdated}
        </Typography>
      )}
    </CardContent>
  </Card>
);

export interface InfoCardProps {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  elevated?: boolean;
}

export const InfoCard: React.FC<InfoCardProps> = ({
  title,
  children,
  icon,
  action,
  elevated = false
}) => (
  <Card elevation={elevated ? 4 : 1}>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          {icon}
          <Typography variant="h6">{title}</Typography>
        </Box>
        {action}
      </Box>
      {children}
    </CardContent>
  </Card>
);
