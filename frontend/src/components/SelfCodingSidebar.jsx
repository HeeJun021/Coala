import React, { useState } from "react";
import {
  FaBars,
  FaFileAlt,
  FaGithub,
  FaSave,
  FaCog,
} from "react-icons/fa";
import SelfCodingSettingsPanel from "./SelfCodingSettingsPanel";
import { saveCodeFile } from "../api/codeApi"; // ✅ DB 저장 함수 추가

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

const EXTENSION_MAP = {
  html: 1,
  css: 2,
  js: 3,
  py: 4,
};

const SelfCodingSidebar = ({
  activePanel,
  setActivePanel,
  tabs,
  activeTabId,
  unsaved,
  handleSave,
  setTabs,
  setActiveTabId,
  rootFolderId,
  reloadFolderTree, // ✅ 전달받음
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [fileMenuVisible, setFileMenuVisible] = useState(false);

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

  const handleFileImport = async () => {
    try {
      const [fileHandle] = await window.showOpenFilePicker({
        types: [
          {
            description: "Code Files",
            accept: {
              "text/html": [".html"],
              "text/css": [".css"],
              "application/javascript": [".js"],
              "text/x-python": [".py"],
            },
          },
        ],
      });

      const file = await fileHandle.getFile();
      const content = await file.text();
      const filename = file.name;
      const ext = filename.split(".").pop().toLowerCase();
      const language_id = EXTENSION_MAP[ext];

      if (!language_id) {
        alert("지원하지 않는 파일 형식입니다.");
        return;
      }

      const newCode = await saveCodeFile({
        title: filename,
        content,
        language_id,
        folder_id: rootFolderId,
      });

      const tabId = `code-${newCode.code_id}`;
      setTabs((prev) => [...prev, { tabId, filename, content }]);
      setActiveTabId(tabId);

      await reloadFolderTree(); // ✅ 가져온 후 트리 갱신

      alert("파일이 성공적으로 업로드되었습니다.");
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("파일 가져오기 실패:", err);
        alert("파일을 가져오는 데 실패했습니다.");
      }
    }
  };

  const handleFileMenuClick = async (action) => {
    const currentTab = tabs.find((tab) => tab.tabId === activeTabId);
    if (!currentTab && action !== "import") return;
    const { filename, content } = currentTab || {};

    switch (action) {
      case "save":
        await handleSave();
        break;
      case "saveAs":
        if (filename && content) {
          if ("showSaveFilePicker" in window) {
            await handleSaveAs(filename, content);
          } else {
            fallbackDownload(filename, content);
          }
        }
        break;
      case "import":
        await handleFileImport();
        break;
      default:
        break;
    }
    setFileMenuVisible(false);
  };

  return (
    <div className="w-12 bg-[#f3f3f3] text-black flex flex-col items-center py-2 border-r border-gray-300 relative">
      {icons.map((item) => (
        <div key={item.name} className="w-full relative">
          <button
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

          {item.name === "menu" && showMenu && (
            <div className="absolute left-12 top-0 bg-white border border-gray-300 rounded shadow z-50 w-32 text-sm">
              <div
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer relative"
                onMouseEnter={() => setFileMenuVisible(true)}
                onMouseLeave={() => setFileMenuVisible(false)}
              >
                File
                {fileMenuVisible && (
                  <div className="absolute left-full top-0 ml-1 w-48 bg-white border border-gray-300 rounded shadow z-50">
                    <div
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleFileMenuClick("save")}
                    >
                      저장하기 (Ctrl+S)
                    </div>
                    <div
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleFileMenuClick("saveAs")}
                    >
                      다른 이름으로 저장하기
                    </div>
                    <div
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleFileMenuClick("import")}
                    >
                      파일 가져오기
                    </div>
                  </div>
                )}
              </div>
              <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Edit</div>
              <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer">View</div>
              <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Run</div>
              <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Help</div>
            </div>
          )}
        </div>
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

      {showSettings && <SelfCodingSettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  );
};

export default SelfCodingSidebar;
