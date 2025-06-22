import React from "react";
import { Outlet } from "react-router-dom";
import "./MainLayout.css";
// import { Sidebar } from "../sidebar/Sidebar";

export const MainLayout = () => {
  return (
    <main>
      <Outlet />
    </main>
  );
};
