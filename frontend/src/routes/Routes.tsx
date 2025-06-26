import React, { Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { CircularProgress, Box } from "@mui/material";
import { MainLayout } from "../layouts/main-layout/MainLayout";

// Lazy load all components for better performance
const PageDetailChats = React.lazy(() => import("../pages/detail-chats/PageDetailChats").then(m => ({ default: m.PageDetailChats })));
const PageNewChatsOptimized = React.lazy(() => import("../pages/new-chats/PageNewChats").then(m => ({ default: m.PageNewChats })));
const Login = React.lazy(() => import("../pages/login/Login").then(m => ({ default: m.Login })));
const Room = React.lazy(() => import("../pages/hotel/room/Room").then(m => ({ default: m.Room })));
const Dashboard = React.lazy(() => import("../pages/dashboard/Dashboard").then(m => ({ default: m.Dashboard })));
const Bookings = React.lazy(() => import("../pages/bookings/Bookings").then(m => ({ default: m.Bookings })));
const Analytics = React.lazy(() => import("../pages/analytics/Analytics").then(m => ({ default: m.Analytics })));
const SystemManagement = React.lazy(() => import("../pages/system/SystemManagement").then(m => ({ default: m.SystemManagement })));

// Loading component
const PageLoader = React.memo(() => (
  <Box 
    display="flex" 
    justifyContent="center" 
    alignItems="center" 
    minHeight="400px"
  >
    <CircularProgress />
  </Box>
));

export const RoutesManagement = () => {
  return (
    <Routes>
      <Route path="/login" element={
        <Suspense fallback={<PageLoader />}>
          <Login />
        </Suspense>
      } />
      <Route element={<MainLayout />}>
        <Route path="*" element={<Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={
          <Suspense fallback={<PageLoader />}>
            <Dashboard />
          </Suspense>
        } />
        <Route path="/chats" element={
          <Suspense fallback={<PageLoader />}>
            <PageNewChatsOptimized />
          </Suspense>
        } />
        <Route path="/chats/:id" element={
          <Suspense fallback={<PageLoader />}>
            <PageNewChatsOptimized />
          </Suspense>
        } />
        <Route path="/rooms" element={
          <Suspense fallback={<PageLoader />}>
            <Room />
          </Suspense>
        } />
        <Route path="/bookings" element={
          <Suspense fallback={<PageLoader />}>
            <Bookings />
          </Suspense>
        } />
        <Route path="/analytics" element={
          <Suspense fallback={<PageLoader />}>
            <Analytics />
          </Suspense>
        } />
        <Route path="/system" element={
          <Suspense fallback={<PageLoader />}>
            <SystemManagement />
          </Suspense>
        } />
      </Route>
    </Routes>
  );
};
