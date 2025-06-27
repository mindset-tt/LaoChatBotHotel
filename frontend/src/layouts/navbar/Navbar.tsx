import { 
  Box, 
  Typography, 
  Button, 
  AppBar, 
  Toolbar, 
  Menu, 
  MenuItem, 
  IconButton,
  Avatar,
  Chip,
  Divider,
  useTheme,
  alpha
} from "@mui/material";
import { 
  Dashboard, 
  Chat, 
  Hotel, 
  Analytics, 
  Computer, 
  Book, 
  MoreVert,
  Login as LoginIcon,
  Logout as LogoutIcon,
  Person,
  Security
} from "@mui/icons-material";
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import fnsLogo from "../../assets/fns-logo.png";

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { isAuthenticated, user, logout, hasPermission } = useAuth();
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);

  // Navigation items with role-based access control
  const navigationItems = [
    { 
      label: "Dashboard", 
      path: "/dashboard", 
      icon: <Dashboard />, 
      requiredRole: "user" as const
    },
    { 
      label: "Chat", 
      path: "/chats", 
      icon: <Chat />, 
      requiredRole: null // Public access
    },
    { 
      label: "Rooms", 
      path: "/rooms", 
      icon: <Hotel />, 
      requiredRole: "user" as const
    },
    { 
      label: "Bookings", 
      path: "/bookings", 
      icon: <Book />, 
      requiredRole: "user" as const
    },
    { 
      label: "Analytics", 
      path: "/analytics", 
      icon: <Analytics />, 
      requiredRole: "admin" as const
    },
    { 
      label: "System", 
      path: "/system", 
      icon: <Computer />, 
      requiredRole: "admin" as const
    },
    { 
      label: "Refresh Token Demo", 
      path: "/refresh-token-demo", 
      icon: <Security />, 
      requiredRole: "user" as const
    },
  ];

  // Filter navigation items based on user permissions
  const visibleNavigationItems = navigationItems.filter(item => {
    if (!item.requiredRole) return true; // Public access
    return isAuthenticated && hasPermission(item.requiredRole);
  });

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleUserMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    handleMenuClose();
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleLogout = () => {
    logout();
    handleUserMenuClose();
    navigate('/chats');
  };

  const isActive = (path: string) => location.pathname === path;

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return theme.palette.error.main;
      case 'user': return theme.palette.primary.main;
      default: return theme.palette.grey[500];
    }
  };

  return (
    <>
      {/* Header with Logo and Title */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          padding: "16px 24px",
          width: "100%",
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
          borderBottom: `1px solid ${theme.palette.divider}`,
          backdropFilter: 'blur(10px)',
        }}
      >
        <Box
          sx={{ 
            display: "flex", 
            justifyContent: "flex-start", 
            alignItems: "center", 
            gap: 2,
            flex: 1
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>            <Box
              component="img"
              src={fnsLogo} 
              alt="Logo" 
              sx={{ 
                height: '48px', 
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }} 
            />
            <Box>
              <Typography 
                variant="h5" 
                sx={{ 
                  color: theme.palette.text.primary,
                  fontWeight: 700,
                  letterSpacing: '-0.025em'
                }}
              >
                Hotel AI
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: theme.palette.text.secondary,
                  fontWeight: 500
                }}
              >
                Intelligent Assistant
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Center Title */}
        <Box sx={{ flex: 2, textAlign: 'center', px: 2 }}>
          <Typography
            variant="h6"
            sx={{ 
              color: theme.palette.text.primary,
              fontSize: "16px",
              fontWeight: 600,
              mb: 0.5
            }}
          >
            ຫົວຂໍ້ ການພັດທະນາແຊັດບອດສຳລັບໃຫ້ຂໍ້ມູນການບໍລິການຂອງໂຮງແຮມຄອນເຊຍນາ
          </Typography>
          <Typography
            variant="body2"
            sx={{ 
              color: theme.palette.text.secondary,
              fontSize: "14px"
            }}
          >
            Developing a Chatbot for Providing Hotel Consiana Service Information
          </Typography>
        </Box>

        {/* User Section */}
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2 }}>
          {isAuthenticated ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                size="small"
                label={user?.role}
                sx={{
                  backgroundColor: alpha(getRoleColor(user?.role || ''), 0.1),
                  color: getRoleColor(user?.role || ''),
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  fontSize: '0.75rem'
                }}
                icon={<Security sx={{ fontSize: '16px !important' }} />}
              />
              <IconButton
                onClick={handleUserMenuClick}
                sx={{
                  p: 0.5,
                  borderRadius: 2,
                  border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                  }
                }}
              >
                <Avatar 
                  sx={{ 
                    width: 32, 
                    height: 32,
                    bgcolor: theme.palette.primary.main,
                    fontSize: '14px',
                    fontWeight: 600
                  }}
                >
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={userMenuAnchor}
                open={Boolean(userMenuAnchor)}
                onClose={handleUserMenuClose}
                PaperProps={{
                  sx: {
                    borderRadius: 2,
                    minWidth: 200,
                    mt: 1,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                  }
                }}
              >
                <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {user?.username}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {user?.email || 'No email provided'}
                  </Typography>
                </Box>
                <Divider />
                <MenuItem onClick={handleLogout} sx={{ gap: 1, py: 1.5 }}>
                  <LogoutIcon fontSize="small" />
                  <Typography variant="body2">Logout</Typography>
                </MenuItem>
              </Menu>
            </Box>
          ) : (
            // <Button
            //   variant="contained"
            //   startIcon={<LoginIcon />}
            //   onClick={handleLogin}
            //   sx={{
            //     borderRadius: 2,
            //     px: 3,
            //     py: 1,
            //     fontWeight: 600,
            //     textTransform: 'none',
            //     boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            //     '&:hover': {
            //       boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
            //     }
            //   }}
            // >
            //   Login
            // </Button>
            <></>
          )}
        </Box>
      </Box>

      {/* Navigation Bar */}
      <AppBar 
        position="static" 
        sx={{ 
          backgroundColor: theme.palette.background.paper,
          boxShadow: `0 1px 3px ${alpha(theme.palette.common.black, 0.1)}`,
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        <Toolbar sx={{ justifyContent: "center", gap: 1, minHeight: '64px !important' }}>
          {/* Desktop Navigation */}
          <Box sx={{ display: { xs: "none", md: "flex" }, gap: 1 }}>
            {visibleNavigationItems.map((item) => (
              <Button
                key={item.path}
                startIcon={item.icon}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  color: isActive(item.path) ? theme.palette.primary.main : theme.palette.text.primary,
                  backgroundColor: isActive(item.path) 
                    ? alpha(theme.palette.primary.main, 0.1)
                    : "transparent",
                  borderRadius: 2,
                  px: 2,
                  py: 1,
                  fontWeight: isActive(item.path) ? 600 : 500,
                  "&:hover": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    transform: 'translateY(-1px)',
                  },
                  textTransform: "none",
                  fontSize: "14px",
                  transition: 'all 0.2s ease-in-out',
                  border: isActive(item.path) 
                    ? `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
                    : '1px solid transparent',
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>

          {/* Mobile Navigation */}
          <Box sx={{ display: { xs: "flex", md: "none" } }}>
            <IconButton
              onClick={handleMenuClick}
              sx={{ 
                color: theme.palette.text.primary,
                borderRadius: 2,
              }}
            >
              <MoreVert />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              PaperProps={{
                sx: {
                  borderRadius: 2,
                  mt: 1,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                }
              }}
            >
              {visibleNavigationItems.map((item) => (
                <MenuItem
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    backgroundColor: isActive(item.path) 
                      ? alpha(theme.palette.primary.main, 0.1)
                      : "transparent",
                    py: 1.5,
                    px: 2,
                    borderRadius: 1,
                    mx: 1,
                    my: 0.5,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: '100%' }}>
                    {React.cloneElement(item.icon, {
                      sx: { 
                        color: isActive(item.path) 
                          ? theme.palette.primary.main 
                          : theme.palette.text.secondary 
                      }
                    })}
                    <Typography 
                      variant="body2"
                      sx={{ 
                        color: isActive(item.path) 
                          ? theme.palette.primary.main 
                          : theme.palette.text.primary,
                        fontWeight: isActive(item.path) ? 600 : 400
                      }}
                    >
                      {item.label}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
    </>
  );
};
