import React, { useState } from "react";
import {
  FaBars,
  FaFileAlt,
  FaGithub,
  FaSave,
  FaCog,
} from "react-icons/fa";
import SelfCodingMenuPanel from "./SelfCodingMenuPanel";
import SelfCodingSettingsPanel from "./SelfCodingSettingsPanel";

const icons = [
  { name: "menu", icon: <FaBars />, tooltip: "메뉴" },
  { name: "explorer", icon: <FaFileAlt />, tooltip: "파일 탐색기" },
  { name: "git", icon: <FaGithub />, tooltip: "Git 연동" },
  { name: "save", icon: <FaSave />, tooltip: "파일 저장" },
];

const SelfCodingSidebar = ({ activePanel, setActivePanel }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="w-12 bg-[#f3f3f3] text-black flex flex-col items-center py-2 border-r border-gray-300">
      {icons.map((item) => (
        <button
          key={item.name}
          title={item.tooltip}
          onClick={() => {
            if (item.name === "menu") {
              setShowMenu((prev) => !prev);
              setShowSettings(false);
            } else if (item.name === "explorer" || item.name === "git" || item.name === "save") {
              setActivePanel(item.name);
              setShowMenu(false);
              setShowSettings(false);
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
        onClick={() => {
          setShowSettings((prev) => !prev);
          setShowMenu(false);
        }}
      >
        <FaCog />
      </div>
      {showMenu && <SelfCodingMenuPanel onClose={() => setShowMenu(false)} />}
      {showSettings && <SelfCodingSettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  );
};

export default SelfCodingSidebar;