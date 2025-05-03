// 1. import 및 설정
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../Layout/Navbar";
import apiClient from "../api/apiClient";
import "../index.css";
import {
  FaBars,
  FaFileAlt,
  FaGithub,
  FaSave,
  FaCog,
  FaFolder,
  FaFile,
  FaChevronRight,
  FaChevronDown,
  FaPlusCircle,
  FaTimes,
} from "react-icons/fa";
import Split from "react-split";
import { debounce } from "lodash"; // lodash 설치 필요: npm install lodash
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { python } from "@codemirror/lang-python";


const getLanguageExtension = (filename) => {
  if (filename.endsWith(".js") || filename.endsWith(".jsx")) return javascript();
  if (filename.endsWith(".html")) return html();
  if (filename.endsWith(".css")) return css();
  if (filename.endsWith(".py")) return python();
  return [];
};

const icons = [
  { name: "menu", icon: <FaBars />, tooltip: "메뉴" },
  { name: "explorer", icon: <FaFileAlt />, tooltip: "파일 탐색기" },
  { name: "git", icon: <FaGithub />, tooltip: "Git 연동" },
  { name: "save", icon: <FaSave />, tooltip: "파일 저장" },
];

// ✅ 문단 2: 템플릿 설명 및 파일 구조 정의
const templateDescriptions = {
  vanilla: { emoji: "🌐", label: "기본 HTML/CSS/JS 정적 웹 템플릿입니다." },
  react: { emoji: "⚛️", label: "React 기반의 컴포넌트 기반 UI 템플릿입니다." },
  vue: { emoji: "🖖", label: "Vue.js 프레임워크로 구성된 프론트엔드 템플릿입니다." },
  next: { emoji: "⏭️", label: "Next.js 기반의 SSR/정적 사이트 템플릿입니다." },
  fastapi: { emoji: "🚀", label: "FastAPI를 이용한 경량 Python 웹 서버 템플릿입니다." },
  flask: { emoji: "🍶", label: "Flask 기반의 간단한 Python 웹 서버 템플릿입니다." },
};

const templateFiles = {
  react: {
    public: {
      "index.html": `<!DOCTYPE html><html><body><div id='root'></div></body></html>`,
    },
    src: {
      "App.jsx": `function App() {
  return <h1>Hello Vite + React!</h1>;
}
export default App;`,
      "main.jsx": `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
ReactDOM.createRoot(document.getElementById('root')).render(<App />);`,
    },
    "package.json": `{
  "name": "vite-react",
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}`,
    "vite.config.js": `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()] });`,
  },
  vanilla: {
    "index.html": `<!DOCTYPE html>
<html>
  <head><title>Vanilla</title><link rel="stylesheet" href="style.css"></head>
  <body><h1>Hello Vanilla</h1><script src="script.js"></script></body>
</html>`,
    "style.css": `body { font-family: sans-serif; }`,
    "script.js": `console.log('Hello Vanilla!');`,
  },
  vue: {
    public: {
      "index.html": `<!DOCTYPE html><html><body><div id="app"></div></body></html>`,
    },
    src: {
      "App.vue": `<template><h1>Hello Vue</h1></template>`,
      "main.js": `import { createApp } from 'vue';
import App from './App.vue';
createApp(App).mount('#app');`,
    },
    "package.json": `{
  "name": "vite-vue",
  "dependencies": { "vue": "^3.0.0" }
}`,
  },
  next: {
    pages: {
      "index.js": `export default function Home() {
  return <h1>Hello from Next.js</h1>;
}`,
    },
    "package.json": `{
  "name": "next-app",
  "dependencies": {
    "next": "13.x",
    "react": "18.x",
    "react-dom": "18.x"
  }
}`,
    "next.config.js": `module.exports = { reactStrictMode: true };`,
  },
  fastapi: {
    "main.py": `from fastapi import FastAPI
app = FastAPI()

@app.get("/")
def read_root():
    return {"Hello": "World"}`,
    "requirements.txt": `fastapi\nuvicorn`,
  },
  flask: {
    "app.py": `from flask import Flask
app = Flask(__name__)

@app.route("/")
def hello():
    return "Hello Flask!"`,
    "requirements.txt": `flask`,
  },
};

