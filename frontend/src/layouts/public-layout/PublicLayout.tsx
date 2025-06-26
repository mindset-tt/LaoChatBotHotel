import React from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "../navbar/Navbar";

/**
 * Public layout for pages that should be accessible to both
 * authenticated and unauthenticated users, with navigation bar
 */
export const PublicLayout = () => {
  return (
    <main>
      <Navbar />
      <Outlet />
    </main>
  );
};
