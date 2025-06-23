import React from "react";
import { Outlet } from "react-router-dom";
import "./MainLayout.css";
import { Footer } from "../footer/Footer";
import { Navbar } from "../navbar/Navbar";
// import { Sidebar } from "../sidebar/Sidebar";

export const MainLayout = () => {
  return (
    <main>
      <Navbar />
      <Outlet />
      <Footer />
    </main>
  );
};
