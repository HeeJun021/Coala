// src/pages/portfolio/PortfolioPage.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import PortfolioExport from "../../components/portfolio/PortfolioExport";
import PortfolioHistory from "../../components/portfolio/PortfolioHistory";

export default function PortfolioPage() {
  return (
    <div className="w-full max-w-6xl mx-auto pt-8 mt-8 bg-white rounded-2xl shadow-xl border border-gray-300 p-7">
      <Routes>
        {/* 기본 진입 시 → 추출 페이지 */}
        <Route path="/" element={<PortfolioExport />} />
        <Route path="/history" element={<PortfolioHistory />} />

        {/* 없는 하위 경로 접근 시 기본 리다이렉트 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
