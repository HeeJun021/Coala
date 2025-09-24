import React, { useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, ChevronRight } from "lucide-react";

const PortfolioSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const sections = useMemo(
    () => [
      {
        key: "portfolio",
        title: "포트폴리오",
        items: [
          { label: "포트폴리오 추출", to: "/portfolio", exact: true },
          { label: "포트폴리오 추출 내역", to: "/portfolio/history", exact: true },
        ],
      },
    ],
    []
  );

  const sectionForPath = useMemo(() => {
    for (const s of sections) {
      if (s.items.some((i) => currentPath.startsWith(i.to))) return s.key;
    }
    return null;
  }, [sections, currentPath]);

  const [openSection, setOpenSection] = useState(sectionForPath);

  useEffect(() => {
    setOpenSection(sectionForPath);
  }, [sectionForPath]);

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
      {/* 헤더 */}
      <div className="h-[56px] flex items-center px-6 bg-[#88C078] rounded-t-2xl shadow-sm">
        <h1 className="text-[18px] font-semibold text-black tracking-wide">
          포트폴리오
        </h1>
      </div>

      {/* 섹션 */}
      <div className="divide-y divide-gray-100">
        {sections.map((section) => {
          const isOpen = openSection === section.key;
          return (
            <div key={section.key}>
              <button
                type="button"
                onClick={() =>
                  setOpenSection((prev) => (prev === section.key ? null : section.key))
                }
                className={`w-full px-6 py-4 flex items-center justify-between text-left cursor-pointer text-[16px] font-semibold transition-all duration-150 ${
                  isOpen
                    ? "bg-[#D9D9D9] text-gray-800"
                    : "hover:bg-gray-100 text-gray-600"
                }`}
              >
                <span>{section.title}</span>
                {isOpen ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>

              <div
                className={`transition-all duration-500 ease-in-out overflow-hidden origin-top ${
                  isOpen
                    ? "max-h-[600px] opacity-100 scale-y-100"
                    : "max-h-0 opacity-0 scale-y-95"
                }`}
                style={{ pointerEvents: isOpen ? "auto" : "none" }}
              >
                <ul className="py-2">
                  {section.items.map((item) => (
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
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};

export default PortfolioSidebar;
