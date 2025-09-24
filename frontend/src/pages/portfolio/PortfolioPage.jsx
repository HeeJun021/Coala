import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import PortfolioSidebar from "../../Layout/PortfolioSidebar";
import PortfolioExport from "../../components/portfolio/PortfolioExport";
import PortfolioHistory from "../../components/portfolio/PortfolioHistory";

export default function PortfolioPage() {
  return (
    <div className="relative flex">
      <PortfolioSidebar />
      <div className="w-full max-w-7xl mx-auto pt-8 mt-8 p-7">
  <Routes>
    <Route path="/" element={<PortfolioExport />} />
    <Route path="/history" element={<PortfolioHistory />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
</div>

      </div>
  );
}
