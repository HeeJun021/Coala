import React, { useState, useEffect, useRef,useCallback  } from "react";
import { FaChevronRight, FaChevronDown, FaPlusCircle, FaFolder, FaFile } from "react-icons/fa";
import apiClient from "../api/apiClient";

const SelfCodingPanel = ({
  activePanel,
  navigate,
  templateId,
  setTemplateId,
  folders,
  setFolders,
  tabs,
  setTabs,
  activeTab,
  setActiveTab,
  previewTabs,
  setPreviewTabs,
  activePreviewTab,
  setActivePreviewTab,
  previewSrcDoc,
  setPreviewSrcDoc,
  selectedFilename,
  setSelectedFilename,
  selectedFileContent,
  setSelectedFileContent,
  location,
  templateFiles,
  templateDescriptions,
  isGithubConnected,
}) => {
  const [showTemplateInfo, setShowTemplateInfo] = useState(false);
  const [showFileTree, setShowFileTree] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState({ targetId: null });
  const [creatingItem, setCreatingItem] = useState(null);
  const [newItemName, setNewItemName] = useState("");
  const [renamingItem, setRenamingItem] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState({});
  const folderIndexRef = useRef(1);
  const renamingInputRef = useRef(null);

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


  const addTemplateFolder = useCallback((newTemplate) => {
    const nextIndex = folderIndexRef.current.toString();
    folderIndexRef.current += 1;
  
    setFolders((prev) => ({
      ...prev,
      "내 파일": {
        ...prev["내 파일"],
        [nextIndex]: newTemplate,
      },
    }));
  }, [setFolders]);


 useEffect(() => {
  const id = location.state?.templateId;
  if (!id || templateId === id || !templateFiles[id]) return;

  const newTemplate = templateFiles[id];
  let htmlCode = newTemplate["index.html"] || newTemplate["public"]?.["index.html"] || "";
  let jsCode = newTemplate["script.js"] || "";
  let cssCode = newTemplate["style.css"] || "";
  let fullHtml = "";

  addTemplateFolder(newTemplate);

  if (id === "react" || id === "vue" || id === "next") {
    fullHtml = "";
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
}, [location.state, templateId, templateFiles, setPreviewSrcDoc, setTemplateId, addTemplateFolder]);

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
            .then(() => alert("경로가 클립보드에 복사되었습니다."))
            .catch(() => alert("클립보드 복사에 실패했습니다."));
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
        <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => handleClick("새 파일")}>새 파일</li>
        <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => handleClick("새 폴더")}>새 폴더</li>
        <hr className="my-1 border-t border-gray-200" />
        <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => handleClick("공유")}>공유</li>
        <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => handleClick("복사")}>복사</li>
        <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => handleClick("경로 복사")}>경로 복사</li>
        <hr className="my-1 border-t border-gray-200" />
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

  return (
    <div className="w-64 bg-[#f3f3f3] border-r border-gray-300 p-4 overflow-auto">
      {renderLeftPanelContent()}
      {menuVisible && <ContextMenu position={menuPosition} />}
    </div>
  );
};

export default SelfCodingPanel;