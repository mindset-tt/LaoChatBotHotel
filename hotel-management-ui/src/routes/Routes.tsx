import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { MainLayout } from "../layouts/main-layout/MainLayout";
import { PageDetailChats } from "../pages/detail-chats/PageDetailChats";
import { PageNewChats } from "../pages/new-chats/PageNewChats";
import { Login } from "../pages/login/Login";
import { Room } from "../pages/hotel/room/Room";

export const RoutesManagement = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="*" element={<Navigate to="/chats" />} />
        <Route path="/chats" element={<PageNewChats />} />
        <Route path="/chats/:id" element={<PageNewChats />} />
        <Route path="/login" element={<Login />} />
        <Route path="/rooms" element={<Room />} />
      </Route>
    </Routes>
  );
};
