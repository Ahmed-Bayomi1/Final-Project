import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../Component/Navbar";

export default function MainLayout() {
  return (
    <>
      <Navbar />
      <div className="page-content">
        <Outlet />
      </div>
    </>
  );
}
