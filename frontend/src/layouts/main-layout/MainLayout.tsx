import React from "react";
import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";
import "./MainLayout.css";
import { Footer } from "../footer/Footer";
import { Navbar } from "../navbar/Navbar";

/**
 * Main Layout Component
 * 
 * Provides the overall application layout with:
 * - Fixed navbar at the top
 * - Main content area that fills remaining space
 * - Footer at the bottom
 * - Proper viewport height management
 */
export const MainLayout = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        overflow: 'hidden',
      }}
    >
      {/* Fixed Navbar */}
      <Box sx={{ flexShrink: 0 }}>
        <Navbar />
      </Box>
      
      {/* Main Content Area - takes remaining space */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <Outlet />
      </Box>
      
      {/* Fixed Footer */}
      <Box sx={{ flexShrink: 0 }}>
        <Footer />
      </Box>
    </Box>
  );
};
