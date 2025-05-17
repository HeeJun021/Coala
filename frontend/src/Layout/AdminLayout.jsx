import React from "react";
import { Outlet } from "react-router-dom";
import AdminNavbar from "../admin/component/AdminNavbar";

const AdminLayout = () => {
  return (
    <div className="pt-[70px]">
      <AdminNavbar />
      <main className="p-6 bg-gray-100 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
