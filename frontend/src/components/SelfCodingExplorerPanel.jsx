import React, { useState, useEffect, useRef } from "react";
import { FaChevronRight, FaChevronDown, FaPlusCircle, FaFolder, FaFile } from "react-icons/fa";
import {
  getRootCodeFolder,
  getChildFolders,
  getCodesInFolder,
  getCodeById,
  createChildFolder,
  saveCodeFile,
  renameCodeFile,
  renameFolder,
  deleteCodeFile,
  deleteFolder
} from "../api/codeApi";
import { useLocation } from "react-router-dom";
import { templateFiles, templateDescriptions } from "../data/templateData";

const SelfCodingExplorerPanel = ({
  navigate,
  folders,
  setFolders,
  tabs,
  setTabs,
  activeTabId,
  setActiveTabId,
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
}) => {
  const [showFileTree, setShowFileTree] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState({ targetId: null });
  const [creatingItem, setCreatingItem] = useState(null);
  const [newItemName, setNewItemName] = useState("");
  const [renamingItem, setRenamingItem] = useState(null);
  const renamingInputRef = useRef(null);
  const [folderTree, setFolderTree] = useState(null);
  const location = useLocation();
  const templateIdFromNav = location.state?.templateId;
  const hasInsertedTemplateRef = useRef(false);
const EXT_MAP = {
  html: 1,
  css: 2,
  js: 3,
  py: 4,
  jsx: 3, // JavaScript와 동일
  vue: 3, // JavaScript와 동일
  json: 5, // 기타
  "config.js": 5, // 기타
  txt: 5, // 기타
};

  useEffect(() => {
    const loadRoot = async () => {
      try {
        const root = await getRootCodeFolder();
        setFolderTree({
          ...root,
          children: [],
          codes: [],
          expanded: false,
          loaded: false,
        });
      } catch (err) {
        console.error("루트 폴더 불러오기 실패", err);
      }
    };
    loadRoot();
  }, []);

  useEffect(() => {
    const applyTemplate = async () => {
      if (!templateIdFromNav || !templateFiles[templateIdFromNav] || hasInsertedTemplateRef.current) return;
      hasInsertedTemplateRef.current = true;
  
      try {
        // 루트 폴더가 없으면 생성
        if (!folderTree) {
          const root = await getRootCodeFolder();
          setFolderTree({
            ...root,
            children: [],
            codes: [],
            expanded: false,
            loaded: false,
          });
        }
  
        await insertTemplateToDB(templateIdFromNav, folderTree.folder_id);
  
        const [children, codes] = await Promise.all([
          getChildFolders(folderTree.folder_id),
          getCodesInFolder(folderTree.folder_id),
        ]);
        setFolderTree({
          ...folderTree,
          children: children.map(child => ({
            ...child,
            children: [],
            codes: [],
            expanded: false,
            loaded: false,
          })),
          codes,
          expanded: true,
          loaded: true,
        });
      } catch (err) {
        console.error("템플릿 생성 실패:", err);
        alert("템플릿 생성에 실패했습니다. 네트워크를 확인하세요.");
        hasInsertedTemplateRef.current = false;
      }
    };
    applyTemplate();
  }, [folderTree, templateIdFromNav]);

  const insertTemplateToDB = async (templateId, rootFolderId) => {
    const structure = templateFiles[templateId];
    let baseFolderName = templateDescriptions[templateId]?.name || templateId;
    let folderName = baseFolderName;
    let suffix = 1;
  
    const existingFolders = await getChildFolders(rootFolderId);
    while (existingFolders.some(f => f.folder_name === folderName)) {
      suffix++;
      folderName = `${baseFolderName}(${suffix})`;
    }

    const templateFolder = await createChildFolder({
      parent_folder_id: rootFolderId,
      folder_name: folderName,
    });

    const createRecursively = async (node, parentId) => {
      for (const name in node) {
        const value = node[name];
        if (typeof value === "string") {
          const ext = name.includes(".") ? name.split(".").pop() : "";
          const langId = EXT_MAP[ext] || EXT_MAP[name] || 5; // 기본값: 기타
          await saveCodeFile({
            title: name,
            content: value,
            language_id: langId,
            folder_id: parentId,
          });
        } else if (typeof value === "object") {
          const newFolder = await createChildFolder({
            parent_folder_id: parentId,
            folder_name: name,
          });
          await createRecursively(value, newFolder.folder_id);
        }
      }
    };
  
    await createRecursively(structure, templateFolder.folder_id);
  };

  const handleFolderToggle = async (node, path = []) => {
    if (!node.loaded) {
      try {
        const [children, codes] = await Promise.all([
          getChildFolders(node.folder_id),
          getCodesInFolder(node.folder_id),
        ]);

        node.children = children.map((child) => ({
          ...child,
          children: [],
          codes: [],
          expanded: false,
          loaded: false,
        }));
        node.codes = codes;
        node.loaded = true;
      } catch (err) {
        console.error("하위 항목 불러오기 실패", err);
      }
    }

    node.expanded = !node.expanded;
    setFolderTree({ ...folderTree });
  };

  const handleFileClick = async (file) => {
    try {
      const full = await getCodeById(file.code_id);
      const tabId = `code-${full.code_id}`;
  
      if (!tabs.find((tab) => tab.tabId === tabId)) {
        setTabs((prev) => [...prev, {
          tabId,
          filename: full.title,
          content: full.content,
        }]);
      }
  
      setActiveTabId(tabId);
    } catch (err) {
      console.error("파일 내용 조회 실패", err);
      alert("파일을 불러올 수 없습니다.");
    }
  };

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

  const handleContextMenu = (e) => {
    e.preventDefault();
    setMenuVisible(false);
    setTimeout(() => {
      setMenuPosition({ x: e.pageX + 4, y: e.pageY + 6 });
      setMenuVisible(true);
    }, 0);
  };

  const findFolderNode = (node, folderId) => {
    if (node.folder_id === folderId) return node;
    for (const child of node.children || []) {
      const found = findFolderNode(child, folderId);
      if (found) return found;
    }
    return null;
  };

  const ContextMenu = ({ position }) => {
    const handleClick = async (label) => {
      if (!contextMenu?.targetId) {
        alert("폴더 안에서만 작업할 수 있습니다.");
        return;
      }

      if (label === "새 파일") {
        const folderIdStr = contextMenu.targetId?.replace("folder-", "");
        const folderId = parseInt(folderIdStr);

        const openNode = findFolderNode(folderTree, folderId);
        const showInput = () => {
          setCreatingItem({
            type: "file",
            parentPath: contextMenu.targetId,
          });
          setNewItemName("");
        };

        if (openNode) {
          if (!openNode.expanded) {
            await handleFolderToggle(openNode);
          }
          showInput();
        } else {
          showInput();
        }

        setMenuVisible(false);
        return;
      }

      if (label === "새 폴더") {
        const folderIdStr = contextMenu.targetId?.replace("folder-", "");
        const folderId = parseInt(folderIdStr);

        const openNode = findFolderNode(folderTree, folderId);
        const showInput = () => {
          setCreatingItem({
            type: "folder",
            parentPath: contextMenu.targetId,
          });
          setNewItemName("");
        };

        if (openNode) {
          if (!openNode.expanded) {
            await handleFolderToggle(openNode);
          }
          showInput();
        } else {
          showInput();
        }

        setMenuVisible(false);
        return;
      }

      if (label === "이름 바꾸기") {
        if (contextMenu.targetId?.startsWith("folder-")) {
          const folderIdStr = contextMenu.targetId.replace("folder-", "");
          const folderId = parseInt(folderIdStr);
          const targetNode = findFolderNode(folderTree, folderId);
          if (targetNode) {
            targetNode.expanded = true;
            setFolderTree({ ...folderTree });
            setRenamingItem({ path: `folder-${folderId}`, name: targetNode.folder_name });
          }
        }

        if (contextMenu.targetId?.startsWith("code-")) {
          const codeIdStr = contextMenu.targetId.replace("code-", "");
          const codeId = parseInt(codeIdStr);

          const searchFile = (node) => {
            const found = node.codes.find((c) => c.code_id === codeId);
            if (found) return found;
            for (const child of node.children || []) {
              const res = searchFile(child);
              if (res) return res;
            }
            return null;
          };

          const foundFile = searchFile(folderTree);
          if (foundFile) {
            const [nameOnly] = foundFile.title.split(/\.(?=[^\.]+$)/);
            setRenamingItem({ path: `code-${codeId}`, name: nameOnly });
          }
        }
      }

      if (label === "경로 복사") {
        if (navigator.clipboard && contextMenu?.targetId) {
          navigator.clipboard
            .writeText(contextMenu.targetId)
            .then(() => alert("경로가 클립보드에 복사되었습니다."))
            .catch(() => alert("클립보드 복사에 실패했습니다."));
        }
      }

      if (label === "삭제") {
        const confirmDelete = window.confirm(
          contextMenu.targetId.startsWith("folder-")
            ? "폴더의 하위 폴더 및 파일도 모두 삭제됩니다. 정말로 삭제하시겠습니까?"
            : "정말로 삭제하시겠습니까?"
        );
        if (!confirmDelete) return;

        const newTree = JSON.parse(JSON.stringify(folderTree));

        if (contextMenu.targetId.startsWith("folder-")) {
          const folderId = parseInt(contextMenu.targetId.replace("folder-", ""));
          try {
            await deleteFolder(folderId);

            const deleteNode = (tree, id) => {
              for (let i = 0; i < tree.length; i++) {
                if (tree[i].folder_id === id) {
                  tree.splice(i, 1);
                  return true;
                }
                if (tree[i].children && deleteNode(tree[i].children, id)) {
                  return true;
                }
              }
              return false;
            };

            deleteNode([newTree], folderId);
            setFolderTree({ ...newTree });
          } catch (err) {
            console.error("폴더 삭제 실패", err);
            alert("폴더 삭제에 실패했습니다.");
          }
        } else if (contextMenu.targetId.startsWith("code-")) {
          const codeId = parseInt(contextMenu.targetId.replace("code-", ""));
          try {
            await deleteCodeFile(codeId);

            const deleteCode = (tree) => {
              for (let node of tree) {
                const idx = node.codes.findIndex((c) => c.code_id === codeId);
                if (idx !== -1) {
                  node.codes.splice(idx, 1);
                  return true;
                }
                if (node.children && deleteCode(node.children)) {
                  return true;
                }
              }
              return false;
            };

            deleteCode([newTree]);
            setFolderTree({ ...newTree });
          } catch (err) {
            console.error("코드 삭제 실패", err);
            alert("파일 삭제에 실패했습니다.");
          }
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
        <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">공유 (준비중)</li>
        <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">복사 (준비중)</li>
        <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => handleClick("경로 복사")}>경로 복사</li>
        <hr className="my-1 border-t border-gray-200" />
        <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => handleClick("이름 바꾸기")}>이름 바꾸기</li>
        <li className="px-4 py-2 text-red-600 hover:text-red-700 hover:bg-gray-100 cursor-pointer" onClick={() => handleClick("삭제")}>삭제</li>
      </ul>
    );
  };

  const renderFolderNode = (node, depth = 0) => {
    const paddingLeft = depth * 12;

    return (
      <div key={`folder-${node.folder_id}`} style={{ paddingLeft }}>
        <div
          className="flex items-center cursor-pointer hover:underline"
          onClick={() => handleFolderToggle(node)}
          onContextMenu={(e) => {
            e.preventDefault();
            setMenuPosition({ x: e.pageX + 4, y: e.pageY + 6 });
            setContextMenu({ targetId: `folder-${node.folder_id}` });
            setMenuVisible(true);
          }}
        >
          {node.expanded ? <FaChevronDown className="mr-1" /> : <FaChevronRight className="mr-1" />}
          <FaFolder className="text-yellow-600 mr-1" />
          {renamingItem?.path === `folder-${node.folder_id}` ? (
            <input
              className="text-sm border px-1 py-0.5 w-32"
              autoFocus
              value={renamingItem.name}
              onChange={(e) => setRenamingItem({ ...renamingItem, name: e.target.value })}
              onBlur={() => setRenamingItem(null)}
              onKeyDown={async (e) => {
                if (e.key === "Enter") {
                  const newName = renamingItem.name.trim();
                  if (!newName) {
                    alert("이름을 입력하세요.");
                    return;
                  }
                  try {
                    const renamed = await renameFolder(node.folder_id, newName);
                    node.folder_name = renamed.folder_name;
                    setFolderTree({ ...folderTree });
                  } catch (err) {
                    console.error("폴더 이름 변경 실패", err);
                    alert("변경 실패");
                  } finally {
                    setRenamingItem(null);
                  }
                } else if (e.key === "Escape") {
                  setRenamingItem(null);
                }
              }}
            />
          ) : (
            <span className="text-sm">{node.folder_name}</span>
          )}
        </div>

        {node.expanded && (
          <div className="ml-2">
            {node.children.map((child) => renderFolderNode(child, depth + 1))}

            {node.codes.map((file) => {
              const [nameOnly, ext] = file.title.split(/\.(?=[^\.]+$)/);
              const isRenaming = renamingItem?.path === `code-${file.code_id}`;
              return (
                <div
                  key={`code-${file.code_id}`}
                  className="flex items-center cursor-pointer hover:underline pl-4"
                  onClick={() => handleFileClick(file)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setMenuPosition({ x: e.pageX + 4, y: e.pageY + 6 });
                    setContextMenu({ targetId: `code-${file.code_id}` });
                    setMenuVisible(true);
                  }}
                >
                  <FaFile className="mr-1 text-gray-500" />
                  {isRenaming ? (
                    <>
                      <input
                        className="text-sm border px-1 py-0.5 w-32"
                        autoFocus
                        value={renamingItem.name}
                        onChange={(e) => setRenamingItem({ ...renamingItem, name: e.target.value })}
                        onBlur={() => setRenamingItem(null)}
                        onKeyDown={async (e) => {
                          if (e.key === "Enter") {
                            const newName = renamingItem.name.trim();
                            if (!newName) {
                              alert("이름을 입력하세요.");
                              return;
                            }
                            try {
                              const renamed = await renameCodeFile(file.code_id, `${newName}.${ext}`);
                              file.title = renamed.title;
                              setFolderTree({ ...folderTree });
                            } catch (err) {
                              console.error("파일 이름 변경 실패", err);
                              alert("변경 실패");
                            } finally {
                              setRenamingItem(null);
                            }
                          } else if (e.key === "Escape") {
                            setRenamingItem(null);
                          }
                        }}
                      />
                      <span className="ml-1 text-xs text-gray-400">.{ext}</span>
                    </>
                  ) : (
                    <span className="text-sm">{file.title}</span>
                  )}
                </div>
              );
            })}

            {creatingItem?.type === "folder" &&
              creatingItem.parentPath === `folder-${node.folder_id}` && (
                <div className="flex items-center mt-1 pl-6">
                  <input
                    id="new-item-input"
                    autoFocus
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    onBlur={() => {
                      setCreatingItem(null);
                      setNewItemName("");
                    }}
                    onKeyDown={async (e) => {
                      if (e.key === "Enter") {
                        const name = newItemName.trim();
                        if (!name) {
                          alert("이름을 입력하세요.");
                          return;
                        }
                        try {
                          const newFolder = await createChildFolder({
                            parent_folder_id: node.folder_id,
                            folder_name: name,
                          });

                          node.children.push({
                            ...newFolder,
                            children: [],
                            codes: [],
                            expanded: false,
                            loaded: false,
                          });
                          node.expanded = true;
                          setFolderTree({ ...folderTree });
                        } catch (err) {
                          console.error("폴더 생성 실패", err);
                          alert("폴더 생성에 실패했습니다.");
                        } finally {
                          setCreatingItem(null);
                          setNewItemName("");
                        }
                      } else if (e.key === "Escape") {
                        setCreatingItem(null);
                        setNewItemName("");
                      }
                    }}
                    className="text-sm border px-2 py-1 w-40"
                    placeholder="새 폴더 이름"
                  />
                </div>
            )}

            {creatingItem?.type === "file" &&
              creatingItem.parentPath === `folder-${node.folder_id}` && (
                <div className="flex items-center mt-1 pl-6">
                  <input
                    id="new-item-input"
                    autoFocus
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    onBlur={() => {
                      setCreatingItem(null);
                      setNewItemName("");
                    }}
                    onKeyDown={async (e) => {
                      if (e.key === "Enter") {
                        const name = newItemName.trim();
                        if (!name || !name.includes(".")) {
                          alert("파일 이름과 확장자를 입력하세요 (예: main.js)");
                          return;
                        }

                        const ext = name.split(".").pop();
                        const extMap = { html: 1, css: 2, js: 3, py: 4 };
                        const languageId = extMap[ext];

                        if (!languageId) {
                          alert("지원하지 않는 확장자입니다.");
                          return;
                        }

                        try {
                          const newFile = await saveCodeFile({
                            title: name,
                            content: "",
                            language_id: languageId,
                            folder_id: node.folder_id,
                          });

                          node.codes.push(newFile);
                          node.expanded = true;
                          setFolderTree({ ...folderTree });
                        } catch (err) {
                          console.error("파일 생성 실패", err);
                          alert("파일 생성에 실패했습니다.");
                        } finally {
                          setCreatingItem(null);
                          setNewItemName("");
                        }
                      } else if (e.key === "Escape") {
                        setCreatingItem(null);
                        setNewItemName("");
                      }
                    }}
                    className="text-sm border px-2 py-1 w-40"
                    placeholder="새 파일 이름 (예: app.js)"
                  />
                </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div
        className="text-sm text-green-700 font-medium flex items-center gap-2 cursor-pointer mb-4 hover:underline"
        onClick={() => navigate("/self-coding/templates")}
      >
        <FaPlusCircle className="text-green-600" /> 템플릿 새로 만들기
      </div>
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
      {showFileTree && folderTree && (
        <div
          className="text-xs pb-4 text-gray-700 whitespace-pre-wrap"
          onContextMenu={handleContextMenu}
        >
          {renderFolderNode(folderTree)}
        </div>
      )}
      {menuVisible && <ContextMenu position={menuPosition} />}
    </>
  );
};

export default SelfCodingExplorerPanel;