// src/layout/PortfolioSidebar.jsx
import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const PortfolioSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const items = useMemo(
    () => [
      { label: "포트폴리오 추출", to: "/portfolio", exact: true },
      { label: "포트폴리오 추출 내역", to: "/portfolio/history", exact: true },
    ],
    []
  );

  const isActive = (item) => {
    if (item.exact) return currentPath === item.to;
    return currentPath === item.to || currentPath.startsWith(item.to + "/");
  };

  const handleItemClick = (to) => {
    if (currentPath !== to) navigate(to);
  };

  return (
    <aside
      className="absolute left-[70px] w-[260px] bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden z-40"
      style={{ top: "120px" }}
    >
      {/* 제목 */}
      <div className="h-[56px] flex items-center px-6 bg-[#88C078] rounded-t-2xl shadow-sm">
        <h1 className="text-[18px] font-semibold text-black tracking-wide">
          포트폴리오
        </h1>
      </div>

      {/* 항목들 */}
      <ul className="py-2">
        {items.map((item) => (
          <li key={item.to}>
            <div
              onClick={() => handleItemClick(item.to)}
              className={`mx-4 my-1 px-3 py-2 rounded-md text-[14px] cursor-pointer transition-all duration-150 ${
                isActive(item)
                  ? "bg-[#D9D9D9] text-gray-800 font-semibold"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {item.label}
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default PortfolioSidebar;
