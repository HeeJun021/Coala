// frontend/src/components/project/CodeEditorPanel.jsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import {
  getFile,
  saveFile,
  stagePaths,
  commitChanges,
  getStatus,
} from "../../api/project_gitApi";
import { runProjectJs, runProjectPython } from "../../api/projectPreviewApi";
import ProjectGitExplorerPanel from "./projectgit/ProjectGitExploerPanel";
import ProjectGitPreviewPanel from "./projectgit/ProjectGitPreviewPanel";
import CommitModal from "./projectgit/CommitModal"; 

// CodeMirror v6
import CodeMirror from "@uiw/react-codemirror";
import { githubLight } from "@uiw/codemirror-theme-github";
import { javascript } from "@codemirror/lang-javascript";
import { html as htmlLang } from "@codemirror/lang-html";
import { css as cssLang } from "@codemirror/lang-css";
import { python as pythonLang } from "@codemirror/lang-python";
import { keymap } from "@codemirror/view"; // ⬅ Ctrl/Cmd+S 바인딩용

export default function CodeEditorPanel({ project, branch, onBranchChange }) {
  const projectId = project?.project_id;

  // UI/State
  const [showExplorer, setShowExplorer] = useState(true);
  const sidebarWidth = showExplorer ? 260 : 36;

  const [activePath, setActivePath] = useState("");
  const [content, setContent] = useState("");
  const [originalContent, setOriginalContent] = useState(""); // 마지막 저장/로드 상태
  const [baseSha, setBaseSha] = useState(null);
  const [encoding, setEncoding] = useState("utf-8");

  const [status, setStatus] = useState({
    staged: [],
    unstaged: [],
    has_uncommitted: false,
  });

  const [previewSrcDoc, setPreviewSrcDoc] = useState(null);
  const [previewFilename, setPreviewFilename] = useState("");
  const [showPreview, setShowPreview] = useState(true);

  const [isCommitModalOpen, setIsCommitModalOpen] = useState(false); // ✅ 모달 상태

  // 변경 여부 (파생 값)
  const unsaved = useMemo(
    () => content !== originalContent,
    [content, originalContent]
  );

  // 현재 파일 확장자
  const ext = useMemo(
    () => activePath?.split(".").pop()?.toLowerCase() || "",
    [activePath]
  );

  // 실행 가능 확장자
  const isRunnable = useMemo(() => {
    if (!activePath) return false;
    return ["js", "py", "html"].includes(ext);
  }, [activePath, ext]);

  // CodeMirror 언어 확장
  const cmLangExtensions = useMemo(() => {
    switch (ext) {
      case "js":
      case "jsx":
      case "ts":
      case "tsx":
        return [javascript({ jsx: true, typescript: ext.startsWith("ts") })];
      case "html":
        return [htmlLang()];
      case "css":
        return [cssLang()];
      case "py":
        return [pythonLang()];
      default:
        return []; // plain text
    }
  }, [ext]);

  const refreshStatus = useCallback(async () => {
    if (!projectId || !branch) return;
    const s = await getStatus(projectId, { branch });
    setStatus(s);
  }, [projectId, branch]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  // 파일 열기
  const handleOpenFile = async (path, fileData) => {
    setActivePath(path);
    const file = fileData || (await getFile(projectId, { path, branch }));
    const nextContent = file?.content ?? "";
    setContent(nextContent);
    setOriginalContent(nextContent); // 원본 스냅샷 갱신
    setBaseSha(file?.base_sha ?? null);
    setEncoding(file?.encoding ?? "utf-8");
    setPreviewSrcDoc(null);
    setPreviewFilename("");
  };

  // 저장
  const handleSave = useCallback(async () => {
    if (!activePath || !unsaved) return;
    await saveFile(projectId, {
      branch,
      path: activePath,
      content,
      encoding,
      expected_base_sha: baseSha ?? undefined,
    });
    setOriginalContent(content); // 저장 후 원본 갱신
    await refreshStatus();
  }, [
    activePath,
    unsaved,
    projectId,
    branch,
    content,
    encoding,
    baseSha,
    refreshStatus,
  ]);

  // ⌨ Ctrl/Cmd+S 단축키 (CodeMirror keymap)
  const saveKeymap = useMemo(
    () =>
      keymap.of([
        {
          key: "Mod-s", // Windows Ctrl+S / macOS Cmd+S
          preventDefault: true,
          run: () => {
            handleSave();
            return true; // 처리됨
          },
        },
      ]),
    [handleSave]
  );

  // stage/unstage/commit
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

  const handleCommit = async ({ title, message }) => {
    const fullMessage = `${title}\n\n${message}`;
    await commitChanges(projectId, {
      branch,
      message: fullMessage,
      useStagedOnly: true,
    });
    setBaseSha(null);
    await refreshStatus();
  };

  // 실행
  const handleRun = async () => {
    if (!isRunnable) return;
    try {
      if (ext === "js") {
        const result = await runProjectJs(content);
        setPreviewSrcDoc(result);
      } else if (ext === "py") {
        const result = await runProjectPython(content);
        setPreviewSrcDoc(result);
      } else if (ext === "html") {
        setPreviewSrcDoc(content);
      }
      setPreviewFilename(activePath);
      setShowPreview(true);
    } catch (err) {
      console.error(`${ext.toUpperCase()} 실행 실패`, err);
      setPreviewSrcDoc({
        success: false,
        stdout: "",
        stderr:
          err?.response?.data?.detail ||
          err.message ||
          "알 수 없는 오류가 발생했습니다.",
      });
      setPreviewFilename(activePath);
      setShowPreview(true);
    }
  };

  const onCodeChange = useCallback((value) => {
    setContent(value);
  }, []);

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* 상단 바 */}
      <div className="flex flex-row items-stretch gap-2 px-4 py-2 border-b">
        <button
          className="text-gray-500 hover:text-gray-800 my-auto"
          onClick={() => setShowExplorer((v) => !v)}
          title={showExplorer ? "탐색기 접기" : "탐색기 펼치기"}
        >
          {showExplorer ? <FaChevronLeft /> : <FaChevronRight />}
        </button>

        <div className="text-sm text-gray-600 flex items-center flex-shrink min-w-0">
          <span className="font-medium truncate">
            {activePath || "파일을 선택하세요"}
          </span>
          <div className="w-px bg-gray-300 mx-3 self-stretch" />
          <span className="flex-shrink-0">
            {branch || "브랜치 로딩 중..."}
          </span>
          <div className="w-px bg-gray-300 mx-3 self-stretch" />
          <span className="flex-shrink-0">
            Staged: {status.staged?.length || 0}
          </span>
          <span className="ml-2 flex-shrink-0">
            Unstaged: {status.unstaged?.length || 0}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2 flex-shrink-0">
          <button
            className="text-[12px] text-blue-600 hover:text-blue-800 justify-center px-2 py-0.5 w-16 h-6 border border-blue-300 rounded disabled:opacity-50"
            onClick={handleSave}
            disabled={!activePath || !unsaved}
            title={unsaved ? "저장" : "변경 사항 없음"}
          >
            Save
          </button>
          <button
            className="text-[12px] text-purple-600 hover:text-purple-800 px-2 py-0.5 w-16 h-6 border border-purple-300 rounded flex items-center justify-center gap-1 disabled:opacity-50"
            onClick={handleRun}
            disabled={!activePath || !isRunnable}
          >
            Run
          </button>
          <button
            className="text-[12px] text-green-600 hover:text-green-800 justify-center px-2 py-0.5 w-16 h-6 border border-green-300 rounded disabled:opacity-50"
            onClick={handleStage}
            disabled={!activePath}
          >
            Staging
          </button>
          <button
            className="text-[12px] text-orange-500 hover:text-orange-700 justify-center px-2 py-0.5 w-16 h-6 border border-orange-300 rounded disabled:opacity-50"
            onClick={handleUnstage}
            disabled={!activePath}
          >
            Unstage
          </button>
          <button
            className="text-[12px] text-gray-700 hover:text-black justify-center px-2 py-0.5 w-16 h-6 border border-gray-300 rounded disabled:opacity-50"
            onClick={() => setIsCommitModalOpen(true)}
            disabled={status.staged?.length === 0}
          >
            Commit
          </button>
        </div>
      </div>

      {/* 본문 (탐색기, 에디터, 미리보기) */}
      <div className="flex flex-1 w-full min-h-0">
        <div
          className="border-r transition-all duration-200 ease-out flex-shrink-0"
          style={{ width: sidebarWidth }}
        >
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

        {/* 에디터 */}
        <div className="flex-1 min-w-0 h-full">
          {!activePath ? (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              {/* 좌측에서 파일을 선택하면 편집할 수 있어요 */}
              좌측에서 파일을 선택하면 편집할 수 있어요
            </div>
          ) : (
            <CodeMirror
              value={content}
              height="100%"
              theme={githubLight}
              // 언어 + Ctrl/Cmd+S keymap
              extensions={[...cmLangExtensions, saveKeymap]}
              onChange={onCodeChange}
              style={{ height: "100%" }}
            />
          )}
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

      {/* Commit Modal */}
      {isCommitModalOpen && (
        <CommitModal
          onClose={() => setIsCommitModalOpen(false)}
          onSubmit={handleCommit}
        />
      )}
    </div>
  );
}