// ✅ 문단 3: 컴포넌트 시작 및 상태 정의
const SelfCodingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activePanel, setActivePanel] = useState("explorer");
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [folders, setFolders] = useState({ "내 파일": {} });
  const [tabs, setTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [templateId, setTemplateId] = useState(null);
  const [showTemplateInfo, setShowTemplateInfo] = useState(false);
  const [showFileTree, setShowFileTree] = useState(true);
  const [previewSrcDoc, setPreviewSrcDoc] = useState("");
  const [selectedFilename, setSelectedFilename] = useState("");
  const [selectedFileContent, setSelectedFileContent] = useState("");
  const [previewTabs, setPreviewTabs] = useState([]);
  const [activePreviewTab, setActivePreviewTab] = useState(null);
  const folderIndexRef = useRef(1);
  const [menuDropdownOpen, setMenuDropdownOpen] = useState(false);
  const [isGithubConnected] = useState(false); // GitHub 연동 여부
  const [creatingItem, setCreatingItem] = useState(null); // { type: "file" | "folder", parentPath: "내 파일/1" }
  const [newItemName, setNewItemName] = useState("");
  const [contextMenu, setContextMenu] = useState({ targetId: null });
  const [renamingItem, setRenamingItem] = useState(null);
  const renamingInputRef = useRef(null);

  // ✅ ResizeObserver 루프 방지용 editor layout 처리
  const editorRef = useRef(null);

  // 디바운스된 layout 함수
  const debouncedLayout = debounce(() => {
    if (editorRef.current) {
      editorRef.current.layout();
    }
  }, 100);

  const handleSplitDragEnd = () => {
    console.log("Split drag end triggered");
    if (editorRef.current) {
      requestAnimationFrame(() => {
        console.log("Calling editor layout");
        debouncedLayout();
      });
    }
  };

  const menuRef = useRef(null);

useEffect(() => {
  const handleClickOutside = (e) => {
    if (creatingItem) {
      const inputEl = document.getElementById("new-item-input");
      if (inputEl && !inputEl.contains(e.target)) {
        setCreatingItem(null);
        setNewItemName("");
      }
    }
  };

  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, [creatingItem]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      const menuEl = document.getElementById("context-menu");
      if (menuVisible && menuEl && !menuEl.contains(e.target)) {
        setMenuVisible(false);
      }
    };
  
    window.addEventListener("mousedown", handleOutsideClick);
    return () => window.removeEventListener("mousedown", handleOutsideClick);
  }, [menuVisible]);  

  useEffect(() => {
    const handleClickOutsideRename = (e) => {
      if (renamingItem) {
        if (renamingInputRef.current && !renamingInputRef.current.contains(e.target)) {
          setRenamingItem(null);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutsideRename);
    return () => document.removeEventListener("mousedown", handleClickOutsideRename);
  }, [renamingItem]);


  const addTemplateFolder = (newTemplate) => {
    const nextIndex = folderIndexRef.current.toString();
    folderIndexRef.current += 1;
  
    setFolders((prev) => ({
      ...prev,
      "내 파일": {
        ...prev["내 파일"],
        [nextIndex]: newTemplate,
      },
    }));
  };

  // ✅ 문단 4: 템플릿 로딩 및 프리뷰 설정
  useEffect(() => {
    const id = location.state?.templateId;
    if (!id) return;
  
    // ✅ 이미 템플릿을 한 번 로딩한 적 있다면 더 이상 실행 안 함
    if (templateId === id) return;
  
    if (templateFiles[id]) {
      const newTemplate = templateFiles[id];
  
      let htmlCode = newTemplate["index.html"] || newTemplate["public"]?.["index.html"] || "";
      let jsCode = newTemplate["script.js"] || "";
      let cssCode = newTemplate["style.css"] || "";
  
      let fullHtml = "";
      addTemplateFolder(newTemplate);
  
      if (id === "react" || id === "vue" || id === "next") {
        fullHtml = ""; // SPA는 프리뷰 제공 안함
      } else {
        fullHtml = htmlCode.includes("<html")
          ? htmlCode
              .replace("</head>", `<style>${cssCode}</style></head>`)
              .replace("</body>", `<script>${jsCode}</script></body>`)
          : `
            <!DOCTYPE html>
            <html>
              <head><style>${cssCode}</style></head>
              <body>
                ${htmlCode}
                <script>${jsCode}</script>
              </body>
            </html>
          `;
      }
  
      setPreviewSrcDoc(fullHtml);
      setTemplateId(id);
    }
  }, [location.state, templateId]);  

  // ✅ 문단 5: ContextMenu 컴포넌트 및 핸들러
  const handleContextMenu = (e) => {
    e.preventDefault();
    setMenuVisible(false);
    setTimeout(() => {
      setMenuPosition({ x: e.pageX + 4, y: e.pageY + 6 });
      setMenuVisible(true);
    }, 0);
  };

  const ContextMenu = ({ position }) => {
    const handleClick = (label) => {
      if (!contextMenu?.targetId) {
        alert("폴더 안에서만 작업할 수 있습니다.");
        return;
      }
    
      if (label === "새 파일" || label === "새 폴더") {
        setCreatingItem({
          type: label === "새 파일" ? "file" : "folder",
          parentPath: contextMenu.targetId,
        });
        setNewItemName("");
    
        setExpandedFolders((prev) => ({
          ...prev,
          [contextMenu.targetId]: true,
        }));
      }
    
      if (label === "이름 바꾸기") {
        const parts = contextMenu.targetId.split("/");
        const name = parts[parts.length - 1];
        setRenamingItem({ path: contextMenu.targetId, name });
      }
      if (label === "경로 복사") {
        if (navigator.clipboard && contextMenu?.targetId) {
          navigator.clipboard.writeText(contextMenu.targetId)
            .then(() => {
              alert("경로가 클립보드에 복사되었습니다.");
            })
            .catch(() => {
              alert("클립보드 복사에 실패했습니다.");
            });
        }
      }
      
      if (label === "삭제") {
        const confirmDelete = window.confirm("정말 삭제하시겠습니까?");
        if (confirmDelete) {
          const parts = contextMenu.targetId.split("/");
          const nameToDelete = parts.pop();
          const parentPath = parts;
    
          const newTree = JSON.parse(JSON.stringify(folders));
          let pointer = newTree;
          for (const part of parentPath) {
            pointer = pointer[part];
          }
    
          delete pointer[nameToDelete];
          setFolders(newTree);
        }
      }
    
      setMenuVisible(false);
    };
    
  
    return (
      <ul
        id="context-menu"
        className="fixed z-50 w-40 bg-white text-gray-800 border border-gray-200 rounded shadow-lg py-1 text-sm"
        style={{ top: position.y, left: position.x }}
      >
        {/* 파일 작업 */}
        <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => handleClick("새 파일")}>새 파일</li>
        <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => handleClick("새 폴더")}>새 폴더</li>
  
        <hr className="my-1 border-t border-gray-200" />
  
        {/* 공유 및 복사 */}
        <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => handleClick("공유")}>공유</li>
        <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => handleClick("복사")}>복사</li>
        <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => handleClick("경로 복사")}>경로 복사</li>
  
        <hr className="my-1 border-t border-gray-200" />
  
        {/* 기타 */}
        <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => handleClick("이름 바꾸기")}>이름 바꾸기</li>
        <li className="px-4 py-2 text-red-600 hover:text-red-700 hover:bg-gray-100 cursor-pointer" onClick={() => handleClick("삭제")}>삭제</li>
      </ul>
    );
  };

  const renderTree = (node, path = []) => {
    return Object.entries(node).map(([key, value]) => {
      const currentPath = [...path, key].join("/");
      const isExpanded = expandedFolders[currentPath];
      const isFolder = typeof value === "object";

      const isRenaming = renamingItem?.path === currentPath;

      return (
        <div key={currentPath} className="pl-4">
          <div
            className="flex items-center cursor-pointer hover:underline"
            onClick={() => {
              if (isFolder) {
                setExpandedFolders((prev) => ({
                  ...prev,
                  [currentPath]: !isExpanded,
                }));
              } else {
                if (!tabs.includes(currentPath)) {
                  setTabs((prev) => [...prev, currentPath]);
                }
                setActiveTab(currentPath);
                setSelectedFilename(currentPath);
                setSelectedFileContent(value);

                const folderPath = path.slice(0, 2).join("/");
                if (!previewTabs.includes(folderPath)) {
                  setPreviewTabs((prev) => [...prev, folderPath]);
                }
                setActivePreviewTab(folderPath);
              }
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              setMenuPosition({ x: e.pageX + 4, y: e.pageY + 6 });
              setContextMenu({ targetId: currentPath });
              setMenuVisible(true);
            }}
          >
            {isFolder ? (
              <FaFolder className="mr-1 text-yellow-600" />
            ) : (
              <FaFile className="mr-1 text-gray-500" />
            )}
            {isRenaming ? (
              <input
                autoFocus
                value={renamingItem.name}
                onChange={(e) => setRenamingItem((prev) => ({ ...prev, name: e.target.value }))}
                onBlur={() => setRenamingItem(null)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const newName = renamingItem.name.trim();
                    if (!newName) {
                      alert("이름을 입력하세요.");
                      return;
                    }
                    if (!isFolder && !newName.includes(".")) {
                      alert("파일 이름에는 확장자를 포함해야 합니다. 예: index.js");
                      return;
                    }
                    const parts = currentPath.split("/");
                    const parentPath = parts.slice(0, -1);
                    const oldKey = parts[parts.length - 1];

                    let cursor = folders;
                    for (let i = 0; i < parentPath.length; i++) {
                      cursor = cursor[parentPath[i]];
                    }

                    if (cursor[newName]) {
                      alert("같은 폴더 내에 같은 이름이 이미 존재합니다.");
                      return;
                    }

                    const updatedFolders = JSON.parse(JSON.stringify(folders));
                    let target = updatedFolders;
                    for (let i = 0; i < parentPath.length; i++) {
                      target = target[parentPath[i]];
                    }
                    const data = target[oldKey];
                    delete target[oldKey];
                    target[newName] = data;

                    setFolders(updatedFolders);
                    setRenamingItem(null);
                  }
                  if (e.key === "Escape") {
                    setRenamingItem(null);
                  }
                }}
                className="text-sm border px-2 py-1 w-40"
              />
            ) : (
              <span className="text-sm">{key}</span>
            )}
          </div>

          {isFolder && isExpanded && (
            <div className="ml-2">
              {renderTree(value, [...path, key])}
              {creatingItem && creatingItem.parentPath === currentPath && (
                <div className="flex items-center mt-1">
                  <input
                    id="new-item-input"
                    autoFocus
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    onBlur={() => {
                      setCreatingItem(null);
                      setNewItemName("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const name = newItemName.trim();
                        if (!name) {
                          alert("이름을 입력하세요.");
                          return;
                        }
                        if (creatingItem.type === "file" && !name.includes(".")) {
                          alert("파일 이름에는 확장자를 포함해야 합니다. 예: index.js");
                          return;
                        }

                        const parts = creatingItem.parentPath.split("/");
                        let cursor = folders;
                        for (const part of parts) {
                          cursor = cursor[part];
                        }
                        if (cursor[name]) {
                          alert("같은 폴더 내에 같은 이름이 이미 존재합니다.");
                          return;
                        }

                        const expandedUpdate = {};
                        for (let i = 1; i <= parts.length; i++) {
                          const subPath = parts.slice(0, i).join("/");
                          expandedUpdate[subPath] = true;
                        }
                        setExpandedFolders((prev) => ({
                          ...prev,
                          ...expandedUpdate,
                        }));

                        setFolders((prev) => {
                          const pathParts = creatingItem.parentPath.split("/");
                          const newTree = { ...prev };
                          let pointer = newTree;
                          for (const part of pathParts) {
                            pointer = pointer[part];
                          }
                          pointer[name] = creatingItem.type === "folder" ? {} : "";
                          return newTree;
                        });

                        setCreatingItem(null);
                        setNewItemName("");
                      } else if (e.key === "Escape") {
                        setCreatingItem(null);
                        setNewItemName("");
                      }
                    }}
                    className="text-sm border px-2 py-1 w-40"
                    placeholder={`새 ${creatingItem.type === "file" ? "파일" : "폴더"}`}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      );
    });
  };

  const GithubConnectGuide = () => (
    <div>
      <h2 className="text-lg font-semibold mb-2">🔗 GitHub 연동 안내</h2>
      <p className="text-sm text-gray-700 mb-4">
        자율 코딩 프로젝트를 GitHub 원격 저장소에 연동하여 공유하거나 업로드할 수 있습니다.<br />
        아직 GitHub 계정과 연동되어 있지 않습니다. 아래 버튼을 눌러 연동을 진행해 주세요.
      </p>
      <button
        onClick={() => window.location.href = "http://localhost:8000/auth/social/github/login"}
        className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition"
      >
        GitHub 계정 연동하기
      </button>
    </div>
  );
  
  // ✅ GitHub 저장소 목록 컴포넌트
  const GithubRepoList = () => {
    const [repos, setRepos] = useState([]);
  
    useEffect(() => {
      const fetchRepos = async () => {
        const res = await apiClient.get("/freecode/github/repos");
        setRepos(res.data);
      };
      fetchRepos();
    }, []);
  
    return (
      <div>
        <h2 className="text-lg font-semibold mb-4">📂 내 GitHub 저장소</h2>
        {repos.length === 0 ? (
          <p className="text-sm text-gray-500">저장소가 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {repos.map((repo) => (
              <li key={repo.id} className="p-3 bg-gray-100 rounded hover:bg-gray-200 transition">
                <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600">
                  {repo.full_name}
                </a>
                <p className="text-sm text-gray-600">{repo.description || "설명 없음"}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  // ✅ 문단 7: 템플릿 정보 렌더링
  const renderTemplateInfo = () => {
    if (!templateId) return null;
    const { emoji, label } = templateDescriptions[templateId] || {};
    return (
      <div className="mb-2">
        <div
          className="text-[13px] font-medium text-gray-600 flex items-center cursor-pointer mb-1"
          onClick={() => setShowTemplateInfo((prev) => !prev)}
        >
          {showTemplateInfo ? (
            <FaChevronDown className="mr-1 text-gray-500" />
          ) : (
            <FaChevronRight className="mr-1 text-gray-500" />
          )}
          Template Info
        </div>
        {showTemplateInfo && (
          <div className="text-xs text-gray-700 leading-relaxed ml-5 border-l pl-3 border-gray-300">
            <span className="mr-1">{emoji}</span>
            <span className="font-semibold">{templateId?.toUpperCase()}</span>: {label}
          </div>
        )}
      </div>
    );
  };

  // ✅ 문단 8: 패널 렌더링
  

  const renderLeftPanelContent = () => {
    if (activePanel === "explorer") {
      return (
        <>
          <div
            className="text-sm text-green-700 font-medium flex items-center gap-2 cursor-pointer mb-4 hover:underline"
            onClick={() => navigate("/self-coding/templates")}
          >
            <FaPlusCircle className="text-green-600" /> 템플릿 새로 만들기
          </div>
          {renderTemplateInfo()}
          <div
            className="text-[13px] font-medium text-gray-600 flex items-center cursor-pointer mb-1"
            onClick={() => setShowFileTree((prev) => !prev)}
          >
            {showFileTree ? (
              <FaChevronDown className="mr-1 text-gray-500" />
            ) : (
              <FaChevronRight className="mr-1 text-gray-500" />
            )}
            파일 구조
          </div>
          {showFileTree && (
            <div
              className="text-xs text-gray-700 whitespace-pre-wrap"
              onContextMenu={handleContextMenu}
            >
              {renderTree(folders)}
            </div>
          )}
        </>
      );
    }
  
    if (activePanel === "git") {
      return isGithubConnected ? <GithubRepoList /> : <GithubConnectGuide />;
    }
  
    if (activePanel === "save") {
      return <div className="text-sm text-gray-600">💾 저장 기능 준비 중...</div>;
    }
  
    if (activePanel === "settings") {
      return <div className="text-sm text-gray-600">⚙️ 설정 기능 준비 중...</div>;
    }
  
    return null;
  };
  
  // ✅ 문단 10: 최종 렌더링
  return (
    <div className="h-screen w-screen overflow-hidden">
      <Navbar />
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
      <div className="flex" style={{ height: "calc(100vh - 70px)" }}>
        {/* 사이드바 */}
        <div className="w-12 bg-[#f3f3f3] text-black flex flex-col items-center py-2 border-r border-gray-300">
        {icons.map((item) => (
  <button
    key={item.name}
    title={item.tooltip}
    onClick={() => {
      if (item.name === "menu") {
        setMenuDropdownOpen((prev) => !prev);
      } else {
        setActivePanel(item.name);
        setMenuDropdownOpen(false); // 다른 아이콘 누르면 드롭다운 닫힘
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

        {/* 렌더링 패널 */}
        <div
  className="w-64 bg-[#f3f3f3] border-r border-gray-300 p-4 overflow-auto"
>
  {renderLeftPanelContent()}
</div>

        {/* 좌우 분할 영역 */}
        <div className="flex-1 overflow-hidden" style={{ width: "100%", height: "100%" }}>
          <Split
            className="flex h-full"
            minSize={200}
            gutterSize={8}
            gutterClassName="gutter"
            snapOffset={20}
            onDragEnd={handleSplitDragEnd}
          >
            {/* 코드 에디터 영역 */}
            <div style={{ width: "100%", height: "100%" }}>
              {tabs.length > 0 ? (
                <div className="flex flex-col w-full h-full bg-white border-r border-gray-200">
                  {/* 코드 탭 */}
                  <div className="flex items-center overflow-x-auto bg-[#f3f3f3] border-b border-gray-300 px-2 py-1">
                    {tabs.map((tab) => {
                      const fileName = tab.split("/").pop();
                      const emoji = templateDescriptions[templateId]?.emoji || "📄";
                      const isActive = tab === activeTab;
                      return (
                        <div
                          key={tab}
                          className={`flex items-center px-3 py-1 mr-1 rounded-t-md text-sm font-medium border cursor-pointer ${
                            isActive
                              ? "bg-white text-black border-t border-l border-r border-gray-300"
                              : "bg-[#e0e0e0] text-gray-600 hover:bg-[#d5d5d5] border border-transparent"
                          }`}
                          onClick={() => {
                            setActiveTab(tab);
                            setSelectedFilename(tab);
                            const parts = tab.split("/");
                            let content = folders;
                            for (const p of parts) content = content[p];
                            setSelectedFileContent(content);
                          }}
                        >
                          <span className="mr-2">{emoji}</span>
                          <span>{fileName}</span>
                          <FaTimes
                            className="ml-2 text-xs hover:text-red-500"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTabs((prev) => prev.filter((t) => t !== tab));
                              if (activeTab === tab) {
                                const nextTab = tabs.find((t) => t !== tab);
                                setActiveTab(nextTab || "");
                                setSelectedFilename(nextTab || "");
                                if (nextTab) {
                                  const parts = nextTab.split("/");
                                  let content = folders;
                                  for (const p of parts) content = content[p];
                                  setSelectedFileContent(content);
                                } else {
                                  setSelectedFileContent("");
                                }
                              }
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  {/* 경로 표시 */}
                  <div className="px-4 py-1 text-xs text-gray-500 border-b border-gray-200 bg-white font-mono">
                    {selectedFilename || "파일을 선택하세요"}
                  </div>
                  {/* 코드 에디터 */}
                  <div className="flex-1 p-4 overflow-auto">
                  <CodeMirror
  value={selectedFileContent}
  height="100%"
  theme="light"
  extensions={[getLanguageExtension(selectedFilename)]}
  onChange={(value) => setSelectedFileContent(value)}
  basicSetup={{
    lineNumbers: true,
  }}
  style={{
    fontFamily: "'Fira Code', 'JetBrains Mono', Menlo, Monaco, Consolas, 'Courier New', monospace",
    fontSize: '14px',
    lineHeight: '1.5',
  }}
/>
                  </div>
                </div>
              ) : (
                <div />
              )}
            </div>

            {/* 프리뷰 영역 */}
            <div style={{ width: "100%", height: "100%" }}>
              {previewTabs.length > 0 ? (
                <div className="flex flex-col w-full h-full bg-white">
                  {/* 프리뷰 탭 */}
                  <div className="flex items-center overflow-x-auto bg-[#f3f3f3] border-b border-gray-300 px-2 py-1">
                    {previewTabs.map((tab) => {
                      const label = tab.split("/").slice(-1)[0];
                      const emoji = templateDescriptions[templateId]?.emoji || "📁";
                      const isActive = tab === activePreviewTab;
                      return (
                        <div
                          key={tab}
                          className={`flex items-center px-3 py-1 mr-1 rounded-t-md text-sm font-medium border cursor-pointer ${
                            isActive
                              ? "bg-white text-black border-t border-l border-r border-gray-300"
                              : "bg-[#e0e0e0] text-gray-600 hover:bg-[#d5d5d5] border border-transparent"
                          }`}
                          onClick={() => setActivePreviewTab(tab)}
                        >
                          <span className="mr-2">{emoji}</span>
                          <span>{label}</span>
                          <FaTimes
                            className="ml-2 text-xs hover:text-red-500"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewTabs((prev) => prev.filter((t) => t !== tab));
                              if (activePreviewTab === tab) {
                                const nextTab = previewTabs.find((t) => t !== tab);
                                setActivePreviewTab(nextTab || null);
                              }
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  {/* 프리뷰 iframe */}
                  <div className="flex-1 p-4 overflow-auto">
                    {activePreviewTab ? (
                      <iframe
                        title="preview"
                        srcDoc={previewSrcDoc}
                        className="w-full h-full border rounded"
                        sandbox="allow-scripts allow-same-origin"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm italic">
                        프리뷰 탭이 열려있지 않습니다.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div />
              )}
            </div>
          </Split>
        </div>

        {/* 컨텍스트 메뉴 */}
        {menuVisible && <ContextMenu position={menuPosition} />}
      </div>
    </div>
  );
};

export default SelfCodingPage;