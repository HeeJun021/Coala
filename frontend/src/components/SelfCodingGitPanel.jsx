import React, { useState, useEffect, useRef } from "react";
import { FaBookOpen, FaChevronRight, FaChevronDown, FaFile } from "react-icons/fa";
import { getRootCodeFolder, getChildFolders, getCodesInFolder } from "../api/codeApi";
import githubApi from "../api/githubApi";

const SelfCodingGitPanel = ({ isGithubConnected }) => {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [repoName, setRepoName] = useState("");
  const [repoDescription, setRepoDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const nameInputRef = useRef(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [remoteRepoFiles, setRemoteRepoFiles] = useState([]);
  const [selectedPaths, setSelectedPaths] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [folderTree, setFolderTree] = useState(null);
  const [previewContent, setPreviewContent] = useState(null);
  const [destinationPath, setDestinationPath] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedPaths, setUploadedPaths] = useState([]);
  const [expandedRemotePaths, setExpandedRemotePaths] = useState([]);
  const [uploadSessionId, setUploadSessionId] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState({ targetId: null, file: null });

  useEffect(() => {
    const loadRoot = async () => {
      try {
        const root = await getRootCodeFolder();
        const [children, codes] = await Promise.all([
          getChildFolders(root.folder_id),
          getCodesInFolder(root.folder_id),
        ]);
        setFolderTree({
          ...root,
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
        console.error("루트 폴더 불러오기 실패", err);
        setError("폴더 구조를 불러오지 못했습니다.");
      }
    };
    loadRoot();
  }, []);

  useEffect(() => {
    if (isGithubConnected) {
      const fetchRepos = async () => {
        setLoading(true);
        try {
          const res = await githubApi.getRepos();
          setRepos(Array.isArray(res.data) ? res.data : []);
          setError(null);
        } catch (err) {
          console.error("Failed to fetch repos:", err);
          setError(err.response?.data?.detail || "저장소 목록을 가져오지 못했습니다.");
          setRepos([]);
        } finally {
          setLoading(false);
        }
      };
      fetchRepos();
    } else {
      setRepos([]);
      setError(null);
    }
  }, [isGithubConnected]);

  useEffect(() => {
    if (isModalOpen && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isModalOpen]);

  const handleUnlinkGithub = async () => {
    try {
      await githubApi.unlinkGithub();
      window.location.href = "https://github.com/logout";
    } catch (err) {
      console.error("Failed to unlink GitHub:", err);
      setError("GitHub 연동 해제에 실패했습니다.");
    }
  };

  const handleCreateRepo = async () => {
    if (!repoName.trim()) {
      setError("저장소 이름은 필수입니다.");
      if (nameInputRef.current) nameInputRef.current.focus();
      return;
    }
    setLoading(true);
    try {
      const res = await githubApi.createRepo({
        name: repoName.trim(),
        description: repoDescription.trim(),
        private: isPrivate,
      });
      setRepos((prevRepos) => [...prevRepos, res.data]);
      setIsModalOpen(false);
      setRepoName("");
      setRepoDescription("");
      setIsPrivate(false);
      setError(null);
    } catch (err) {
      console.error("Failed to create repo:", err.response?.data);
      const errorMsg = err.response?.data?.detail || (err.response?.data?.message || "저장소 생성에 실패했습니다.");
      setError(typeof errorMsg === "string" ? errorMsg : JSON.stringify(errorMsg));
      if (nameInputRef.current) nameInputRef.current.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (setter) => (e) => setter(e.target.value);

  const handleOpenUploadModal = () => {
    setIsUploadModalOpen(true);
    setDestinationPath("");
    setExpandedRemotePaths([]);
  };

  const collectAllDescendantPathsAsync = async (folderNode) => {
    const collected = [`folder-${folderNode.folder_id}`];
    const queue = [folderNode];

    while (queue.length > 0) {
      const current = queue.shift();

      if (!current.loaded) {
        const [childrenRes, codesRes] = await Promise.all([
          getChildFolders(current.folder_id),
          getCodesInFolder(current.folder_id),
        ]);

        current.children = childrenRes.map(child => ({
          ...child,
          children: [],
          codes: [],
          expanded: false,
          loaded: false,
        }));
        current.codes = codesRes;
        current.loaded = true;
      }

      collected.push(...current.children.map((child) => `folder-${child.folder_id}`));
      collected.push(...current.codes.map((code) => `code-${code.code_id}`));

      queue.push(...current.children);
    }

    return collected;
  };

  const handleCheckboxChange = async (nodeOrId) => {
    if (typeof nodeOrId === "string") {
      setSelectedPaths(prev =>
        prev.includes(nodeOrId) ? prev.filter(p => p !== nodeOrId) : [...prev, nodeOrId]
      );
    } else {
      const allPaths = await collectAllDescendantPathsAsync(nodeOrId);
      const isChecked = allPaths.every(p => selectedPaths.includes(p));

      setSelectedPaths(prev =>
        isChecked
          ? prev.filter(p => !allPaths.includes(p))
          : [...prev, ...allPaths.filter(p => !prev.includes(p))]
      );
    }
  };

  const handleRepoSelect = async (repo) => {
    if (!repo?.full_name) {
      console.error("Invalid repo selected:", repo);
      setError("유효하지 않은 저장소입니다.");
      setRemoteRepoFiles([]);
      setSelectedRepo(null);
      setPreviewContent(null);
      setDestinationPath("");
      setExpandedRemotePaths([]);
      return;
    }
    setSelectedRepo(repo);
    setPreviewContent(null);
    setDestinationPath("");
    setExpandedRemotePaths([]);
    try {
      console.log("Requesting repo files for:", repo.full_name);
      const res = await githubApi.getRepoFiles(repo.full_name);
      console.log("Received repo files:", JSON.stringify(res.data.structure, null, 2));
      setRemoteRepoFiles(res.data.structure || []);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch remote files:", err.response?.data || err.message);
      setError("폴더나 파일을 찾을 수 없습니다.");
      setRemoteRepoFiles([]);
    }
  };

  const handleFileClick = async (file) => {
    if (file.type !== "file") {
      console.log("Non-file clicked, ignoring:", file.name);
      return;
    }
    console.log("File clicked:", file.name, "Repo:", selectedRepo?.full_name, "Path:", file.path);
    try {
      const res = await githubApi.getFileContent(selectedRepo.full_name, file.path);
      console.log("Received response:", JSON.stringify(res.data, null, 2));
      const content = res.data.content;
      setPreviewContent(content || "Empty file: No content to display");
      console.log("previewContent set:", content || "Empty file");
      setError(null);
    } catch (err) {
      console.error("Failed to fetch file content:", err.response?.data || err.message);
      setError("파일을 찾을 수 없습니다.");
      setPreviewContent(null);
      console.log("Error set:", "파일을 찾을 수 없습니다.");
    }
  };

  const handleFolderSelect = (folder) => {
    setDestinationPath(folder.path);
    console.log("Selected destination path:", folder.path);
  };

  const handleUpload = async () => {
    if (!selectedRepo || !selectedPaths.length) {
      alert("저장소와 업로드할 파일을 선택하세요.");
      return;
    }

    setIsUploading(true);
    setUploadedPaths([]);
    setUploadSessionId(null);

    try {
      console.log("Uploading to repo:", selectedRepo.full_name, "with paths:", selectedPaths, "destination:", destinationPath);
      
      const res = await githubApi.uploadToRepo({
        repo_name: selectedRepo.full_name,
        paths: selectedPaths,
        destination_path: destinationPath,
      });

      console.log("Upload response:", res.data);

      setUploadedPaths(res.data.uploaded_paths || []);
      setUploadSessionId(res.data.session_id || null);
      alert("업로드 성공");

      setIsUploadModalOpen(false);
      setSelectedPaths([]);
      setDestinationPath("");
      setPreviewContent(null);
      setExpandedRemotePaths([]);
      handleRepoSelect(selectedRepo);
    } catch (err) {
      console.error("Upload error:", err.response?.data || err.message);
      alert("업로드 실패: " + (err.response?.data?.detail || "알 수 없는 오류"));
    } finally {
      setIsUploading(false);
    }
  };

  const handleFolderToggle = async (node) => {
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
        setError("하위 폴더/파일을 불러오지 못했습니다.");
      }
    }
    node.expanded = !node.expanded;
    setFolderTree({ ...folderTree });
  };

  const handleContextMenu = (e, file) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuVisible(false);
    setTimeout(() => {
      setMenuPosition({ x: e.pageX + 4, y: e.pageY + 6 });
      setContextMenu({ targetId: file.path, file });
      setMenuVisible(true);
    }, 0);
  };

  const handleCreateFolder = async () => {
    if (!selectedRepo || !contextMenu.file) {
      setError("저장소를 선택하세요.");
      return;
    }
    const folderName = prompt("새 폴더 이름을 입력하세요:", "NewFolder");
    if (!folderName || !folderName.trim()) return;

    try {
      const parentPath = contextMenu.file.type === "dir" ? contextMenu.file.path : "";
      const newPath = parentPath ? `${parentPath}/${folderName}` : folderName;
      await githubApi.createFolder(selectedRepo.full_name, newPath);
      setError(null);
      handleRepoSelect(selectedRepo);
      setMenuVisible(false);
    } catch (err) {
      console.error("Failed to create folder:", err);
      setError(err.response?.data?.detail || "폴더 생성에 실패했습니다.");
    }
  };

  const handleDelete = async () => {
    if (!selectedRepo || !contextMenu.file) {
      setError("삭제할 항목을 선택하세요.");
      return;
    }
    if (!window.confirm(`"${contextMenu.file.name}"을(를) 삭제하시겠습니까?`)) return;

    try {
      await githubApi.deleteFile(selectedRepo.full_name, contextMenu.file.path);
      setError(null);
      handleRepoSelect(selectedRepo);
      setMenuVisible(false);
    } catch (err) {
      console.error("Failed to delete:", err);
      setError(err.response?.data?.detail || "삭제에 실패했습니다.");
    }
  };

  const ContextMenu = ({ position }) => {
    const handleClick = (label) => {
      if (label === "새 폴더") handleCreateFolder();
      if (label === "삭제") handleDelete();
      setMenuVisible(false);
    };

    return (
      <ul
        id="context-menu"
        className="fixed z-50 w-40 bg-white text-gray-800 border border-gray-200 rounded shadow-lg py-1 text-sm"
        style={{ top: position.y, left: position.x }}
        onClick={(e) => e.stopPropagation()}
      >
        {contextMenu.file?.type === "dir" && (
          <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => handleClick("새 폴더")}>
            새 폴더
          </li>
        )}
        <li className="px-4 py-2 text-red-600 hover:text-red-700 hover:bg-gray-100 cursor-pointer" onClick={() => handleClick("삭제")}>
          삭제
        </li>
      </ul>
    );
  };

  const renderFolderNode = (node, depth = 0) => {
    const paddingLeft = depth * 20;
    return (
      <div key={`folder-${node.folder_id}`} style={{ paddingLeft }}>
        <div className="flex items-center py-1">
          <div
            className="flex items-center cursor-pointer hover:text-blue-600 transition-colors"
            onClick={() => handleFolderToggle(node)}
          >
            {node.expanded ? (
              <FaChevronDown className="mr-1 text-gray-500" size={12} />
            ) : (
              <FaChevronRight className="mr-1 text-gray-500" size={12} />
            )}
            <span className="mr-1">{node.expanded ? "📂" : "📁"}</span>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={selectedPaths.includes(`folder-${node.folder_id}`)}
                onChange={() => handleCheckboxChange(node)}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-800">{node.folder_name}</span>
            </label>
          </div>
        </div>
        {node.expanded && (
          <div className="ml-4">
            {node.children.map((child) => renderFolderNode(child, depth + 1))}
            {node.codes.map((file) => (
              <div
                key={`code-${file.code_id}`}
                className="flex items-center py-1 pl-4"
              >
                <FaFile className="mr-2 text-gray-400" size={14} />
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedPaths.includes(`code-${file.code_id}`)}
                    onChange={() => handleCheckboxChange(`code-${file.code_id}`)}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{file.title}</span>
                </label>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderRemoteFiles = (files, depth = 0) => {
    const paddingLeft = depth * 20;

    if (!Array.isArray(files)) {
      return (
        <p className="text-sm text-gray-500" data-testid="error-message">
          폴더나 파일을 찾을 수 없습니다.
        </p>
      );
    }

    return (
      <ul className="list-none p-0" style={{ paddingLeft }}>
        {files.map((file) => {
          const isExpanded = expandedRemotePaths.includes(file.path);

          return (
            <li
              key={file.path || file.name}
              onContextMenu={(e) => handleContextMenu(e, file)}
              className="relative group"
            >
              {file.type === "dir" ? (
                <>
                  <div
                    className={`flex items-center cursor-pointer p-1 rounded transition-colors ${
                      destinationPath === file.path
                        ? "bg-blue-100 border-2 border-blue-500"
                        : "hover:bg-gray-100"
                    }`}
                    onClick={() => {
                      handleFolderSelect(file);
                      setExpandedRemotePaths((prev) =>
                        prev.includes(file.path)
                          ? prev.filter((p) => p !== file.path)
                          : [...prev, file.path]
                      );
                    }}
                    data-testid={`folder-${file.name}`}
                  >
                    {isExpanded ? (
                      <FaChevronDown className="mr-2 text-gray-600" size={14} />
                    ) : (
                      <FaChevronRight className="mr-2 text-gray-600" size={14} />
                    )}
                    <span className="mr-2">{isExpanded ? "📂" : "📁"}</span>
                    <span className="text-sm font-medium text-gray-800">{file.name}</span>
                  </div>
                  {isExpanded && file.contents && file.contents.length > 0 && (
                    <div className="ml-4">
                      {renderRemoteFiles(file.contents, depth + 1)}
                    </div>
                  )}
                </>
              ) : (
                <div
                  className="flex items-center cursor-pointer py-1 rounded hover:bg-gray-100"
                  onClick={() => handleFileClick(file)}
                  data-testid={`file-${file.name}`}
                >
                  <FaFile className="mr-2 text-gray-400" size={14} />
                  <span className="text-sm text-blue-600 hover:underline">{file.name}</span>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  const GithubConnectGuide = () => (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <h2 className="text-xl font-bold text-gray-800 mb-4">🔗 GitHub 연동 안내</h2>
      <p className="text-sm text-gray-600 mb-6 leading-relaxed">
        자율 코딩 프로젝트를 GitHub 원격 저장소에 연동하여 관리할 수 있습니다.<br />
        아직 GitHub 계정과 연동되어 있지 않습니다. 아래 버튼을 눌러 연동을 진행해 주세요.
      </p>
      <button
        onClick={() => (window.location.href = "http://localhost:8000/auth/social/github/login")}
        className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-700 transition-colors shadow-sm"
      >
        GitHub 계정 연동하기
      </button>
    </div>
  );

  const GithubRepoList = () => (
    <div className="w-full h-full bg-white flex flex-col rounded-none p-0 m-0">
      <div className="px-4 pt-4 pb-2 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-800">📂 내 GitHub 저장소</h2>
        <div className="flex flex-col space-y-2 mt-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-xs text-gray-600 border border-gray-300 px-3 py-1 rounded-md hover:bg-gray-100 transition-colors"
          >
            ➕ 새로운 저장소 만들기
          </button>
          <button
            onClick={handleOpenUploadModal}
            className="text-xs text-gray-600 border border-gray-300 px-3 py-1 rounded-md hover:bg-gray-100 transition-colors"
          >
            📤 저장소에 업로드하기
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <p className="text-sm text-gray-500">저장소 목록을 불러오는 중...</p>
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : repos.length === 0 ? (
          <p className="text-sm text-gray-500">저장소가 없습니다.</p>
        ) : (
          repos.map((repo) => (
            <li
              key={repo.id}
              onClick={() => window.open(repo.html_url, "_blank")}
              className="flex items-start gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <div className="mt-1 text-gray-500">
                <FaBookOpen size={14} />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap justify-between items-center mb-1">
                  <span className="text-sm text-blue-600 font-medium break-all">{repo.full_name}</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                    Public
                  </span>
                </div>
                <p className="text-xs text-gray-500 break-all">{repo.description || "설명 없음"}</p>
              </div>
            </li>
          ))
        )}
      </div>
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleUnlinkGithub}
          className="text-xs text-gray-600 border border-gray-300 px-3 py-1 rounded-md hover:bg-gray-100 transition-colors"
        >
          🔄 GitHub 계정 변경
        </button>
      </div>
    </div>
  );

  return (
    <div
      className="h-full"
      onClick={() => setMenuVisible(false)}
      onContextMenu={(e) => {
        e.preventDefault();
        setMenuVisible(false);
      }}
    >
      {isGithubConnected ? <GithubRepoList /> : <GithubConnectGuide />}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-200 ${
          isModalOpen ? "visible opacity-100" : "invisible opacity-0 pointer-events-none"
        }`}
      >
        <div className="bg-white p-6 rounded-lg w-96">
          <h3 className="text-lg font-semibold mb-4">새로운 저장소 만들기</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">저장소 이름</label>
            <input
              ref={nameInputRef}
              type="text"
              value={repoName}
              onChange={handleInputChange(setRepoName)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="저장소 이름을 입력하세요"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">설명</label>
            <input
              type="text"
              value={repoDescription}
              onChange={handleInputChange(setRepoDescription)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="저장소 설명을 입력하세요 (선택)"
            />
          </div>
          <div className="mb-4 flex items-center">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="mr-2"
            />
            <label className="text-sm font-medium">비공개 저장소</label>
          </div>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition"
            >
              취소
            </button>
            <button
              onClick={handleCreateRepo}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
              disabled={loading}
            >
              {loading ? "생성 중..." : "생성"}
            </button>
          </div>
        </div>
      </div>
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300 ${
          isUploadModalOpen ? "visible opacity-100" : "invisible opacity-0 pointer-events-none"
        }`}
      >
        <div className="bg-white p-6 rounded-lg shadow-lg w-4/5 h-4/5 flex flex-col">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">저장소에 업로드</h3>
          <div className="flex flex-1 overflow-hidden border border-gray-200 rounded-md">
            <div className="w-1/2 p-4 border-r border-gray-200 overflow-y-auto bg-gray-50">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">로컬 파일 구조</h4>
              {folderTree ? renderFolderNode(folderTree) : <p className="text-sm text-gray-500">폴더를 불러오는 중...</p>}
            </div>
            <div className="w-1/2 p-4 flex flex-col h-full overflow-hidden">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">원격 저장소</h4>
              <select
                onChange={(e) => {
                  try {
                    const repo = e.target.value ? JSON.parse(e.target.value) : null;
                    console.log("Selected repo:", repo?.full_name || "None");
                    handleRepoSelect(repo);
                  } catch (err) {
                    console.error("Failed to parse repo value:", err);
                    setError("저장소 선택 중 오류가 발생했습니다.");
                  }
                }}
                value={selectedRepo ? JSON.stringify(selectedRepo) : ""}
                className="w-full p-2 border border-gray-300 rounded-md mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                data-testid="repo-select"
              >
                <option value="">저장소를 선택하세요</option>
                {repos.map((repo) => (
                  <option key={repo.id} value={JSON.stringify(repo)}>{repo.full_name}</option>
                ))}
              </select>
              {selectedRepo && (
                <div className="flex flex-col flex-1 border border-gray-200 rounded-md overflow-hidden bg-gray-50">
                  <div className="p-3 border-b border-gray-200">
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">📁 업로드 경로</h5>
                    <input
                      type="text"
                      value={destinationPath}
                      onChange={(e) => setDestinationPath(e.target.value)}
                      placeholder="업로드 경로 (예: src/components)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      폴더를 클릭하거나 경로를 입력하여 업로드 위치를 지정하세요.
                    </p>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3" data-testid="file-list">
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">📁 저장소 파일 목록</h5>
                    {error && (
                      <p className="text-sm text-red-500" data-testid="error-message">
                        {error}
                      </p>
                    )}
                    {renderRemoteFiles(remoteRepoFiles)}
                  </div>
                  <div
                    className="flex-1 overflow-y-auto bg-white p-3 border-t border-gray-200"
                    data-testid="preview-content"
                    style={{ minHeight: "200px" }}
                  >
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">📄 파일 미리보기</h5>
                    {previewContent ? (
                      <pre className="text-xs whitespace-pre-wrap bg-gray-50 p-2 rounded-md border border-gray-200" data-testid="preview-text">
                        {previewContent}
                      </pre>
                    ) : (
                      <p className="text-xs text-gray-400" data-testid="preview-placeholder">
                        파일을 클릭하면 내용을 미리볼 수 있습니다.
                      </p>
                    )}
                    {previewContent && (
                      <button
                        onClick={() => {
                          console.log("Closing previewContent");
                          setPreviewContent(null);
                        }}
                        className="mt-2 px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors shadow-sm"
                      >
                        닫기
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <button
              onClick={() => {
                setIsUploadModalOpen(false);
                setPreviewContent(null);
                setDestinationPath("");
                setExpandedRemotePaths([]);
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors shadow-sm"
            >
              취소
            </button>
            <button
              onClick={handleUpload}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
              disabled={!selectedRepo || selectedPaths.length === 0}
            >
              업로드
            </button>
          </div>
          {isUploading && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg w-[300px] text-center">
                <p className="text-sm text-gray-700 mb-4">📤 파일 업로드 중입니다. 잠시만 기다려주세요...</p>
                <div className="loader border-t-4 border-blue-500 rounded-full w-8 h-8 animate-spin mx-auto mb-4"></div>
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors shadow-sm"
                  onClick={async () => {
                    try {
                      await githubApi.cancelUpload(selectedRepo.full_name, uploadSessionId);
                      alert("업로드가 취소되었습니다.");
                    } catch (err) {
                      console.error("Upload cancel failed:", err);
                      alert("업로드 취소 중 오류 발생");
                    } finally {
                      setIsUploading(false);
                      setIsUploadModalOpen(false);
                      setSelectedPaths([]);
                      setDestinationPath("");
                      setUploadedPaths([]);
                      setUploadSessionId(null);
                      setExpandedRemotePaths([]);
                    }
                  }}
                >
                  업로드 취소
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {menuVisible && <ContextMenu position={menuPosition} />}
    </div>
  );
};

export default SelfCodingGitPanel;