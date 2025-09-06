import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  FaChevronRight,
  FaChevronDown,
  FaFolder,
  FaFile,
  FaSyncAlt,
} from "react-icons/fa";
import { getRepoTree, getFile, createFile, deleteFile } from "../../../api/project_gitApi";

// 헬퍼 컴포넌트: 새 파일/폴더 이름 입력을 위한 별도 컴포넌트
const CreateInput = ({ initialName, type, onConfirm, onCancel }) => {
  const [name, setName] = useState(initialName);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      onConfirm(name);
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <div className="flex items-center mt-1 pl-6">
      <input
        ref={inputRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => onConfirm(name)}
        className="text-sm border px-2 py-1 w-48"
        placeholder={type === "folder" ? "새 폴더 이름" : "새 파일 이름 (예: app.js)"}
      />
    </div>
  );
};


export default function ProjectGitExplorerPanel({
  projectId,
  branch,
  onOpenFile,
  rootLabel = "root",
  className = "",
}) {
  const [treeItems, setTreeItems] = useState([]);
  const [expanded, setExpanded] = useState({ "": true });
  const [loading, setLoading] = useState(false);
  const [menu, setMenu] = useState({ visible: false, x: 0, y: 0, targetPath: "" });
  const [creatingAt, setCreatingAt] = useState(null);
  const [createType, setCreateType] = useState(null);

  useEffect(() => {
    const close = () => setMenu((m) => ({ ...m, visible: false }));
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  const refreshTree = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await getRepoTree(projectId, { branch, basePath: "", recursive: true });
      setTreeItems(res?.tree || res?.items || []);
    } finally {
      setLoading(false);
    }
  }, [projectId, branch]);

  useEffect(() => { refreshTree(); }, [refreshTree]);

  const builtTree = useMemo(() => {
    const root = { name: "", path: "", type: "tree", children: {}, files: [] };
    for (const it of treeItems) {
      const isDir = it.type !== "blob";
      const parts = it.path.split("/").filter(Boolean);
      let cur = root;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const curPath = i === 0 ? part : `${cur.path ? cur.path + "/" : ""}${part}`;
        const isLeaf = i === parts.length - 1;
        if (isLeaf) {
          if (isDir) {
            if (!cur.children[part]) cur.children[part] = { name: part, path: curPath, type: "tree", children: {}, files: [] };
          } else {
            cur.files.push({ name: part, path: it.path, type: "blob" });
          }
        } else {
          if (!cur.children[part]) cur.children[part] = { name: part, path: curPath, type: "tree", children: {}, files: [] };
          cur = cur.children[part];
        }
      }
    }
    return root;
  }, [treeItems]);

  const toggle = (path) => setExpanded((p) => ({ ...p, [path]: !p[path] }));

  const openMenu = (e, path) => {
    e.preventDefault();
    setMenu({ visible: true, x: e.pageX, y: e.pageY, targetPath: path ?? "" });
  };

  const startCreate = (path, type) => {
    setMenu((m) => ({ ...m, visible: false }));
    setCreatingAt(path ?? "");
    setCreateType(type);
  };
  
  const confirmCreate = async (name) => {
    const parentPath = creatingAt ?? "";
    const trimmedName = (name || "").trim();
    
    setCreatingAt(null);
    setCreateType(null);

    if (!trimmedName) return;
    if (trimmedName.includes("/")) return alert("이름에 '/'는 사용할 수 없어요.");

    try {
      const isFolder = createType === "folder";
      const filePath = isFolder
        ? `${parentPath ? parentPath + "/" : ""}${trimmedName}/.gitkeep`
        : `${parentPath ? parentPath + "/" : ""}${trimmedName}`;
      await createFile(projectId, { branch, path: filePath, content: "" });
      await refreshTree();
      if (isFolder) {
        const folderFull = parentPath ? `${parentPath}/${trimmedName}` : trimmedName;
        setExpanded((p) => ({ ...p, [folderFull]: true, [parentPath]: true }));
      }
    } catch (e) {
      alert(e?.response?.data?.detail || "생성 실패");
    }
  };

  const cancelCreate = () => {
    setCreatingAt(null);
    setCreateType(null);
  }

  const handleDelete = async (path, isDir) => {
    setMenu((m) => ({ ...m, visible: false }));
    
    const message = isDir
      ? `폴더 '${path}'와 내부의 모든 파일/폴더가 영구적으로 삭제됩니다. 정말 삭제할까요?`
      : `파일 '${path}'를 삭제할까요?`;
    
    const ok = window.confirm(message);
    if (!ok) return;

    try {
      await deleteFile(projectId, { branch, path });
      await refreshTree();
    } catch (e) {
      alert(e?.response?.data?.detail || "삭제 실패");
    }
  };

  const openFile = async (path) => {
    try {
      const file = await getFile(projectId, { branch, path });
      onOpenFile?.(path, file);
    } catch (e) {
      alert(e?.response?.data?.detail || "파일을 불러올 수 없습니다.");
    }
  };

  const Node = ({ node, depth = 0 }) => {
    const children = Object.values(node.children).sort((a, b) => a.name.localeCompare(b.name));
    const files = node.files.slice().sort((a, b) => a.name.localeCompare(b.name));
    const isExpanded = expanded[node.path] ?? (node.path === "" ? true : false);
    const isRoot = node.path === "";

    return (
      <div style={{ paddingLeft: depth * 12 }}>
        <div
          className={`flex items-center rounded px-1 ${isRoot ? "cursor-default" : "cursor-pointer hover:underline"} ${isRoot ? "hover:bg-gray-50" : ""}`}
          onClick={() => !isRoot && toggle(node.path)}
          onContextMenu={(e) => {
            e.stopPropagation();
            openMenu(e, node.path);
          }}
        >
          {!isRoot && (isExpanded ? <FaChevronDown className="mr-1" /> : <FaChevronRight className="mr-1" />)}
          <FaFolder className="text-yellow-600 mr-1" />
          <span className="text-sm">{isRoot ? rootLabel : node.name}</span>

          {/* ▼▼▼ [수정] 폴더 이름 옆 '+파일', '+폴더' 버튼 제거 ▼▼▼ */}
        </div>

        {(isExpanded || isRoot) && (
          <div className="ml-2">
            {children.map((c) => <Node key={c.path} node={c} depth={depth + 1} />)}

            {files.map((f) => (
              <div key={f.path}
                   className="flex items-center cursor-pointer hover:underline pl-4 py-0.5"
                   onContextMenu={(e) => {
                     e.stopPropagation();
                     openMenu(e, f.path);
                   }}>
                <FaFile className="mr-1 text-gray-500" />
                <span className="text-sm flex-1" onClick={() => openFile(f.path)}>{f.name}</span>
              </div>
            ))}
            
            {creatingAt === node.path && (
              <CreateInput
                initialName={createType === 'folder' ? 'new-folder' : 'new-file.txt'}
                type={createType}
                onConfirm={confirmCreate}
                onCancel={cancelCreate}
              />
            )}
          </div>
        )}
      </div>
    );
  };

  const ContextMenu = () => {
    if (!menu.visible) return null;
    const isTargetDir = menu.targetPath === '' || treeItems.some(item => item.path === menu.targetPath && item.type === 'tree');

    return (
      <ul
        className="fixed z-50 w-44 bg-white text-gray-800 border border-gray-200 rounded shadow-lg py-1 text-sm"
        style={{ top: menu.y, left: menu.x }}
        onClick={(e) => e.stopPropagation()}
      >
        {isTargetDir && (
          <>
            <li className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => startCreate(menu.targetPath, "file")}>
              새 파일
            </li>
            <li className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => startCreate(menu.targetPath, "folder")}>
              새 폴더
            </li>
          </>
        )}
        
        {menu.targetPath !== "" && (
          <>
            {isTargetDir && <hr className="my-1 border-gray-200" />}
            <li className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-red-600"
                onClick={() => handleDelete(menu.targetPath, isTargetDir)}>
              삭제
            </li>
          </>
        )}
      </ul>
    );
  };

  return (
    <div className={`p-3 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-[13px] font-medium text-gray-600">
          파일 구조 {loading && <span className="ml-2 text-xs text-gray-400">(로딩…)</span>}
        </div>
        <button
          className="p-1 rounded hover:bg-gray-100 text-gray-600"
          title="새로고침"
          onClick={refreshTree}
        >
          <FaSyncAlt />
        </button>
      </div>

      <div className="text-xs pb-4 text-gray-700 whitespace-pre-wrap"
           onContextMenu={(e) => openMenu(e, "")}>
        <Node node={builtTree} depth={0} />
      </div>
      <ContextMenu />
    </div>
  );
}
