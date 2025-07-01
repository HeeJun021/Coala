import React, { useState, useEffect, useRef, useCallback } from "react";
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
  deleteFolder,
} from "../../api/codeApi";
import AlertModal from "../AlertModal";
import { useLocation, useNavigate } from "react-router-dom";
import { templateFiles, templateDescriptions } from "../../data/templateData";

const EXT_MAP = {
  html: 1,
  css: 2,
  js: 3,
  py: 4,
  jsx: 3,
  vue: 3,
  json: 5,
  "config.js": 5,
  txt: 5,
};

const SelfCodingExplorerPanel = ({
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
  const navigate = useNavigate();
  const templateIdFromNav = location.state?.templateId;
  const hasInsertedTemplateRef = useRef(false);

  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    message: "",
    isConfirm: false,
    onConfirm: null,
    onCancel: null,
  });

  const showAlert = (message) => {
  return new Promise((resolve) => {
    setAlertModal({
      isOpen: true,
      message,
      isConfirm: false,
      onConfirm: () => {
        setAlertModal((prev) => ({ ...prev, isOpen: false }));
        resolve();
      },
    });
  });
};

// confirm 함수
const showConfirm = (message) => {
  return new Promise((resolve) => {
    setAlertModal({
      isOpen: true,
      message,
      isConfirm: true,
      onConfirm: () => {
        setAlertModal((prev) => ({ ...prev, isOpen: false }));
        resolve(true);
      },
      onCancel: () => {
        setAlertModal((prev) => ({ ...prev, isOpen: false }));
        resolve(false);
      },
    });
  });
};

  const loadRoot = useCallback(async () => {
    try {
      const root = await getRootCodeFolder();
      setFolderTree({
        ...root,
        children: [],
        codes: [],
        expanded: false,
        loaded: false,
      });
      setFolders({
        ...root,
        children: [],
        codes: [],
        expanded: false,
        loaded: false,
      });
    } catch (err) {
      console.error("루트 폴더 불러오기 실패", err);
    }
  }, [setFolders]);

  const insertTemplateToDB = useCallback(async (templateId, rootFolderId) => {
    const structure = templateFiles[templateId];
    const baseFolderName = templateDescriptions[templateId]?.name || templateId;
    const existingFolders = await getChildFolders(rootFolderId);
    const existingNames = new Set(existingFolders.map((f) => f.folder_name));

    let suffix = 1;
    let folderName = baseFolderName;
    while (existingNames.has(folderName)) {
      folderName = `${baseFolderName}(${suffix++})`;
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
          const langId = EXT_MAP[ext] || EXT_MAP[name] || 5;
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
    await loadRoot();
  }, [loadRoot]);

  useEffect(() => {
    loadRoot();
    window.addEventListener("refreshDirectory", loadRoot);
    return () => window.removeEventListener("refreshDirectory", loadRoot);
  }, [loadRoot]);

  useEffect(() => {
    const applyTemplate = async () => {
      if (!templateIdFromNav || !templateFiles[templateIdFromNav] || hasInsertedTemplateRef.current) return;
      hasInsertedTemplateRef.current = true;

      try {
        if (!folderTree) {
          await loadRoot();
        }
        if (!folderTree?.folder_id) {
          await loadRoot();
          return;
        }
        await insertTemplateToDB(templateIdFromNav, folderTree.folder_id);
        const [children, codes] = await Promise.all([
          getChildFolders(folderTree.folder_id),
          getCodesInFolder(folderTree.folder_id),
        ]);
        setFolderTree({
          ...folderTree,
          children: children.map((child) => ({
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
        setFolders({
          ...folderTree,
          children: children.map((child) => ({
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
        hasInsertedTemplateRef.current = false;
      }
    };
    applyTemplate();
  }, [folderTree, templateIdFromNav, insertTemplateToDB, loadRoot, setFolders]);

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
  window.addEventListener("mousedown", handleOutsideClick, true); // ← 캡처 단계!
  return () => window.removeEventListener("mousedown", handleOutsideClick, true);
}, [menuVisible]);


  useEffect(() => {
    const handleClickOutsideRename = (e) => {
      if (renamingItem && renamingInputRef.current && !renamingInputRef.current.contains(e.target)) {
        setRenamingItem(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutsideRename);
    return () => document.removeEventListener("mousedown", handleClickOutsideRename);
  }, [renamingItem]);

  const handleContextMenu = (e) => {
  e.preventDefault();
  const target = e.target.closest("[data-id]");
  const targetId = target?.dataset?.id;
  if (!targetId) {
    console.warn("❌ 우클릭된 요소에 data-id가 없음", e.target);
    return;
  }
  setMenuVisible(false);  
  setContextMenu({ targetId });
  setMenuPosition({ x: e.pageX + 4, y: e.pageY + 6 });
  setTimeout(() => {
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
    const handleClick = async (label, submenuItem) => {
      if (!contextMenu?.targetId) {
        return;
      }

      if (label === "새 파일") {
        const folderIdStr = contextMenu.targetId?.replace("folder-", "");
        const folderId = Number(folderIdStr);
        if (isNaN(folderId)) return;
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
            if (openNode?.folder_id) {
              await handleFolderToggle(openNode);
            } else {
              console.warn("❌ openNode가 유효하지 않음", openNode);
            }
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
            if (openNode?.folder_id) {
              await handleFolderToggle(openNode);
            } else {
              console.warn("❌ openNode가 유효하지 않음", openNode);
            }
          }
          showInput();
        } else {
          showInput();
        }
        setMenuVisible(false);
        return;
      }

      if (label === "공유" && submenuItem === "코드공유게시글 작성") {
        if (contextMenu.targetId?.startsWith("code-")) {
          const codeIdStr = contextMenu.targetId.replace("code-", "");
          const codeId = parseInt(codeIdStr);

          try {
            const file = await getCodeById(codeId);
            navigate("/board/code/write", {
              state: {
                codeContent: file.content,
                codeTitle: file.title,
              },
            });
          } catch (err) {
            console.error("파일 내용 조회 실패", err);
          }
        }
        setMenuVisible(false);
        await loadRoot();
        return;
      }

      if (label === "이름 바꾸기") {
        if (contextMenu.targetId?.startsWith("folder-")) {
          const folderIdStr = contextMenu.targetId.replace("folder-", "");
          const folderId = parseInt(folderIdStr);
          const updatedTree = structuredClone(folderTree); 
          const targetNode = findFolderNode(updatedTree, folderId);
          if (targetNode) {
            targetNode.expanded = true;
            setFolderTree(updatedTree);
            setFolders(updatedTree);
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
    setRenamingItem({ path: `code-${codeId}`, name: foundFile.title.split(/\.(?=[^.]+$)/)[0] });
  }
}
        setMenuVisible(false);
        return;
      }

      if (label === "경로 복사") {
        if (navigator.clipboard && contextMenu?.targetId) {
          try {
            await navigator.clipboard.writeText(contextMenu.targetId);
            await showAlert("경로가 클립보드에 복사되었습니다.");
          } catch (err) {
            await showAlert("클립보드 복사에 실패했습니다.");
          }
        }
        setMenuVisible(false);
        return;
      }

      if (label === "삭제") {
        const confirmDelete = await showConfirm(
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
            setFolderTree(newTree);
            setFolders(newTree);
          } catch (err) {
            console.error("폴더 삭제 실패", err);
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
            setFolders({ ...newTree });
          } catch (err) {
            console.error("코드 삭제 실패", err);
          }
        }
        setMenuVisible(false);
        return;
      }
    };

    const isFile = contextMenu.targetId?.startsWith("code-");
    const menuItems = [
      { label: "새 파일", show: true },
      { label: "새 폴더", show: true },
      { label: "공유", show: isFile, submenu: [{ label: "코드공유게시글 작성" }] },
      { label: "복사 (준비중)", show: false },
      { label: "경로 복사", show: true },
      { label: "이름 바꾸기", show: true },
      { label: "삭제", show: true },
    ].filter((item) => item.show);

    return (
      <ul
        id="context-menu"
        className="fixed z-50 w-40 bg-white text-gray-800 border border-gray-200 rounded shadow-lg py-1 text-sm"
        style={{ top: position.y, left: position.x }}
        onMouseDown={e => e.stopPropagation()}
      >
        {menuItems.map((item) => (
          <li
            key={item.label}
            className={`relative ${item.submenu ? "group" : ""}`}
          >
            <div
              className={`px-4 py-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center ${
                item.label === "삭제" ? "text-red-600 hover:text-red-700" : ""
              }`}
              onClick={() => !item.submenu && handleClick(item.label)}
            >
              {item.label}
              {item.submenu && <FaChevronRight className="text-gray-400" />}
            </div>
            {item.submenu && (
              <ul
                className="absolute left-full top-0 w-48 bg-white border border-gray-200 rounded shadow-lg py-1 text-sm hidden group-hover:block"
              >
                {item.submenu.map((subItem) => (
                  <li
                    key={subItem.label}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleClick(item.label, subItem.label)}
                  >
                    {subItem.label}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    );
  };
const handleFolderToggle = async (node) => {
  if (!node?.folder_id) {
    console.error("❌ 잘못된 폴더 node:", node);
    return;
  }
  // 오직 이 폴더만!
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
      await showAlert("하위 항목 불러오기 중 오류 발생");
    }
  }

  node.expanded = !node.expanded;
  // 항상 새 객체로 만들어줘야 React가 변화 감지!
  setFolderTree({ ...folderTree });
  setFolders({ ...folderTree });
};

  const handleFileClick = async (file) => {
    try {
      const full = await getCodeById(file.code_id);
      const tabId = `code-${full.code_id}`;
      setSelectedFilename(full.title);
      setSelectedFileContent(full.content);

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
      await showAlert("파일을 불러올 수 없습니다.");
    }
  };

  const renderFolderNode = (node, depth = 0) => {
    const paddingLeft = depth * 12;

    return (
      <div key={`folder-${node.folder_id}`} style={{ paddingLeft }}>
        <div
          className="flex items-center cursor-pointer hover:underline"
          onClick={() => handleFolderToggle(node)}
          onContextMenu={handleContextMenu}
          data-id={`folder-${node.folder_id}`}
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
                    await showAlert("이름을 입력하세요.");
                    return;
                  }
                  try {
                    const renamed = await renameFolder(node.folder_id, newName);
                    node.folder_name = renamed.folder_name;
                    setFolderTree({ ...folderTree });
                    setFolders({ ...folderTree });
                  } catch (err) {
                    console.error("폴더 이름 변경 실패", err);
                  } finally {
                    setRenamingItem(null);
                  }
                } else if (e.key === "Escape") {
                  setRenamingItem(null);
                }
              }}
              ref={renamingInputRef}
            />
          ) : (
            <span className="text-sm">{node.folder_name}</span>
          )}
        </div>

        {node.expanded && (
          <div className="ml-2">
            {node.children.map((child) => renderFolderNode(child, depth + 1))}

            {node.codes.map((file) => {
              const [nameOnly, ext] = file.title.split(/\.(?=[^.]+$)/); //nameOnly 지우면 큰일 나더라
              const isRenaming = renamingItem?.path === `code-${file.code_id}`;
              return (
                <div
                  key={`code-${file.code_id}`}
                  className="flex items-center cursor-pointer hover:underline pl-4"
                  onClick={() => handleFileClick(file)}
                  onContextMenu={handleContextMenu}
                  data-id={`code-${file.code_id}`}
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
                              await showAlert("이름을 입력하세요.");
                              return;
                            }
                            try {
                              const renamed = await renameCodeFile(file.code_id, `${newName}.${ext}`);
                              file.title = renamed.title;
                              setFolderTree({ ...folderTree });
                              setFolders({ ...folderTree });
                            } catch (err) {
                              console.error("파일 이름 변경 실패", err);
                            } finally {
                              setRenamingItem(null);
                            }
                          } else if (e.key === "Escape") {
                            setRenamingItem(null);
                          }
                        }}
                        ref={renamingInputRef}
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
                          console.log("이름 x"); 
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
                          setFolders({ ...folderTree });
                        } catch (err) {
                          console.error("폴더 생성 실패", err);
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
                          await showAlert("파일 이름과 확장자를 입력하세요 (예: main.js)");
                          return;
                        }

                        const ext = name.split(".").pop();
                        const languageId = EXT_MAP[ext] || 5;

                        if (!languageId) {
                          await showAlert("지원하지 않는 확장자입니다.");
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
                          setFolders({ ...folderTree });
                        } catch (err) {
                          console.error("파일 생성 실패", err);
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
    <div className="p-4">
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
        <div className="text-xs pb-4 text-gray-700 whitespace-pre-wrap">
          {renderFolderNode(folderTree)}
        </div>
      )}
      {menuVisible && <ContextMenu position={menuPosition} />}
      <AlertModal
        isOpen={alertModal.isOpen}
        message={alertModal.message}
        isConfirm={alertModal.isConfirm}
        onConfirm={alertModal.onConfirm}
        onCancel={alertModal.onCancel}
      />
    </div>
  );
};

export default SelfCodingExplorerPanel;