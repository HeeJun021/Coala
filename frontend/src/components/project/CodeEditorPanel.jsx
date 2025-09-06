import React, { useEffect, useState, useCallback, useMemo } from "react";
import { FaChevronLeft, FaChevronRight, FaPlay } from "react-icons/fa";
import {
  getRepoInfo,
  getFile,
  saveFile,
  stagePaths,
  commitChanges,
  getStatus,
} from "../../api/project_gitApi";
// ▼▼▼ [수정] 새로 만든 프로젝트용 preview API 임포트 ▼▼▼
import { runProjectJs, runProjectPython } from "../../api/projectPreviewApi";
import ProjectGitExplorerPanel from "./projectgit/ProjectGitExploerPanel";
import ProjectGitPreviewPanel from "./projectgit/ProjectGitPreviewPanel";

export default function CodeEditorPanel({ project }) {
  const projectId = project?.project_id;
  const [branch, setBranch] = useState(null);

  const [showExplorer, setShowExplorer] = useState(true);
  const sidebarWidth = showExplorer ? 260 : 36;

  const [activePath, setActivePath] = useState("");
  const [content, setContent] = useState("");
  const [baseSha, setBaseSha] = useState(null);
  const [encoding, setEncoding] = useState("utf-8");

  const [status, setStatus] = useState({ staged: [], unstaged: [], has_uncommitted: false });
  
  const [previewSrcDoc, setPreviewSrcDoc] = useState(null);
  const [previewFilename, setPreviewFilename] = useState("");
  const [showPreview, setShowPreview] = useState(true);

  const loadRepoInfo = useCallback(async () => {
    if (!projectId) return;
    const info = await getRepoInfo(projectId);
    setBranch(info.default_branch || "main");
  }, [projectId]);

  const refreshStatus = useCallback(async () => {
    if (!projectId || !branch) return;
    const s = await getStatus(projectId, { branch });
    setStatus(s);
  }, [projectId, branch]);

  useEffect(() => { loadRepoInfo(); }, [loadRepoInfo]);
  useEffect(() => { refreshStatus(); }, [refreshStatus]);

  const handleOpenFile = async (path, fileData) => {
    setActivePath(path);
    const file = fileData || await getFile(projectId, { path, branch });
    setContent(file?.content ?? "");
    setBaseSha(file?.base_sha ?? null);
    setEncoding(file?.encoding ?? "utf-8");
    setPreviewSrcDoc(null);
    setPreviewFilename("");
  };

  const handleSave = async () => {
    if (!activePath) return;
    await saveFile(projectId, {
      branch, path: activePath, content, encoding,
      expected_base_sha: baseSha ?? undefined,
    });
    await refreshStatus();
  };

  const handleStage = async () => {
    if (!activePath) return;
    await stagePaths(projectId, { branch, paths: [activePath], staged: true });
    await refreshStatus();
  };

  const handleUnstage = async () => {
    if (!activePath) return;
    await stagePaths(projectId, { branch, paths: [activePath], staged: false });
    await refreshStatus();
  };

  const handleCommit = async () => {
    const message = window.prompt("커밋 메시지");
    if (!message) return;
    await commitChanges(projectId, { branch, message, useStagedOnly: true });
    setBaseSha(null);
    await refreshStatus();
  };

  const isRunnable = useMemo(() => {
    if (!activePath) return false;
    const extension = activePath.split('.').pop()?.toLowerCase();
    return ['js', 'py', 'html'].includes(extension);
  }, [activePath]);

  const handleRun = async () => {
    if (!isRunnable) return;
    const extension = activePath.split(".").pop();
    
    let result = null; 

    try {
      if (extension === "js") {
        result = await runProjectJs(content);
      } else if (extension === "py") {
        result = await runProjectPython(content);
      } else if (extension === "html") {
        result = content;
      }
      
      setPreviewSrcDoc(result);
      setPreviewFilename(activePath);
      setShowPreview(true);

    } catch (err) {
      console.error(`${extension.toUpperCase()} 실행 실패`, err);
      setPreviewSrcDoc({
        success: false,
        stdout: "",
        stderr: err?.response?.data?.detail || err.message || "알 수 없는 오류가 발생했습니다.",
      });
      setPreviewFilename(activePath);
      setShowPreview(true);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* 상단 바 */}
      <div className="flex flex-row items-stretch gap-2 px-4 py-2 border-b">
        <button
          className="text-gray-500 hover:text-gray-800 my-auto"
          onClick={() => setShowExplorer(v => !v)}
          title={showExplorer ? "탐색기 접기" : "탐색기 펼치기"}
        >
          {showExplorer ? <FaChevronLeft /> : <FaChevronRight />}
        </button>

        <div className="text-sm text-gray-600 flex items-center flex-shrink min-w-0">
          <span className="font-medium truncate">{activePath || "파일을 선택하세요"}</span>
          {/* ▼▼▼ [수정] h-4 제거하여 구분선이 세로로 꽉 차도록 변경 ▼▼▼ */}
          <div className="w-px bg-gray-300 mx-3 self-stretch"></div>
          <span className="flex-shrink-0">{branch}</span>
          <div className="w-px bg-gray-300 mx-3 self-stretch"></div>
          <span className="flex-shrink-0">Staged: {status.staged?.length || 0}</span>
          <span className="ml-2 flex-shrink-0">Unstaged: {status.unstaged?.length || 0}</span>
        </div>

        <div className="ml-auto flex items-center gap-2 flex-shrink-0">
          <button className="text-[12px] text-blue-600 hover:text-blue-800 px-2 py-0.5 border border-blue-300 rounded disabled:opacity-50"
                  onClick={handleSave} disabled={!activePath}>💾 저장</button>
          <button className="text-[12px] text-green-600 hover:text-green-800 px-2 py-0.5 border border-green-300 rounded disabled:opacity-50"
                  onClick={handleStage} disabled={!activePath}>Staging</button>
          <button className="text-[12px] text-orange-500 hover:text-orange-700 px-2 py-0.5 border border-orange-300 rounded disabled:opacity-50"
                  onClick={handleUnstage} disabled={!activePath}>Unstage</button>
          <button className="text-[12px] text-gray-700 hover:text-black px-2 py-0.5 border border-gray-300 rounded disabled:opacity-50"
                  onClick={handleCommit} disabled={status.staged?.length === 0}>Commit</button>
          <button 
            className="text-[12px] text-purple-600 hover:text-purple-800 px-2 py-0.5 border border-purple-300 rounded flex items-center gap-1 disabled:opacity-50"
            onClick={handleRun} disabled={!activePath || !isRunnable}>
            <FaPlay size={8} /> 실행
          </button>
        </div>
      </div>

      {/* 본문 (탐색기, 에디터, 미리보기) */}
      <div className="flex flex-1 w-full min-h-0">
        <div className="border-r transition-all duration-200 ease-out flex-shrink-0"
             style={{ width: sidebarWidth }}>
          {showExplorer && (
            <ProjectGitExplorerPanel
              className="h-full overflow-auto"
              projectId={projectId}
              branch={branch}
              onOpenFile={handleOpenFile}
              rootLabel={branch ? `root (${branch})` : "root"}
            />
          )}
        </div>

        <div className="relative flex-1 p-4 min-w-0 h-full">
          <textarea
            className="w-full h-full border rounded p-3 text-sm font-mono outline-none resize-none disabled:bg-gray-50 disabled:text-gray-400"
            placeholder={activePath ? "// 코드를 입력하세요" : "// 좌측에서 파일을 선택하면 편집할 수 있어요"}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={!activePath}
          />
        </div>

        {showPreview && (
          <div className="border-l flex-1 min-w-0 h-full">
            <ProjectGitPreviewPanel
              previewFilename={previewFilename}
              previewSrcDoc={previewSrcDoc}
            />
          </div>
        )}
      </div>
    </div>
  );
}

