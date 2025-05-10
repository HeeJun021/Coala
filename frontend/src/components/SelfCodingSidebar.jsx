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
  { name: "save", icon: <FaSave />, tooltip: "로컬 저장" },
];

const MIME_TYPES = {
  html: "text/html",
  css: "text/css",
  js: "application/javascript",
  py: "text/x-python",
};

const SelfCodingSidebar = ({
  activePanel,
  setActivePanel,
  tabs,
  activeTabId,
  unsaved,
  handleSave,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleSaveAs = async (filename, content) => {
    try {
      const extension = filename.split(".").pop().toLowerCase();
      const mimeType = MIME_TYPES[extension] || "text/plain";

      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [
          {
            description: "Code File",
            accept: {
              [mimeType]: [`.${extension}`],
            },
          },
        ],
      });

      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();

      alert("파일이 성공적으로 저장되었습니다!");
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("파일 저장 실패:", err);
        alert("파일 저장 중 오류가 발생했습니다.");
      }
    }
  };

  const fallbackDownload = (filename, content) => {
    const extension = filename.split(".").pop().toLowerCase();
    const mimeType = MIME_TYPES[extension] || "text/plain";

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
  };

  const handleLocalDownload = async () => {
    const currentTab = tabs.find((tab) => tab.tabId === activeTabId);
    if (!currentTab) {
      alert("저장할 파일이 없습니다.");
      return;
    }

    const { filename, content } = currentTab;

    if (unsaved) {
      const confirmSave = window.confirm("파일이 저장되지 않았습니다. 먼저 저장하시겠습니까?");
      if (!confirmSave) return;

      try {
        await handleSave();
      } catch (err) {
        alert("서버 저장 실패로 로컬 저장이 취소되었습니다.");
        return;
      }
    }

    if ("showSaveFilePicker" in window) {
      await handleSaveAs(filename, content);
    } else {
      fallbackDownload(filename, content);
    }
  };

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
            } else if (item.name === "save") {
              handleLocalDownload();
            } else {
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
