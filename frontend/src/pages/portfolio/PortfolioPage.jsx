import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import PortfolioSidebar from "../../Layout/PortfolioSidebar";
import PortfolioExport from "../../components/portfolio/PortfolioExport";
import PortfolioHistory from "../../components/portfolio/PortfolioHistory";

export default function PortfolioPage() {
  return (
    <div className="relative flex">
      <PortfolioSidebar />
      <div className="flex-1 pl-[164px]">
          <Routes>
            <Route path="/" element={<PortfolioExport />} />
            <Route path="/history" element={<PortfolioHistory />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
  );
}
