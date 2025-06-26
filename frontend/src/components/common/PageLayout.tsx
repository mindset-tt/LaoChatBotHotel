import React from 'react';
import {
  Box,
  Typography,
  Breadcrumbs,
  Link,
  Button,
  Container
} from '@mui/material';
import { 
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon 
} from '@mui/icons-material';
import { Link as RouterLink, useLocation } from 'react-router-dom';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Array<{
    label: string;
    href?: string;
  }>;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  actions,
  icon
}) => {
  const location = useLocation();
  
  // Auto-generate breadcrumbs if not provided
  const autoBreadcrumbs = React.useMemo(() => {
    if (breadcrumbs) return breadcrumbs;
    
    const pathSegments = location.pathname.split('/').filter(Boolean);
    return [
      { label: 'Home', href: '/' },
      ...pathSegments.map((segment, index) => ({
        label: segment.charAt(0).toUpperCase() + segment.slice(1).replace('-', ' '),
        href: index === pathSegments.length - 1 ? undefined : `/${pathSegments.slice(0, index + 1).join('/')}`
      }))
    ];
  }, [breadcrumbs, location.pathname]);

  return (
    <Box sx={{ mb: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs 
        separator={<NavigateNextIcon fontSize="small" />}
        sx={{ mb: 2 }}
      >
        {autoBreadcrumbs.map((crumb, index) => (
          crumb.href ? (
            <Link
              key={index}
              component={RouterLink}
              to={crumb.href}
              color="inherit"
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              {index === 0 && <HomeIcon sx={{ mr: 0.5, fontSize: '1rem' }} />}
              {crumb.label}
            </Link>
          ) : (
            <Typography key={index} color="text.primary">
              {crumb.label}
            </Typography>
          )
        ))}
      </Breadcrumbs>

      {/* Title and Actions */}
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems="flex-start"
        flexWrap="wrap"
        gap={2}
      >
        <Box display="flex" alignItems="center" gap={2}>
          {icon}
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="h6" color="text.secondary" sx={{ mt: 0.5 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
        
        {actions && (
          <Box display="flex" gap={1} flexWrap="wrap">
            {actions}
          </Box>
        )}
      </Box>
    </Box>
  );
};

// Simplified page container with consistent layout
export const PageContainer: React.FC<{
  children: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
}> = ({ 
  children, 
  maxWidth = 'lg' 
}) => (
  <Container maxWidth={maxWidth} sx={{ mt: 4, mb: 4 }}>
    {children}
  </Container>
);
