import { Box, Typography, Button, AppBar, Toolbar, Menu, MenuItem, IconButton } from "@mui/material";
import { Dashboard, Chat, Hotel, Analytics, Computer, Book, MoreVert } from "@mui/icons-material";
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import fnsLogo from "../../assets/fns-logo.png"; // Adjust the path as necessary

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const navigationItems = [
    { label: "Dashboard", path: "/dashboard", icon: <Dashboard /> },
    { label: "Chat", path: "/chats", icon: <Chat /> },
    { label: "Rooms", path: "/rooms", icon: <Hotel /> },
    { label: "Bookings", path: "/bookings", icon: <Book /> },
    { label: "Analytics", path: "/analytics", icon: <Analytics /> },
    { label: "System", path: "/system", icon: <Computer /> },
  ];

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    handleMenuClose();
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Header with Logo and Title */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          padding: "10px 20px",
          width: "100%",
          borderBottom: "1px solid #e0e0e0"
        }}
      >
        <Box
          width={"30%"}
          sx={{ display: "flex", justifyContent: "flex-start", alignItems: "center", gap: 1 }}
        >
          <img src={fnsLogo} alt="Logo" height={"40px"} />
          <Typography variant="h6" sx={{ color: "#414040" }}>Hotel AI</Typography>
        </Box>
        <Box width={"70%"}>
          <Typography
            variant="h6"
            sx={{ textAlign: "center", color: "#414040", fontSize: "14px" }}
          >
            ຫົວຂໍ້ ການພັດທະນາແຊັດບອດສຳລັບໃຫ້ຂໍ້ມູນການບໍລິການຂອງໂຮງແຮມຄອນເຊຍນາ
          </Typography>
          <Typography
            variant="body2"
            sx={{ textAlign: "center", color: "#414040" }}
          >
            Developing a Chatbot for Providing Hotel Consiana Service Information
          </Typography>
        </Box>
      </Box>

      {/* Navigation Bar */}
      <AppBar position="static" sx={{ backgroundColor: "#f5f5f5", boxShadow: "none" }}>
        <Toolbar sx={{ justifyContent: "center", gap: 1 }}>
          {/* Desktop Navigation */}
          <Box sx={{ display: { xs: "none", md: "flex" }, gap: 1 }}>
            {navigationItems.map((item) => (
              <Button
                key={item.path}
                startIcon={item.icon}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  color: isActive(item.path) ? "#1976d2" : "#666",
                  backgroundColor: isActive(item.path) ? "#e3f2fd" : "transparent",
                  "&:hover": {
                    backgroundColor: "#e3f2fd",
                  },
                  textTransform: "none",
                  fontSize: "14px",
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
              sx={{ color: "#666" }}
            >
              <MoreVert />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              {navigationItems.map((item) => (
                <MenuItem
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    backgroundColor: isActive(item.path) ? "#e3f2fd" : "transparent",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {item.icon}
                    {item.label}
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
