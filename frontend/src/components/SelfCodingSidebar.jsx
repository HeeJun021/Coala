import React, { useRef, useState, useEffect} from "react";
import {
  FaBars,
  FaFileAlt,
  FaGithub,
  FaSave,
  FaCog,
} from "react-icons/fa";

const icons = [
  { name: "menu", icon: <FaBars />, tooltip: "메뉴" },
  { name: "explorer", icon: <FaFileAlt />, tooltip: "파일 탐색기" },
  { name: "git", icon: <FaGithub />, tooltip: "Git 연동" },
  { name: "save", icon: <FaSave />, tooltip: "파일 저장" },
];

const SelfCodingSidebar = ({ activePanel, setActivePanel }) => {
  const [menuDropdownOpen, setMenuDropdownOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuDropdownOpen && menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuDropdownOpen]);
  
  return (
    <div className="w-12 bg-[#f3f3f3] text-black flex flex-col items-center py-2 border-r border-gray-300">
      {menuDropdownOpen && (
        <div
          ref={menuRef}
          className="absolute top-[70px] left-[48px] z-50 bg-white border border-gray-300 shadow-md rounded w-40"
        >
          {["File", "Edit", "View", "Go", "Run", "Terminal", "Help"].map((item) => (
            <div
              key={item}
              className="px-4 py-2 text-sm text-gray-800 hover:bg-gray-100 cursor-pointer"
            >
              {item}
            </div>
          ))}
        </div>
      )}
      {icons.map((item) => (
        <button
          key={item.name}
          title={item.tooltip}
          onClick={() => {
            if (item.name === "menu") {
              setMenuDropdownOpen((prev) => !prev);
            } else {
              setActivePanel(item.name);
              setMenuDropdownOpen(false);
            }
          }}
          className={`w-full h-12 flex items-center justify-center text-[20px] transition-colors duration-150 ${
            activePanel === item.name ? "text-black font-bold" : "text-gray-500 hover:text-black"
          }`}
        >
          {item.icon}
        </button>
      ))}
      <div
        className="mt-auto w-full h-12 flex items-center justify-center text-[20px] text-gray-500 hover:text-black cursor-pointer"
        title="설정"
        onClick={() => setActivePanel("settings")}
      >
        <FaCog />
      </div>
    </div>
  );
};

export default SelfCodingSidebar;