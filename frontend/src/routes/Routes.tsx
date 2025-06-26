import React, { Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { MainLayout } from "../layouts/main-layout/MainLayout";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { PublicRoute } from "../components/PublicRoute";
import { PageLoadingFallback } from "../components/common/LoadingStates";
import { ROUTES, USER_ROLES } from "../constants";

/**
 * Application Route Definitions
 * 
 * Organized route structure with:
 * - Public routes (accessible when not authenticated)
 * - Protected routes (require authentication and specific roles)
 * - Lazy loading for better performance
 * - Consistent loading states
 */

// Lazy load all page components for better performance and code splitting
const PageDetailChats = React.lazy(() => 
  import("../pages/detail-chats/PageDetailChats").then(m => ({ default: m.PageDetailChats }))
);

const PageNewChatsOptimized = React.lazy(() => 
  import("../pages/new-chats/PageNewChatsModern").then(m => ({ default: m.PageNewChatsModern }))
);

const Login = React.lazy(() => 
  import("../pages/login/Login").then(m => ({ default: m.Login }))
);

const Room = React.lazy(() => 
  import("../pages/hotel/room/Room").then(m => ({ default: m.Room }))
);

const Dashboard = React.lazy(() => 
  import("../pages/dashboard/Dashboard").then(m => ({ default: m.Dashboard }))
);

const Bookings = React.lazy(() => 
  import("../pages/bookings/Bookings").then(m => ({ default: m.Bookings }))
);

const Analytics = React.lazy(() => 
  import("../pages/analytics/Analytics").then(m => ({ default: m.Analytics }))
);

const SystemManagement = React.lazy(() => 
  import("../pages/system/SystemManagement").then(m => ({ default: m.SystemManagement }))
);

/**
 * Route Management Component
 * 
 * Defines the application routing structure with proper organization:
 * 1. Public routes (login) - accessible when not authenticated
 * 2. Chat routes - accessible to all users
 * 3. Protected routes - require authentication and specific roles
 */
export const RoutesManagement = () => {
  return (
    <Routes>
      {/* Public routes - only accessible when not authenticated */}
      <Route path={ROUTES.LOGIN} element={
        <PublicRoute>
          <Suspense fallback={<PageLoadingFallback />}>
            <Login />
          </Suspense>
        </PublicRoute>
      } />
      
      {/* All other routes use MainLayout for consistent navigation */}
      <Route element={<MainLayout />}>
        {/* Default redirect to chat */}
        <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.CHATS} replace />} />
        
        {/* Chat routes - accessible to everyone with navbar */}
        <Route path={ROUTES.CHATS} element={
          <Suspense fallback={<PageLoadingFallback />}>
            <PageNewChatsOptimized />
          </Suspense>
        } />
        <Route path={ROUTES.CHAT_DETAIL} element={
          <Suspense fallback={<PageLoadingFallback />}>
            <PageNewChatsOptimized />
          </Suspense>
        } />
        
        {/* Protected routes - require authentication and proper role */}
        {/* Dashboard - requires user role or higher */}
        <Route path={ROUTES.DASHBOARD} element={
          <ProtectedRoute requiredRole={USER_ROLES.USER}>
            <Suspense fallback={<PageLoadingFallback />}>
              <Dashboard />
            </Suspense>
          </ProtectedRoute>
        } />
        
        {/* Rooms - requires user role or higher */}
        <Route path={ROUTES.ROOMS} element={
          <ProtectedRoute requiredRole={USER_ROLES.USER}>
            <Suspense fallback={<PageLoadingFallback />}>
              <Room />
            </Suspense>
          </ProtectedRoute>
        } />
        
        {/* Bookings - requires user role or higher */}
        <Route path={ROUTES.BOOKINGS} element={
          <ProtectedRoute requiredRole={USER_ROLES.USER}>
            <Suspense fallback={<PageLoadingFallback />}>
              <Bookings />
            </Suspense>
          </ProtectedRoute>
        } />
        
        {/* Analytics - requires admin role */}
        <Route path={ROUTES.ANALYTICS} element={
          <ProtectedRoute requiredRole={USER_ROLES.ADMIN}>
            <Suspense fallback={<PageLoadingFallback />}>
              <Analytics />
            </Suspense>
          </ProtectedRoute>
        } />
        
        {/* System Management - requires admin role */}
        <Route path={ROUTES.SYSTEM} element={
          <ProtectedRoute requiredRole={USER_ROLES.ADMIN}>
            <Suspense fallback={<PageLoadingFallback />}>
              <SystemManagement />
            </Suspense>
          </ProtectedRoute>
        } />
        
        {/* Chat detail view for authenticated users */}
        <Route path={ROUTES.CHAT_DETAILS} element={
          <ProtectedRoute requiredRole={USER_ROLES.USER}>
            <Suspense fallback={<PageLoadingFallback />}>
              <PageDetailChats />
            </Suspense>
          </ProtectedRoute>
        } />
      </Route>
      
      {/* Catch all route - redirect to home */}
      <Route path="*" element={<Navigate to={ROUTES.CHATS} replace />} />
    </Routes>
  );
};
